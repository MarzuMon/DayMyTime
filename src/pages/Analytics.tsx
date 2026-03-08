import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, PieChart as PieIcon, BarChart3, CalendarCheck, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { categoryConfig, type ScheduleCategory } from '@/lib/types';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';

const COLORS = [
  'hsl(172 66% 38%)',
  'hsl(25 95% 55%)',
  'hsl(220 80% 56%)',
  'hsl(142 60% 45%)',
  'hsl(250 60% 52%)',
  'hsl(38 92% 50%)',
];

interface ScheduleRow {
  id: string;
  title: string;
  category: string;
  is_completed: boolean;
  scheduled_time: string;
  created_at: string;
  duration: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('schedules')
      .select('id, title, category, is_completed, scheduled_time, created_at, duration')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: false })
      .then(({ data }) => {
        setSchedules(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const total = schedules.length;
  const completed = schedules.filter(s => s.is_completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalMinutes = schedules.filter(s => s.is_completed).reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    schedules.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return Object.entries(counts)
      .map(([key, value]) => ({
        name: categoryConfig[key as ScheduleCategory]?.label ?? key,
        emoji: categoryConfig[key as ScheduleCategory]?.emoji ?? '📌',
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [schedules]);

  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const daySchedules = schedules.filter(s =>
        isWithinInterval(new Date(s.scheduled_time), { start: dayStart, end: dayEnd })
      );
      days.push({
        day: format(day, 'EEE'),
        total: daySchedules.length,
        completed: daySchedules.filter(s => s.is_completed).length,
      });
    }
    return days;
  }, [schedules]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 60; i++) {
      const day = subDays(new Date(), i);
      const hasCompleted = schedules.some(s =>
        s.is_completed && isWithinInterval(new Date(s.scheduled_time), { start: startOfDay(day), end: endOfDay(day) })
      );
      if (hasCompleted) count++;
      else if (i > 0) break;
    }
    return count;
  }, [schedules]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  const stats = [
    { icon: Target, label: 'Completion', value: `${completionRate}%`, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: CalendarCheck, label: 'Done', value: `${completed}/${total}`, color: 'text-success', bg: 'bg-success/10' },
    { icon: Flame, label: 'Streak', value: `${streak}d`, color: 'text-accent', bg: 'bg-accent/10' },
    { icon: TrendingUp, label: 'Focus', value: `${totalHours}h`, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEOHead title="Analytics – DayMyTime" description="Track your productivity trends and schedule completion rates." />

      {/* Header */}
      <header className="relative overflow-hidden border-b">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate('/app')} aria-label="Back to dashboard" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">Analytics</h1>
              <p className="text-xs text-muted-foreground">Your productivity at a glance</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="rounded-2xl border bg-card p-4 text-center shadow-card"
            >
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-2xl font-display font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-2xl border bg-card p-5 shadow-card"
        >
          <h2 className="font-display text-base font-semibold flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" /> Weekly Trend
          </h2>
          {weeklyData.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="total" name="Scheduled" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data for the past week yet.</p>
          )}
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="rounded-2xl border bg-card p-5 shadow-card"
        >
          <h2 className="font-display text-base font-semibold flex items-center gap-2 mb-4">
            <PieIcon className="h-4 w-4 text-primary" /> Category Breakdown
          </h2>
          {categoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5 w-full">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm">{cat.emoji} {cat.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
