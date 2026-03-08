import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, addDays, getDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categoryConfig, ScheduleCategory, Schedule } from '@/lib/types';

interface WeekSchedule {
  id: string;
  title: string;
  scheduled_time: string;
  duration: number;
  category: string;
  is_completed: boolean;
  repeat_days: number[] | null;
  repeat_type: string;
  description: string;
  meeting_link: string | null;
  meeting_platform: string | null;
  image_path: string | null;
  alarm_tone: string;
  team_id: string | null;
  created_at: string;
}

interface WeeklyPlanViewProps {
  onEdit?: (schedule: Schedule) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toSchedule(s: WeekSchedule): Schedule {
  return {
    id: s.id,
    title: s.title,
    description: s.description || '',
    scheduledTime: s.scheduled_time,
    duration: s.duration,
    meetingLink: s.meeting_link || undefined,
    meetingPlatform: (s.meeting_platform as any) || undefined,
    category: s.category as ScheduleCategory,
    repeatType: (s.repeat_type as any) || 'none',
    isCompleted: s.is_completed,
    createdAt: s.created_at,
    imagePath: s.image_path || undefined,
    alarmTone: (s.alarm_tone as any) || 'default',
    teamId: s.team_id || undefined,
    repeatDays: s.repeat_days || undefined,
  };
}

export default function WeeklyPlanView({ onEdit }: WeeklyPlanViewProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<WeekSchedule[]>([]);
  const [_loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const now = new Date();
  const weekStart = startOfWeek(addDays(now, weekOffset * 7), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(addDays(now, weekOffset * 7), { weekStartsOn: 0 });

  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('schedules')
      .select('id, title, scheduled_time, duration, category, is_completed, repeat_days, repeat_type, description, meeting_link, meeting_platform, image_path, alarm_tone, team_id, created_at')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: true });

    // Filter: schedules in this week OR with repeat_days/daily repeat
    const filtered = (data || []).filter((s: any) => {
      const sDate = new Date(s.scheduled_time);
      const inWeek = sDate >= weekStart && sDate <= weekEnd;
      const hasRepeatDays = s.repeat_type === 'custom' && Array.isArray(s.repeat_days) && s.repeat_days.length > 0;
      const isDaily = s.repeat_type === 'daily';
      return inWeek || hasRepeatDays || isDaily;
    });

    setSchedules(filtered as WeekSchedule[]);
    setLoading(false);
  }, [user, weekOffset]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('weekly-plan')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        fetchSchedules();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSchedules]);

  // Group schedules by day of week, including repeat_days schedules
  const byDay: Record<number, WeekSchedule[]> = {};
  for (let i = 0; i < 7; i++) byDay[i] = [];
  const seen = new Set<string>(); // avoid duplicates per day
  schedules.forEach(s => {
    const day = getDay(new Date(s.scheduled_time));
    const sDate = new Date(s.scheduled_time);
    const inWeek = sDate >= weekStart && sDate <= weekEnd;

    // Daily repeat: show on all days
    if (s.repeat_type === 'daily') {
      for (let d = 0; d < 7; d++) {
        const key = `${s.id}-${d}`;
        if (!seen.has(key)) { seen.add(key); byDay[d].push(s); }
      }
      return;
    }

    // Custom repeat days
    if (s.repeat_type === 'custom' && Array.isArray(s.repeat_days)) {
      s.repeat_days.forEach((d: number) => {
        const key = `${s.id}-${d}`;
        if (!seen.has(key)) { seen.add(key); byDay[d]?.push(s); }
      });
      return;
    }

    // Regular schedule in this week
    if (inWeek) {
      const key = `${s.id}-${day}`;
      if (!seen.has(key)) { seen.add(key); byDay[day]?.push(s); }
    }
  });

  const today = getDay(now);
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Weekly Plan
        </h2>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setWeekOffset(o => o - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            {weekOffset === 0 ? 'This week' : weekLabel}
          </button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setWeekOffset(o => o + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAY_NAMES.map((name, i) => {
          const isTodayCol = i === today && weekOffset === 0;
          const daySchedules = byDay[i] || [];
          const activeCount = daySchedules.filter(s => !s.is_completed).length;
          const completedCount = daySchedules.filter(s => s.is_completed).length;

          return (
            <div
              key={i}
              className={`rounded-lg border p-2 text-center transition-colors min-h-[80px] ${
                isTodayCol
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card'
              }`}
            >
              <div className={`text-xs font-semibold mb-1.5 ${isTodayCol ? 'text-primary' : 'text-muted-foreground'}`}>
                {name}
              </div>
              {daySchedules.length === 0 ? (
                <div className="text-[10px] text-muted-foreground/50">—</div>
              ) : (
                <div className="space-y-0.5">
                  {daySchedules.slice(0, 3).map(s => {
                    const cat = categoryConfig[s.category as ScheduleCategory];
                    return (
                      <div
                        key={s.id}
                        onClick={() => onEdit?.(toSchedule(s))}
                        className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all group/item ${
                          s.is_completed
                            ? 'bg-muted text-muted-foreground line-through'
                            : 'bg-primary/10 text-primary'
                        }`}
                        title={`${s.title} - ${format(new Date(s.scheduled_time), 'h:mm a')} (click to edit)`}
                      >
                        {cat?.emoji} {s.title}
                      </div>
                    );
                  })}
                  {daySchedules.length > 3 && (
                    <div className="text-[9px] text-muted-foreground">
                      +{daySchedules.length - 3} more
                    </div>
                  )}
                </div>
              )}
              {daySchedules.length > 0 && (
                <div className="mt-1 text-[9px] text-muted-foreground">
                  {activeCount > 0 && <span>{activeCount} active</span>}
                  {completedCount > 0 && <span className="ml-1">✓{completedCount}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
