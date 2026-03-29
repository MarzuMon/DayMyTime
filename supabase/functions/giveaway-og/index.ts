import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: config } = await supabase
      .from("giveaway_config")
      .select("active_image_url, is_finished")
      .limit(1)
      .maybeSingle();

    const isActive = config && !config.is_finished;
    const ogImage = isActive && config.active_image_url
      ? config.active_image_url
      : "https://daymytime.com/images/logo_D-full.png";

    const title = isActive
      ? "🎁 DayMyTime Giveaway – Win ₹500 Amazon Voucher!"
      : "DayMyTime – Smart Visual Scheduler";
    const description = isActive
      ? "Join the DayMyTime giveaway now! Upload your screenshot and win exciting prizes. Limited time only!"
      : "Plan your day visually with DayMyTime. Get productivity tips, daily inspiration, and history facts.";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://daymytime.com/giveaway"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:image" content="${ogImage}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${ogImage}"/>
<meta http-equiv="refresh" content="0;url=https://daymytime.com/giveaway"/>
</head>
<body>
<p>Redirecting to <a href="https://daymytime.com/giveaway">DayMyTime Giveaway</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    console.error("giveaway-og error:", e);
    return new Response("Redirecting...", {
      status: 302,
      headers: { Location: "https://daymytime.com/giveaway" },
    });
  }
});
