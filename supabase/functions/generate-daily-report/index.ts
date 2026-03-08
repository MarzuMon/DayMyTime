import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://daymytime.lovable.app',
  'https://daymytime.com',
  'https://www.daymytime.com',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.lovable.app')
    ? origin
    : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

async function resetAndAdvanceSchedules(supabase: any, now: Date) {
  const { error: resetError } = await supabase
    .from("schedules")
    .update({ is_completed: false })
    .eq("is_completed", true);

  if (resetError) console.error("Schedule reset failed");

  const todayDateStr = now.toISOString().split("T")[0];

  const { data: repeatingSchedules } = await supabase
    .from("schedules")
    .select("id, scheduled_time")
    .in("repeat_type", ["daily", "custom"]);

  if (repeatingSchedules && repeatingSchedules.length > 0) {
    for (const s of repeatingSchedules) {
      const oldTime = s.scheduled_time.split("T")[1];
      const newScheduledTime = `${todayDateStr}T${oldTime}`;

      await supabase
        .from("schedules")
        .update({ scheduled_time: newScheduledTime })
        .eq("id", s.id);
    }
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const reportDate = yesterday.toISOString().split("T")[0];

    const dayStart = `${reportDate}T00:00:00.000Z`;
    const dayEnd = `${reportDate}T23:59:59.999Z`;

    const { data: userSchedules } = await supabase
      .from("schedules")
      .select("user_id, category, duration, is_completed, scheduled_time")
      .gte("scheduled_time", dayStart)
      .lte("scheduled_time", dayEnd);

    await resetAndAdvanceSchedules(supabase, now);

    if (!userSchedules || userSchedules.length === 0) {
      return new Response(JSON.stringify({ message: "No schedules to report", reset: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMap = new Map<string, typeof userSchedules>();
    for (const s of userSchedules) {
      const list = userMap.get(s.user_id) || [];
      list.push(s);
      userMap.set(s.user_id, list);
    }

    const reports = [];

    for (const [userId, schedules] of userMap) {
      const total = schedules.length;
      const completed = schedules.filter((s) => s.is_completed).length;
      const pending = total - completed;
      const focusMinutes = schedules
        .filter((s) => s.is_completed)
        .reduce((sum, s) => sum + (s.duration || 0), 0);

      const categoryBreakdown: Record<string, { total: number; completed: number; minutes: number }> = {};
      for (const s of schedules) {
        if (!categoryBreakdown[s.category]) {
          categoryBreakdown[s.category] = { total: 0, completed: 0, minutes: 0 };
        }
        categoryBreakdown[s.category].total++;
        if (s.is_completed) {
          categoryBreakdown[s.category].completed++;
          categoryBreakdown[s.category].minutes += s.duration || 0;
        }
      }

      const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 0;

      let streakDays = 0;
      if (completed === total && total > 0) {
        streakDays = 1;
        const { data: prevReports } = await supabase
          .from("daily_reports")
          .select("streak_days, report_date, productivity_score")
          .eq("user_id", userId)
          .order("report_date", { ascending: false })
          .limit(1);

        if (prevReports && prevReports.length > 0) {
          const prevDate = new Date(prevReports[0].report_date);
          const expectedPrev = new Date(yesterday);
          expectedPrev.setDate(expectedPrev.getDate() - 1);

          if (
            prevDate.toISOString().split("T")[0] === expectedPrev.toISOString().split("T")[0] &&
            prevReports[0].productivity_score === 100
          ) {
            streakDays = (prevReports[0].streak_days || 0) + 1;
          }
        }
      }

      reports.push({
        user_id: userId,
        report_date: reportDate,
        total_schedules: total,
        completed_schedules: completed,
        pending_schedules: pending,
        category_breakdown: categoryBreakdown,
        focus_minutes: focusMinutes,
        productivity_score: productivityScore,
        streak_days: streakDays,
      });
    }

    const { error } = await supabase.from("daily_reports").upsert(reports, {
      onConflict: "user_id,report_date",
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: `Generated ${reports.length} reports`, reset: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Report generation failed");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});