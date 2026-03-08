import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get yesterday's date (report is generated at midnight for the previous day)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const reportDate = yesterday.toISOString().split("T")[0];

    const dayStart = `${reportDate}T00:00:00.000Z`;
    const dayEnd = `${reportDate}T23:59:59.999Z`;

    // Get all distinct users who had schedules yesterday
    const { data: userSchedules } = await supabase
      .from("schedules")
      .select("user_id, category, duration, is_completed, scheduled_time")
      .gte("scheduled_time", dayStart)
      .lte("scheduled_time", dayEnd);

    // Reset all completed schedules and advance repeating schedule dates to today
    await resetAndAdvanceSchedules(supabase, now);

    if (!userSchedules || userSchedules.length === 0) {
      return new Response(JSON.stringify({ message: "No schedules to report", reset: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by user
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

      // Category breakdown
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

      // Productivity score (0-100)
      const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate streak
      let streakDays = 0;
      if (completed === total && total > 0) {
        // Check previous days for streak
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

    // Upsert reports
    const { error } = await supabase.from("daily_reports").upsert(reports, {
      onConflict: "user_id,report_date",
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: `Generated ${reports.length} reports`, reset: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
