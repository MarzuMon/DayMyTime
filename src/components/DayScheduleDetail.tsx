import { useState, useEffect, useCallback } from 'react';
import { format, isToday, startOfDay, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Schedule, ScheduleCategory, categoryConfig } from '@/lib/types';
import { toggleComplete, deleteSchedule } from '@/lib/scheduleStore';
import { isRepeatingSchedule, fetchCompletionsForDate, toggleDateCompletion } from '@/lib/scheduleCompletions';
import ScheduleCard from '@/components/ScheduleCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface DayScheduleDetailProps {
  date: Date;
  onBack: () => void;
  onEdit: (schedule: Schedule) => void;
  onCreateForDate: (date: Date) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

function rowToSchedule(row: any, overrideCompleted?: boolean): Schedule {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    scheduledTime: row.scheduled_time,
    duration: row.duration,
    meetingLink: row.meeting_link || undefined,
    meetingPlatform: row.meeting_platform || undefined,
    category: row.category as ScheduleCategory,
    repeatType: row.repeat_type || 'none',
    isCompleted: overrideCompleted !== undefined ? overrideCompleted : row.is_completed,
    createdAt: row.created_at,
    imagePath: row.image_path || undefined,
    alarmTone: row.alarm_tone || 'default',
    teamId: row.team_id || undefined,
    repeatDays: row.repeat_days || undefined,
  };
}

export default function DayScheduleDetail({ date, onBack, onEdit, onCreateForDate, onNavigate, canGoPrev = true, canGoNext = true }: DayScheduleDetailProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const today = startOfDay(now);
  const dayStart = startOfDay(date);
  const isLocked = dayStart < today;
  const isTodayDate = isToday(date);
  const dayOfWeek = date.getDay();

  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const dayStartISO = startOfDay(date).toISOString();
    const dayEndISO = startOfDay(addDays(date, 1)).toISOString();

    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: true });

    const filtered = (data || []).filter((s: any) => {
      const sDate = new Date(s.scheduled_time);
      const inDay = sDate >= new Date(dayStartISO) && sDate < new Date(dayEndISO);
      const isDaily = s.repeat_type === 'daily';
      const hasRepeatDay = s.repeat_type === 'custom' && Array.isArray(s.repeat_days) && s.repeat_days.includes(dayOfWeek);
      return inDay || isDaily || hasRepeatDay;
    });

    // For repeating schedules, fetch per-date completion status
    const repeatingIds = filtered
      .filter((s: any) => isRepeatingSchedule(s.repeat_type))
      .map((s: any) => s.id);

    const completionMap = await fetchCompletionsForDate(repeatingIds, date);

    const mappedSchedules = filtered.map((row: any) => {
      if (isRepeatingSchedule(row.repeat_type)) {
        const dateCompleted = completionMap.get(row.id) ?? false;
        return rowToSchedule(row, dateCompleted);
      }
      return rowToSchedule(row);
    });

    setSchedules(mappedSchedules);
    setLoading(false);
  }, [user, date, dayOfWeek]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  useEffect(() => {
    const channel = supabase
      .channel('day-detail')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => fetchSchedules())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_completions' }, () => fetchSchedules())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSchedules]);

  const handleToggle = async (id: string) => {
    if (isLocked) return;
    const schedule = schedules.find(s => s.id === id);
    if (!schedule || !user) return;

    if (isRepeatingSchedule(schedule.repeatType)) {
      await toggleDateCompletion(id, user.id, date);
    } else {
      await toggleComplete(id);
    }
    fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    if (isLocked) return;
    await deleteSchedule(id);
    fetchSchedules();
  };

  const handleEdit = (schedule: Schedule) => {
    if (isLocked) return;
    onEdit(schedule);
  };

  const activeSchedules = schedules.filter(s => !s.isCompleted);
  const completedSchedules = schedules.filter(s => s.isCompleted);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && canGoPrev) {
      onNavigate?.('prev');
    } else if (info.offset.x < -threshold && canGoNext) {
      onNavigate?.('next');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="space-y-4 touch-pan-y"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              {format(date, 'EEEE')}
              {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
              {isTodayDate && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">Today</span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">{format(date, 'MMMM d, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canGoPrev && (
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => onNavigate?.('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {canGoNext && (
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => onNavigate?.('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {!isLocked && (
            <Button
              size="sm"
              className="rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90"
              onClick={() => onCreateForDate(date)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          )}
        </div>
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 flex-shrink-0" />
          <span>This day is locked. Schedules from past days cannot be edited, deleted, or marked complete.</span>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && schedules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No schedules for this day</p>
          {!isLocked && (
            <Button variant="outline" className="mt-3 rounded-xl" onClick={() => onCreateForDate(date)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Schedule
            </Button>
          )}
        </div>
      )}

      {!loading && activeSchedules.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Active <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold ml-1">{activeSchedules.length}</span>
          </h3>
          <div className="space-y-2">
            {activeSchedules.map(s => (
              <div key={s.id} className={isLocked ? 'opacity-70 pointer-events-none' : ''}>
                <ScheduleCard schedule={s} onToggleComplete={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && completedSchedules.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Completed <span className="px-1.5 py-0.5 rounded-full bg-success/10 text-success text-xs font-bold ml-1">{completedSchedules.length}</span>
          </h3>
          <div className="space-y-2">
            {completedSchedules.map(s => (
              <div key={s.id} className={isLocked ? 'opacity-70 pointer-events-none' : ''}>
                <ScheduleCard schedule={s} onToggleComplete={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
