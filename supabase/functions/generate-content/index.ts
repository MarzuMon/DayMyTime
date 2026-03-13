import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { type } = await req.json();
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
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required. Top up in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response, handling potential markdown wrapping
    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { title: "Generated Content", content: raw, excerpt: raw.slice(0, 160) };
    }

    return new Response(JSON.stringify(parsed), {
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
