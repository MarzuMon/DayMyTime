import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, addDays, getDay, startOfDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categoryConfig, ScheduleCategory, Schedule } from '@/lib/types';
import { isRepeatingSchedule, fetchCompletionsForDate, toDateString } from '@/lib/scheduleCompletions';
import DayScheduleDetail from '@/components/DayScheduleDetail';
import { AnimatePresence } from 'framer-motion';

interface WeekSchedule {
  id: string;
  title: string;
  scheduled_time: string;
  duration: number;
  category: string;
  is_completed: boolean;
  repeat_days: number[] | null;
  repeat_type: string;
}

interface WeeklyPlanViewProps {
  onEdit?: (schedule: Schedule) => void;
  onCreateForDate?: (date: Date) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklyPlanView({ onEdit, onCreateForDate }: WeeklyPlanViewProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<WeekSchedule[]>([]);
  const [_loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  // Per-day completion overrides for repeating schedules: Map<"scheduleId-dayIndex", boolean>
  const [dateCompletions, setDateCompletions] = useState<Map<string, boolean>>(new Map());

  const now = new Date();
  const weekStart = startOfWeek(addDays(now, weekOffset * 7), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(addDays(now, weekOffset * 7), { weekStartsOn: 0 });

  const todayDayIndex = getDay(now);
  const isCurrentWeek = weekOffset === 0;
  const isPastWeek = weekOffset < 0;

  const hasDayStarted = (dayIndex: number): boolean => {
    if (isPastWeek) return true;
    if (!isCurrentWeek) return false;
    return dayIndex <= todayDayIndex;
  };

  const isDayPast = (dayIndex: number): boolean => {
    if (isPastWeek) return true;
    if (!isCurrentWeek) return false;
    return dayIndex < todayDayIndex;
  };

  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('schedules')
      .select('id, title, scheduled_time, duration, category, is_completed, repeat_days, repeat_type')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: true });

    const filtered = (data || []).filter((s: any) => {
      const sDate = new Date(s.scheduled_time);
      const inWeek = sDate >= weekStart && sDate <= weekEnd;
      const isDaily = s.repeat_type === 'daily';
      const hasRepeatDays = s.repeat_type === 'custom' && Array.isArray(s.repeat_days) && s.repeat_days.length > 0;
      return inWeek || isDaily || hasRepeatDays;
    });

    // Fetch per-date completions for repeating schedules for each started day
    const repeatingIds = filtered
      .filter((s: any) => isRepeatingSchedule(s.repeat_type))
      .map((s: any) => s.id);

    const newCompletions = new Map<string, boolean>();

    if (repeatingIds.length > 0) {
      // Fetch completions for all started days in the week
      const startedDays: Date[] = [];
      for (let i = 0; i < 7; i++) {
        if (isPastWeek || (isCurrentWeek && i <= todayDayIndex)) {
          startedDays.push(addDays(weekStart, i));
        }
      }

      // Batch fetch all completions for the week
      if (startedDays.length > 0) {
        const dateStrings = startedDays.map(d => toDateString(d));
        const { data: completionData } = await supabase
          .from('schedule_completions')
          .select('schedule_id, completion_date, is_completed')
          .in('schedule_id', repeatingIds)
          .in('completion_date', dateStrings);

        (completionData || []).forEach((row: any) => {
          const dayDate = new Date(row.completion_date + 'T00:00:00');
          const dayIdx = getDay(dayDate);
          newCompletions.set(`${row.schedule_id}-${dayIdx}`, row.is_completed);
        });
      }
    }

    setDateCompletions(newCompletions);
    setSchedules(filtered as WeekSchedule[]);
    setLoading(false);
  }, [user, weekOffset]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  useEffect(() => {
    const channel = supabase
      .channel('weekly-plan')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => fetchSchedules())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_completions' }, () => fetchSchedules())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSchedules]);

  // Group schedules by day with per-date completion
  const byDay: Record<number, (WeekSchedule & { effectiveCompleted: boolean })[]> = {};
  for (let i = 0; i < 7; i++) byDay[i] = [];
  const seen = new Set<string>();

  const getEffectiveCompleted = (s: WeekSchedule, dayIndex: number): boolean => {
    if (isRepeatingSchedule(s.repeat_type)) {
      return dateCompletions.get(`${s.id}-${dayIndex}`) ?? false;
    }
    return s.is_completed;
  };

  schedules.forEach(s => {
    const sDate = new Date(s.scheduled_time);
    const inWeek = sDate >= weekStart && sDate <= weekEnd;

    if (s.repeat_type === 'daily') {
      for (let d = 0; d < 7; d++) {
        if (!hasDayStarted(d)) continue;
        const key = `${s.id}-${d}`;
        if (!seen.has(key)) {
          seen.add(key);
          byDay[d].push({ ...s, effectiveCompleted: getEffectiveCompleted(s, d) });
        }
      }
      return;
    }

    if (s.repeat_type === 'custom' && Array.isArray(s.repeat_days)) {
      s.repeat_days.forEach((d: number) => {
        if (!hasDayStarted(d)) return;
        const key = `${s.id}-${d}`;
        if (!seen.has(key)) {
          seen.add(key);
          byDay[d]?.push({ ...s, effectiveCompleted: getEffectiveCompleted(s, d) });
        }
      });
      return;
    }

    if (inWeek) {
      const day = getDay(sDate);
      if (!hasDayStarted(day)) return;
      const key = `${s.id}-${day}`;
      if (!seen.has(key)) {
        seen.add(key);
        byDay[day]?.push({ ...s, effectiveCompleted: getEffectiveCompleted(s, day) });
      }
    }
  });

  const today = getDay(now);
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  const canNavigateTo = (dayIndex: number): boolean => {
    if (dayIndex < 0 || dayIndex > 6) return false;
    return hasDayStarted(dayIndex);
  };

  const handleDayNavigate = (direction: 'prev' | 'next') => {
    if (selectedDayIndex === null) return;
    const newIndex = direction === 'prev' ? selectedDayIndex - 1 : selectedDayIndex + 1;
    if (canNavigateTo(newIndex)) {
      setSelectedDayIndex(newIndex);
    }
  };

  if (selectedDayIndex !== null) {
    const selectedDate = addDays(weekStart, selectedDayIndex);
    selectedDate.setHours(9, 0, 0, 0);

    return (
      <section className="space-y-3">
        <AnimatePresence mode="wait">
          <DayScheduleDetail
            key={selectedDayIndex}
            date={selectedDate}
            onBack={() => setSelectedDayIndex(null)}
            onEdit={(schedule) => onEdit?.(schedule)}
            onCreateForDate={(date) => onCreateForDate?.(date)}
            onNavigate={handleDayNavigate}
            canGoPrev={canNavigateTo(selectedDayIndex - 1)}
            canGoNext={canNavigateTo(selectedDayIndex + 1)}
          />
        </AnimatePresence>
      </section>
    );
  }

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
          const activeCount = daySchedules.filter(s => !s.effectiveCompleted).length;
          const completedCount = daySchedules.filter(s => s.effectiveCompleted).length;

          const isFutureDay = isCurrentWeek && i > today;
          const isFutureWeek = weekOffset > 0;
          const isDayLocked = isFutureDay || isFutureWeek;
          const isPastDayLocked = isDayPast(i);

          return (
            <button
              key={i}
              onClick={() => { if (!isDayLocked) setSelectedDayIndex(i); }}
              disabled={isDayLocked}
              className={`rounded-lg border p-2 text-center transition-all min-h-[80px] ${
                isTodayCol
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : isDayLocked
                    ? 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                    : isPastDayLocked
                      ? 'border-border bg-muted/10 cursor-pointer hover:border-primary/40 hover:bg-primary/5'
                      : 'border-border bg-card cursor-pointer hover:border-primary/40 hover:bg-primary/5'
              } ${!isDayLocked ? 'active:scale-[0.97]' : ''}`}
            >
              <div className={`text-xs font-semibold mb-1.5 flex items-center justify-center gap-1 ${
                isTodayCol ? 'text-primary' : isDayLocked ? 'text-muted-foreground/50' : isPastDayLocked ? 'text-muted-foreground/70' : 'text-muted-foreground'
              }`}>
                {name}
                {isPastDayLocked && <Lock className="h-2.5 w-2.5 text-muted-foreground/40" />}
              </div>
              {isDayLocked ? (
                <div className="text-[10px] text-muted-foreground/40 py-2">—</div>
              ) : daySchedules.length === 0 ? (
                <div className="text-[10px] text-muted-foreground/50 py-2">
                  {isPastDayLocked ? '—' : 'Tap to add'}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {daySchedules.slice(0, 3).map((s, idx) => {
                    const cat = categoryConfig[s.category as ScheduleCategory];
                    return (
                      <div
                        key={`${s.id}-${idx}`}
                        className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate ${
                          s.effectiveCompleted
                            ? 'bg-muted text-muted-foreground line-through'
                            : 'bg-primary/10 text-primary'
                        }`}
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
            </button>
          );
        })}
      </div>

      {/* Dot indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {DAY_NAMES.map((_, i) => {
          const isTodayDot = i === today && weekOffset === 0;
          const isSelected = selectedDayIndex === i;
          return (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                isSelected
                  ? 'w-4 bg-primary'
                  : isTodayDot
                    ? 'w-2 bg-primary/50'
                    : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
