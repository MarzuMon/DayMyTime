import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [historyRes, tipsRes] = await Promise.all([
    supabase.from("history_posts").select("slug, publish_date, updated_at").eq("status", "published").order("publish_date", { ascending: false }).limit(1000),
    supabase.from("daily_tips").select("slug, publish_date, updated_at").eq("status", "published").order("publish_date", { ascending: false }).limit(1000),
  ]);

  const historyPosts = historyRes.data ?? [];
  const tipsPosts = tipsRes.data ?? [];

  const staticPages = [
    { loc: "https://daymytime.com/", priority: "1.0", changefreq: "weekly" },
    { loc: "https://daymytime.com/todaytip", priority: "0.9", changefreq: "daily" },
    { loc: "https://daymytime.com/history", priority: "0.9", changefreq: "daily" },
    { loc: "https://daymytime.com/topics", priority: "0.8", changefreq: "weekly" },
    { loc: "https://daymytime.com/topics/productivity-tips", priority: "0.8", changefreq: "weekly" },
    { loc: "https://daymytime.com/topics/daily-motivation", priority: "0.8", changefreq: "weekly" },
    { loc: "https://daymytime.com/topics/today-in-history", priority: "0.8", changefreq: "weekly" },
    { loc: "https://daymytime.com/topics/self-improvement", priority: "0.8", changefreq: "weekly" },
    { loc: "https://daymytime.com/topics/life-hacks", priority: "0.8", changefreq: "weekly" },
    { loc: "https://daymytime.com/about", priority: "0.7", changefreq: "monthly" },
    { loc: "https://daymytime.com/giveaway", priority: "0.7", changefreq: "weekly" },
    { loc: "https://daymytime.com/contact", priority: "0.6", changefreq: "monthly" },
    { loc: "https://daymytime.com/pro", priority: "0.6", changefreq: "monthly" },
    { loc: "https://daymytime.com/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "https://daymytime.com/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "https://daymytime.com/disclaimer", priority: "0.3", changefreq: "yearly" },
  ];

  const today = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }

  for (const post of historyPosts) {
    const lastmod = post.updated_at?.split("T")[0] ?? post.publish_date;
    xml += `  <url>\n    <loc>https://daymytime.com/history/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }

  for (const post of tipsPosts) {
    const lastmod = post.updated_at?.split("T")[0] ?? post.publish_date;
    xml += `  <url>\n    <loc>https://daymytime.com/todaytip/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;

  // Best-effort ping Google & Bing about updated sitemap
  const sitemapUrl = "https://daymytime.com/sitemap.xml";
  Promise.allSettled([
    fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
    fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
  ]).catch(() => {});

  return new Response(xml, {
    headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" },
  });
});
