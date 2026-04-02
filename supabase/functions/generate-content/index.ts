import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://daymytime.com",
  "https://www.daymytime.com",
  "https://daymytime.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    // Authenticate: require valid JWT and admin role
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

    // Check admin role
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

    // For cron/scheduled calls, check admin_settings for auto_publish config
    if (cron) {
      const db = serviceClient;

      const { data: setting } = await db
        .from("admin_settings")
        .select("value")
        .eq("key", "auto_publish_content")
        .maybeSingle();

      const config = setting?.value as any;
      if (!config?.enabled) {
        return new Response(JSON.stringify({ message: "Auto-publish disabled" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const results: string[] = [];
      const today = new Date().toISOString().split("T")[0];

      if (config.history) {
        const content = await generateAI(LOVABLE_API_KEY, "history");
        if (content) {
          const slug = generateSlug(content.title, today);
          await db.from("history_posts").insert({
            title: content.title, slug, content: content.content,
            excerpt: content.excerpt || content.content.slice(0, 160),
            seo_title: content.seo_title, meta_description: content.meta_description,
            keywords: content.keywords, status: "published", publish_date: today,
            social_instagram: content.social_instagram || null,
            social_twitter: content.social_twitter || null,
            social_linkedin: content.social_linkedin || null,
          });
          results.push("history");
        }
      }

      if (config.tips) {
        const content = await generateAI(LOVABLE_API_KEY, "tip");
        if (content) {
          const slug = generateSlug(content.title, today);
          await db.from("daily_tips").insert({
            title: content.title, slug, content: content.content,
            excerpt: content.excerpt || content.content.slice(0, 160),
            seo_title: content.seo_title, meta_description: content.meta_description,
            keywords: content.keywords, status: "published", publish_date: today,
            social_instagram: content.social_instagram || null,
            social_twitter: content.social_twitter || null,
            social_linkedin: content.social_linkedin || null,
          });
          results.push("tip");
        }
      }

      return new Response(JSON.stringify({ published: results }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Manual schedule: generate and auto-publish for a specific date
    if (schedule && auto_publish) {
      const db = serviceClient;
      const targetDate = publish_date || new Date().toISOString().split("T")[0];
      const results: string[] = [];

      const types = type === "both" ? ["history", "tip"] : [type];
      for (const t of types) {
        const content = await generateAI(LOVABLE_API_KEY, t);
        if (content) {
          const slug = generateSlug(content.title, targetDate);
          const tableName = t === "history" ? "history_posts" : "daily_tips";
          await db.from(tableName).insert({
            title: content.title, slug, content: content.content,
            excerpt: content.excerpt || content.content.slice(0, 160),
            seo_title: content.seo_title, meta_description: content.meta_description,
            keywords: content.keywords, status: "published", publish_date: targetDate,
            social_instagram: content.social_instagram || null,
            social_twitter: content.social_twitter || null,
            social_linkedin: content.social_linkedin || null,
          });
          results.push(t);
        }
      }

      return new Response(JSON.stringify({ published: results }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Standard: generate content and return for review
    const content = await generateAI(LOVABLE_API_KEY, type === "history" ? "history" : "tip");
    return new Response(JSON.stringify(content), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

function generateSlug(title: string, date: string): string {
  const d = new Date(date);
  const month = d.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const day = d.getDate();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${month}-${day}-${slug}`;
}

async function generateAI(apiKey: string, type: string) {
  const today = new Date();
  const month = today.toLocaleString("en-US", { month: "long" });
  const day = today.getDate();
  const year = today.getFullYear();
  const formattedDate = `${day.toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${year}`;

  let systemPrompt: string;
  if (type === "history") {
    systemPrompt = `You are a world-class history writer and SEO content strategist for DayMyTime – Smart Visual Scheduler, a productivity website for students, professionals, entrepreneurs, and busy individuals.

Today's date: ${month} ${day}, ${year} (${formattedDate})

SMART CONTENT SELECTION RULE:
Before writing, SELECT a historical event from ${month} ${day} based on:
• Trending relevance (AI, tech, leadership, innovation, science)
• High curiosity factor (wars, discoveries, famous personalities, world-changing moments)
• Strong modern connection to productivity, mindset, or technology
• Emotional storytelling potential
Avoid low-impact, boring, or obscure events.

WRITE a 400-word "This Day in History" article following these rules:

STYLE:
• Simple, engaging English — mobile-first readability
• Short paragraphs (2–3 lines max)
• Storytelling style (NOT textbook)
• Start with a powerful curiosity/emotion hook in the first line
• Explain the event clearly with key people, dates, and context
• Highlight WHY it matters today — connect to modern life (AI, productivity, mindset, innovation)

STRUCTURE the content field as follows (use clear paragraph breaks with \\n\\n):
1. 🔥 Curiosity hook opening line
2. Event story (who, what, when, where, why)
3. Key people involved and their impact
4. "Modern Lesson" section — what readers can learn and apply today
5. End with a thought-provoking question to boost comments (prefix with 👉)
6. Add a share-trigger sentence: "Share this with a friend who loves history!"
7. Include 2 natural internal links as text references:
   - "Check out today's productivity tip at DayMyTime"
   - "Join our giveaway for a chance to win exciting prizes"

Return a JSON object with these fields:
- title: Compelling, high-CTR article title (max 80 chars), format: "This Day in History – ${formattedDate}: [Event]"
- content: The full 400-word article as described above. Use \\n\\n for paragraph breaks.
- excerpt: A 2-sentence curiosity-driven summary (max 160 chars)
- seo_title: SEO-optimized title with keyword front-loading (max 60 chars)
- meta_description: Compelling meta description with call-to-action (150-160 chars)
- keywords: 10-12 comma-separated SEO keywords including "this day in history", "today in history", date-specific terms, and topic keywords
- slug_suggestion: URL-friendly slug
- social_instagram: Instagram caption with emojis (engaging, 2-3 lines)
- social_twitter: Twitter/X caption (short viral hook, max 280 chars)
- social_linkedin: LinkedIn caption (professional insight, 2-3 lines)

IMPORTANT: Return ONLY valid JSON. No markdown fences. No extra text.`;
  } else {
    systemPrompt = `You are a world-class productivity expert and SEO content strategist for DayMyTime – Smart Visual Scheduler, a productivity website for students, professionals, entrepreneurs, and busy individuals.

Today's date: ${month} ${day}, ${year}

WRITE a 150-200 word "Daily Productivity Tip" following these rules:

TOPIC SELECTION:
Focus on modern, trending productivity techniques:
• Deep work & flow states
• AI-powered productivity tools
• Time blocking & calendar management
• Focus techniques (Pomodoro, 90-min cycles)
• Energy management & peak hours
• Digital minimalism & distraction control
• Smart scheduling & automation
Pick something PRACTICAL that the reader can use TODAY.

STYLE:
• Simple, engaging English — mobile-first readability
• Short paragraphs (2–3 lines max)
• Friendly, motivating tone
• Start with a relatable hook

STRUCTURE the content field (use \\n\\n for paragraph breaks):
1. Hook: Relatable problem or curiosity opener
2. The tip explained simply with 2-3 specific steps
3. "⚡ Quick Action" — one simple step the reader can do RIGHT NOW
4. End with a motivating closer
5. Include a natural reference: "Plan your day visually with DayMyTime's smart scheduler"
6. Add: "Join our giveaway for exciting prizes!"

Return a JSON object with these fields:
- title: Catchy, benefit-driven tip title (max 80 chars)
- content: The full 150-200 word tip as described above. Use \\n\\n for paragraph breaks.
- excerpt: 1-sentence actionable preview (max 160 chars)
- seo_title: SEO-optimized title with keyword front-loading (max 60 chars)
- meta_description: Compelling meta description (150-160 chars)
- keywords: 10-12 comma-separated SEO keywords including "productivity tip", "time management", and topic-specific terms
- slug_suggestion: URL-friendly slug
- social_instagram: Instagram caption with emojis (engaging, 2-3 lines)
- social_twitter: Twitter/X caption (short viral hook, max 280 chars)
- social_linkedin: LinkedIn caption (professional insight, 2-3 lines)

IMPORTANT: Return ONLY valid JSON. No markdown fences. No extra text.`;
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
        { role: "user", content: `Generate ${type === "history" ? `a trending, viral-worthy "This Day in History" article` : `a modern, actionable daily productivity tip`} for ${month} ${day}, ${year}. Make it highly engaging, SEO-optimized, and shareable.` }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Try again later.");
    if (response.status === 402) throw new Error("Credits required. Top up in Settings.");
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    throw new Error("AI generation failed");
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { title: "Generated Content", content: raw, excerpt: raw.slice(0, 160) };
  }
}
