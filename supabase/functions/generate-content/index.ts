import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════
// GOD MODE – Autonomous AI Content Engine for DayMyTime
// Features: Dedup, Memory, Retry, Analytics-Informed, Self-Learning
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  "https://daymytime.com",
  "https://www.daymytime.com",
  "https://daymytime.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  // Allow any lovable preview/project origin
  if (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".lovableproject.com") ||
    origin.endsWith(".lovable.app")
  ) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    };
  }
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function log(level: string, msg: string, data?: unknown) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [GOD-MODE] [${level}] ${msg}`, data ? JSON.stringify(data) : "");
}

// ─── Memory System: fetch past titles/keywords to avoid repetition ───
async function fetchMemory(db: any) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [historyRes, tipsRes] = await Promise.all([
    db.from("history_posts").select("title, keywords, slug, publish_date")
      .gte("publish_date", thirtyDaysAgo).order("publish_date", { ascending: false }).limit(30),
    db.from("daily_tips").select("title, keywords, slug, publish_date")
      .gte("publish_date", thirtyDaysAgo).order("publish_date", { ascending: false }).limit(30),
  ]);

  const pastHistoryTitles = (historyRes.data || []).map((p: any) => p.title);
  const pastTipTitles = (tipsRes.data || []).map((p: any) => p.title);
  const pastKeywords = [...(historyRes.data || []), ...(tipsRes.data || [])]
    .map((p: any) => p.keywords).filter(Boolean);

  return { pastHistoryTitles, pastTipTitles, pastKeywords };
}

// ─── Analytics Agent: find top-performing topics ───
async function fetchTopPerformingTopics(db: any) {
  const { data: topViews } = await db
    .from("page_views")
    .select("page_path")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!topViews?.length) return [];

  const pathCounts: Record<string, number> = {};
  for (const v of topViews) {
    pathCounts[v.page_path] = (pathCounts[v.page_path] || 0) + 1;
  }
  return Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, count]) => ({ path, views: count }));
}

// ─── Duplicate Prevention ───
async function isDuplicate(db: any, table: string, targetDate: string): Promise<boolean> {
  const { data } = await db.from(table).select("id").eq("publish_date", targetDate).limit(1);
  return (data?.length || 0) > 0;
}

// ─── Retry wrapper for AI calls ───
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log("INFO", `${label} attempt ${attempt}/${MAX_RETRIES}`);
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      log("WARN", `${label} attempt ${attempt} failed: ${lastError.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw lastError!;
}

