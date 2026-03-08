import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { CalendarDays, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import { ScheduleCategory, categoryConfig } from '@/lib/types';

interface TodaySchedule {
  id: string;
  title: string;
  scheduled_time: string;
  duration: number;
  category: string;
  is_completed: boolean;
  meeting_link: string | null;
}

const categoryColors: Record<string, string> = {
  meeting: 'border-l-blue-500 bg-blue-500/5',
  class: 'border-l-violet-500 bg-violet-500/5',
  work: 'border-l-amber-500 bg-amber-500/5',
  personal: 'border-l-emerald-500 bg-emerald-500/5',
  exam: 'border-l-rose-500 bg-rose-500/5',
  team: 'border-l-indigo-500 bg-indigo-500/5',
  other: 'border-l-slate-400 bg-slate-400/5',
};

const categoryDotColors: Record<string, string> = {
  meeting: 'bg-blue-500',
  class: 'bg-violet-500',
  work: 'bg-amber-500',
  personal: 'bg-emerald-500',
  exam: 'bg-rose-500',
  team: 'bg-indigo-500',
  other: 'bg-slate-400',
};

export default function DailyScheduleSection() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<TodaySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchToday = useCallback(async () => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('schedules')
      .select('id, title, scheduled_time, duration, category, is_completed, meeting_link')
      .eq('user_id', user.id)
      .gte('scheduled_time', todayStart.toISOString())
      .lte('scheduled_time', todayEnd.toISOString())
      .order('scheduled_time', { ascending: true });

    setSchedules((data || []) as TodaySchedule[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('today-schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules', filter: `user_id=eq.${user.id}` }, () => {
        fetchToday();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchToday]);

  if (loading) return null;

  const now = new Date();
  const currentHour = now.getHours();

  // Only show hours that have schedules + current hour
  const scheduleHoursSet = new Set(schedules.map(s => new Date(s.scheduled_time).getHours()));
  scheduleHoursSet.add(currentHour);

  const hourSlots: number[] = Array.from(scheduleHoursSet).sort((a, b) => a - b);

  const getSchedulesForHour = (hour: number) =>
    schedules.filter(s => new Date(s.scheduled_time).getHours() === hour);

  const getTimeStatus = (time: string) => {
    const t = new Date(time);
    if (t < now) return 'past';
    const diffMin = (t.getTime() - now.getTime()) / 60000;
    if (diffMin <= 30) return 'soon';
    return 'upcoming';
  };

  const active = schedules.filter(s => !s.is_completed);
  const completed = schedules.filter(s => s.is_completed);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Today's Schedule
        </h2>
        <span className="text-xs text-muted-foreground font-medium">
          {format(new Date(), 'EEEE, MMM d')}
        </span>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-xl">
          <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No schedules for today</p>
          <p className="text-xs text-muted-foreground mt-1">Add a schedule to see it here</p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Hourly Time Grid */}
          <div className="rounded-xl border bg-card overflow-hidden">
            {hourSlots.map(hour => {
              const hourSchedules = getSchedulesForHour(hour);
              const isCurrentHour = hour === currentHour;
              const isPastHour = hour < currentHour;
              const formatHour = (h: number) => {
                const ampm = h >= 12 ? 'PM' : 'AM';
                const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
                return `${displayH} ${ampm}`;
              };

              return (
                <div
                  key={hour}
                  className={`flex border-b last:border-b-0 min-h-[3rem] transition-colors ${
                    isCurrentHour ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : isPastHour ? 'opacity-50' : ''
                  }`}
                >
                  {/* Time column */}
                  <div className={`w-16 flex-shrink-0 py-2 px-2 text-right border-r ${
                    isCurrentHour ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}>
                    <span className="text-xs font-mono">{formatHour(hour)}</span>
                    {isCurrentHour && (
                      <div className="text-[10px] text-primary font-medium">NOW</div>
                    )}
                  </div>

                  {/* Schedule items column */}
                  <div className="flex-1 py-1.5 px-2 space-y-1">
                    {hourSchedules.length === 0 ? (
                      <div className="h-full" />
                    ) : (
                      hourSchedules.map(s => {
                        const status = getTimeStatus(s.scheduled_time);
                        const cat = categoryConfig[s.category as ScheduleCategory];
                        return (
                          <div
                            key={s.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border-l-3 transition-all ${
                              s.is_completed 
                                ? 'bg-secondary/30 opacity-60 border-l-muted-foreground' 
                                : `${categoryColors[s.category] || categoryColors.other} ${status === 'soon' ? 'ring-1 ring-primary/30' : ''}`
                            }`}
                          >
                            {s.is_completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${categoryDotColors[s.category] || categoryDotColors.other} ${
                                status === 'soon' ? 'animate-pulse' : ''
                              }`} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${s.is_completed ? 'line-through' : ''}`}>{s.title}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span className="font-mono">{format(new Date(s.scheduled_time), 'h:mm a')}</span>
                                <span>·</span>
                                <span>{s.duration}m</span>
                                <span>·</span>
                                <span>{cat?.emoji} {cat?.label}</span>
                                {status === 'soon' && !s.is_completed && (
                                  <span className="text-primary font-medium">Soon</span>
                                )}
                              </div>
                            </div>
                            {s.meeting_link && !s.is_completed && (
                              <a href={s.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 flex-shrink-0">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span>{active.length} remaining · {completed.length} done</span>
            <span>{schedules.length} total today</span>
          </div>
        </div>
      )}
    </section>
  );
}