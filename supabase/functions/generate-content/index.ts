import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { type, schedule, publish_date, auto_publish, cron } = body;

    // For cron/scheduled calls, check admin_settings for auto_publish config
    if (cron) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const db = createClient(supabaseUrl, supabaseKey);

      const { data: setting } = await db
        .from("admin_settings")
        .select("value")
        .eq("key", "auto_publish_content")
        .maybeSingle();

      const config = setting?.value as any;
      if (!config?.enabled) {
        return new Response(JSON.stringify({ message: "Auto-publish disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          });
          results.push("tip");
        }
      }

      return new Response(JSON.stringify({ published: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Manual schedule: generate and auto-publish for a specific date
    if (schedule && auto_publish) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const db = createClient(supabaseUrl, supabaseKey);
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
          });
          results.push(t);
        }
      }

      return new Response(JSON.stringify({ published: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Standard: generate content and return for review
    const content = await generateAI(LOVABLE_API_KEY, type === "history" ? "history" : "tip");
    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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

  let systemPrompt: string;
  if (type === "history") {
    systemPrompt = `You are a history writer for DayMyTime, a productivity app. Write engaging historical content about events that happened on ${month} ${day}.

Return a JSON object with these fields:
- title: A compelling article title (max 80 chars)
- content: A 400-word article about a significant historical event on this day. Use engaging prose, include dates and key figures. Write in paragraphs.
- excerpt: A 2-sentence summary (max 160 chars)
- seo_title: SEO-optimized title (max 60 chars)
- meta_description: Meta description (max 160 chars)
- keywords: Comma-separated relevant keywords (5-8 keywords)

IMPORTANT: Return ONLY valid JSON, no markdown formatting.`;
  } else {
    systemPrompt = `You are a productivity expert for DayMyTime, a smart visual scheduler app. Write a daily productivity tip related to time management, scheduling, or work-life balance.

Return a JSON object with these fields:
- title: A catchy tip title (max 80 chars)
- content: A 150-word actionable productivity tip. Include specific steps or techniques. Write in clear, motivating language.
- excerpt: A 1-sentence preview (max 160 chars)
- seo_title: SEO-optimized title (max 60 chars)
- meta_description: Meta description (max 160 chars)
- keywords: Comma-separated relevant keywords (5-8 keywords)

IMPORTANT: Return ONLY valid JSON, no markdown formatting.`;
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
        { role: "user", content: `Generate ${type === "history" ? "a This Day in History article" : "a daily productivity tip"} for ${month} ${day}.` }
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