// ─── Insert post with validation ───
async function insertPost(db: any, table: string, content: any, targetDate: string) {
  if (!content?.title || !content?.content) {
    log("ERROR", `Invalid content for ${table} – missing title or content`);
    throw new Error(`AI returned invalid content for ${table}`);
  }

  const slug = generateSlug(content.title, targetDate);

  const { error } = await db.from(table).insert({
    title: content.title,
    slug,
    content: content.content,
    excerpt: (content.excerpt || content.content.slice(0, 160)).slice(0, 300),
    seo_title: content.seo_title || null,
    meta_description: content.meta_description || null,
    keywords: content.keywords || null,
    status: "published",
    publish_date: targetDate,
    social_instagram: content.social_instagram || null,
    social_twitter: content.social_twitter || null,
    social_linkedin: content.social_linkedin || null,
  });

  if (error) {
    log("ERROR", `DB insert failed for ${table}`, error);
    throw new Error(`Failed to insert into ${table}: ${error.message}`);
  }

  log("INFO", `✅ Published to ${table}: "${content.title}"`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await serviceClient
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { type, schedule, publish_date, auto_publish, cron } = body;
    const db = serviceClient;

    // ─── Fetch memory + analytics for smarter generation ───
    const [memory, topTopics] = await Promise.all([
      fetchMemory(db),
      fetchTopPerformingTopics(db),
    ]);

    log("INFO", `Memory loaded: ${memory.pastHistoryTitles.length} history, ${memory.pastTipTitles.length} tips`);
    log("INFO", `Top topics: ${topTopics.map(t => t.path).join(", ") || "none yet"}`);

    // ═══ CRON / AUTO-PUBLISH MODE ═══
    if (cron) {
      const { data: setting } = await db
        .from("admin_settings").select("value").eq("key", "auto_publish_content").maybeSingle();

      const config = setting?.value as any;
      if (!config?.enabled) {
        return new Response(JSON.stringify({ message: "Auto-publish disabled" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const today = new Date().toISOString().split("T")[0];
      const results: string[] = [];
      const skipped: string[] = [];

      if (config.history) {
        if (await isDuplicate(db, "history_posts", today)) {
          log("WARN", `⚠️ History post already exists for ${today} – skipping`);
          skipped.push("history (duplicate)");
        } else {
          const content = await withRetry(
            () => generateAI(LOVABLE_API_KEY, "history", memory, topTopics),
            "History generation"
          );
          await insertPost(db, "history_posts", content, today);
          results.push("history");
        }
      }

      if (config.tips) {
        if (await isDuplicate(db, "daily_tips", today)) {
          log("WARN", `⚠️ Tip already exists for ${today} – skipping`);
          skipped.push("tip (duplicate)");
        } else {
          const content = await withRetry(
            () => generateAI(LOVABLE_API_KEY, "tip", memory, topTopics),
            "Tip generation"
          );
          await insertPost(db, "daily_tips", content, today);
          results.push("tip");
        }
      }

      log("INFO", `🏁 GOD MODE cron complete. Published: [${results}] Skipped: [${skipped}]`);
      return new Response(JSON.stringify({ published: results, skipped }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ═══ MANUAL SCHEDULE + AUTO-PUBLISH ═══
    if (schedule && auto_publish) {
      const targetDate = publish_date || new Date().toISOString().split("T")[0];
      const results: string[] = [];
      const skipped: string[] = [];

      const types = type === "both" ? ["history", "tip"] : [type];
      for (const t of types) {
        const tableName = t === "history" ? "history_posts" : "daily_tips";
        if (await isDuplicate(db, tableName, targetDate)) {
          log("WARN", `⚠️ ${t} already exists for ${targetDate} – skipping`);
          skipped.push(`${t} (duplicate)`);
          continue;
        }
        const content = await withRetry(
          () => generateAI(LOVABLE_API_KEY, t, memory, topTopics),
          `${t} generation`
        );
        await insertPost(db, tableName, content, targetDate);
        results.push(t);
      }

      return new Response(JSON.stringify({ published: results, skipped }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ═══ STANDARD: generate content for review ═══
    const content = await withRetry(
      () => generateAI(LOVABLE_API_KEY, type === "history" ? "history" : "tip", memory, topTopics),
      "Manual generation"
    );
    return new Response(JSON.stringify(content), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    log("ERROR", "generate-content error", e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function generateSlug(title: string, date: string): string {
  const d = new Date(date);
  const month = d.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const day = d.getDate();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${month}-${day}-${slug}`;
}

// ═══════════════════════════════════════════════════════════════
// GOD MODE AI GENERATION ENGINE
// ═══════════════════════════════════════════════════════════════

interface Memory {
  pastHistoryTitles: string[];
  pastTipTitles: string[];
  pastKeywords: string[];
}

interface TopTopic {
  path: string;
  views: number;
}

async function generateAI(apiKey: string, type: string, memory: Memory, topTopics: TopTopic[]) {
  const today = new Date();
  const month = today.toLocaleString("en-US", { month: "long" });
  const day = today.getDate();
  const year = today.getFullYear();
  const formattedDate = `${day.toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${year}`;

  // Build memory context for the AI
  const pastTitles = type === "history" ? memory.pastHistoryTitles : memory.pastTipTitles;
  const memoryBlock = pastTitles.length > 0
    ? `\n\n🧠 MEMORY – AVOID THESE RECENT TITLES (do NOT repeat similar topics):\n${pastTitles.slice(0, 15).map(t => `• "${t}"`).join("\n")}`
    : "";

  const recentKeywords = memory.pastKeywords.slice(0, 10).join("; ");
  const keywordBlock = recentKeywords
    ? `\n\nRECENT KEYWORDS USED (diversify from these): ${recentKeywords}`
    : "";

  const analyticsBlock = topTopics.length > 0
    ? `\n\n📊 ANALYTICS INSIGHT – Top performing pages recently:\n${topTopics.map(t => `• ${t.path} (${t.views} views)`).join("\n")}\nLean into similar themes that drive traffic.`
    : "";

  let systemPrompt: string;

  if (type === "history") {
    systemPrompt = `You are the GOD MODE content engine for DayMyTime – Smart Visual Scheduler. You are a world-class historian, storyteller, SEO strategist, and viral content creator combined into one autonomous system.

Today's date: ${month} ${day}, ${year} (${formattedDate})
${memoryBlock}${keywordBlock}${analyticsBlock}

═══ DECISION ENGINE ═══
Before writing, you MUST:
1. SCAN all major historical events on ${month} ${day} across centuries
2. SCORE each event on: Trending Relevance (AI, tech, leadership, innovation) × Curiosity Factor × Modern Connection × Emotional Impact × Monetization Potential
3. SELECT the event with the HIGHEST composite score
4. VERIFY it's not in the recent titles list above

═══ CONTENT GENERATION ═══
Write a 400-500 word "This Day in History" masterpiece:

STYLE RULES:
• Cinematic storytelling — NOT textbook
• Mobile-first: short paragraphs (2-3 lines max)
• Power words in every paragraph
• First sentence = irresistible curiosity hook
• Every paragraph must pull the reader to the next

STRUCTURE (use \\n\\n for breaks):
1. 🔥 HOOK — A jaw-dropping opening line that creates instant curiosity
2. THE STORY — Vivid retelling with sensory details, dialogue if possible
3. KEY PLAYERS — Who was involved and their lasting impact
4. THE TURNING POINT — The dramatic moment that changed everything
5. 💡 MODERN LESSON — Direct connection to today's productivity, AI, business, or mindset
6. ⚡ ACTIONABLE TAKEAWAY — One thing the reader can do TODAY inspired by this event
7. 👉 ENGAGEMENT QUESTION — Thought-provoking question to spark comments
8. 🔗 INTERNAL LINKS (natural text):
   - "Boost your productivity with today's tip on DayMyTime"
   - "Join our giveaway for a chance to win exciting prizes!"
9. SHARE TRIGGER — "Share this mind-blowing history with someone who needs to read it! 🚀"

═══ SEO ENGINE ═══
- Title must be < 80 chars, high-CTR, format: "This Day in History – ${formattedDate}: [Compelling Event]"
- Front-load primary keyword in seo_title
- Meta description: 150-160 chars with CTA
- 10-12 diverse keywords covering: date, event, theme, "this day in history", "today in history"

═══ SOCIAL DISTRIBUTION ═══
Generate platform-optimized captions:
- Instagram: Engaging + emojis + storytelling hook + hashtags (2-3 lines)
- Twitter/X: Viral hook + key fact (max 280 chars)
- LinkedIn: Professional insight angle + lesson (2-3 lines)

Return a JSON object with fields: title, content, excerpt, seo_title, meta_description, keywords, slug_suggestion, social_instagram, social_twitter, social_linkedin

CRITICAL: Return ONLY valid JSON. No markdown fences. No extra text.`;
  } else {
    systemPrompt = `You are the GOD MODE productivity engine for DayMyTime – Smart Visual Scheduler. You combine the wisdom of Cal Newport, James Clear, Ali Abdaal, and the latest AI productivity research into one autonomous content system.

Today's date: ${month} ${day}, ${year}
${memoryBlock}${keywordBlock}${analyticsBlock}

═══ TOPIC DECISION ENGINE ═══
SCAN trending productivity topics and SELECT based on:
1. Relevance to current season/time of year
2. Trending on social media (AI tools, deep work, automation)
3. High shareability potential
4. Practical applicability (can be done TODAY)
5. NOT in the recent titles list above

TOPIC CATEGORIES (rotate daily):
• 🧠 Deep Work & Flow States
• 🤖 AI-Powered Productivity (ChatGPT, Notion AI, automation)
• ⏰ Time Blocking & Calendar Mastery
• 🎯 Focus Techniques (Pomodoro, 90-min sprints, 2-min rule)
• ⚡ Energy Management & Peak Performance
• 📱 Digital Minimalism & Screen Time Control
• 🗓️ Smart Scheduling & Weekly Planning
• 💪 Habit Stacking & Atomic Habits
• 🧘 Mindfulness & Mental Clarity for Productivity

═══ CONTENT GENERATION ═══
Write a 200-250 word tip that is INSTANTLY actionable:

STYLE:
• Conversational, like advice from a smart friend
• Mobile-first: short paragraphs (2-3 lines max)
• Start with a relatable pain point or surprising fact
• Include a specific, named technique or tool

STRUCTURE (use \\n\\n):
1. 🎯 HOOK — Relatable problem or surprising stat
2. THE TECHNIQUE — Named method explained in 2-3 clear steps
3. 🔬 WHY IT WORKS — Brief science/psychology behind it
4. ⚡ QUICK ACTION — ONE specific thing to do in the next 5 minutes
5. 💪 MOTIVATOR — Inspiring closer that builds momentum
6. 🔗 CTA: "Plan your day visually with DayMyTime's smart scheduler"
7. 🎁 "Join our giveaway for exciting prizes!"

═══ SEO + SOCIAL ═══
Same rules as history: high-CTR title, front-loaded keywords, platform-specific social captions.

Return a JSON object with fields: title, content, excerpt, seo_title, meta_description, keywords, slug_suggestion, social_instagram, social_twitter, social_linkedin

CRITICAL: Return ONLY valid JSON. No markdown fences. No extra text.`;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `[GOD MODE] Generate ${type === "history"
            ? `the most viral, trending "This Day in History" article for ${month} ${day}, ${year}`
            : `the most actionable, shareable productivity tip for ${month} ${day}, ${year}`
          }. Use your Decision Engine to pick the BEST topic. Ensure it's unique from recent posts. Optimize for SEO, engagement, and shareability. Execute at maximum quality.`
        },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Try again later.");
    if (response.status === 402) throw new Error("Credits required. Top up in Settings.");
    const t = await response.text();
    log("ERROR", `AI gateway error: ${response.status}`, t);
    throw new Error(`AI generation failed (${response.status})`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    log("INFO", `AI generated: "${parsed.title}"`);
    return parsed;
  } catch {
    log("WARN", "AI returned non-JSON, wrapping raw content");
    return { title: "Generated Content", content: raw, excerpt: raw.slice(0, 160) };
  }
}
