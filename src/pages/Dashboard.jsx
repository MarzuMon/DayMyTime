import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { CheckCircle2, Circle, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryConfig } from "@/lib/types";

export default function Dashboard() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_time", { ascending: true });
    setSchedules(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-schedules")
      .on("postgres_changes", { event: "*", schema: "public", table: "schedules", filter: `user_id=eq.${user.id}` }, () => {
        fetchSchedules();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSchedules]);

  const toggleComplete = async (id, currentState) => {
    await supabase.from("schedules").update({ is_completed: !currentState }).eq("id", id);
  };

  const deleteSchedule = async (id) => {
    await supabase.from("schedules").delete().eq("id", id);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Please log in to view your dashboard.</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaySchedules = schedules.filter(s => {
    const t = new Date(s.scheduled_time);
    return t >= today && t <= todayEnd;
  });
  const upcoming = schedules.filter(s => new Date(s.scheduled_time) > todayEnd);
  const active = todaySchedules.filter(s => !s.is_completed);
  const completed = todaySchedules.filter(s => s.is_completed);

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{todaySchedules.length}</p>
          <p className="text-xs text-muted-foreground">Today</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{active.length}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{completed.length}</p>
          <p className="text-xs text-muted-foreground">Done</p>
        </div>
      </div>

      {/* Today's Schedules */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today's Schedules</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Loading…</div>
        ) : todaySchedules.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl">
            <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No schedules for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySchedules.map(s => {
              const cat = categoryConfig[s.category];
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-opacity" style={{ opacity: s.is_completed ? 0.5 : 1 }}>
                  <button onClick={() => toggleComplete(s.id, s.is_completed)} className="flex-shrink-0 text-primary">
                    {s.is_completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${s.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.scheduled_time), "h:mm a")} · {s.duration}m {cat ? `· ${cat.emoji} ${cat.label}` : ""}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteSchedule(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.slice(0, 5).map(s => {
              const cat = categoryConfig[s.category];
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.scheduled_time), "EEE, MMM d · h:mm a")} {cat ? `· ${cat.emoji}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
            {upcoming.length > 5 && <p className="text-xs text-muted-foreground text-center">+{upcoming.length - 5} more</p>}
          </div>
        </section>
      )}
    </div>
  );
}
