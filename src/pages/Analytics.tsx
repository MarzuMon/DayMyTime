import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, PieChart as PieIcon, BarChart3, CalendarCheck, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { categoryConfig, type ScheduleCategory } from '@/lib/types';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfWeek, addDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import SEOHead from '@/components/SEOHead';

const COLORS = [
  'hsl(172 50% 40%)',  // primary/teal
  'hsl(25 90% 58%)',   // accent/orange
  'hsl(220 80% 56%)',  // blue
  'hsl(142 60% 45%)',  // green
  'hsl(250 60% 52%)',  // purple
  'hsl(38 92% 50%)',   // warning/yellow
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

  // Stats
  const total = schedules.length;
  const completed = schedules.filter(s => s.is_completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalMinutes = schedules.filter(s => s.is_completed).reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);

  // Category breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    schedules.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, value]) => ({
        name: categoryConfig[key as ScheduleCategory]?.label ?? key,
        emoji: categoryConfig[key as ScheduleCategory]?.emoji ?? '📌',
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [schedules]);

  // Weekly trend (last 7 days)
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const daySchedules = schedules.filter(s =>
        isWithinInterval(new Date(s.scheduled_time), { start: dayStart, end: dayEnd })
      );
      const dayCompleted = daySchedules.filter(s => s.is_completed).length;
      days.push({
        day: format(day, 'EEE'),
        total: daySchedules.length,
        completed: dayCompleted,
      });
    }
    return days;
  }, [schedules]);

  // Streak calculation
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 60; i++) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const hasCompleted = schedules.some(s =>
        s.is_completed && isWithinInterval(new Date(s.scheduled_time), { start: dayStart, end: dayEnd })
      );
      if (hasCompleted) count++;
      else if (i > 0) break; // Allow today to be incomplete
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEOHead title="Analytics – DayMyTime" description="Track your productivity trends and schedule completion rates." />

      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate('/app')} aria-label="Back to dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">Analytics</h1>
            <p className="text-xs text-muted-foreground">Your productivity at a glance</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <Target className="h-5 w-5 mx-auto mb-1.5 text-primary" />
              <p className="text-2xl font-display font-bold">{completionRate}%</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <CalendarCheck className="h-5 w-5 mx-auto mb-1.5 text-primary" />
              <p className="text-2xl font-display font-bold">{completed}<span className="text-sm text-muted-foreground">/{total}</span></p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Done</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <Flame className="h-5 w-5 mx-auto mb-1.5 text-accent" />
              <p className="text-2xl font-display font-bold">{streak}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1.5 text-primary" />
              <p className="text-2xl font-display font-bold">{totalHours}h</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Focus Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Productivity Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Weekly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total" name="Scheduled" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data for the past week yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" /> Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 w-full">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-sm">{cat.emoji} {cat.name}</span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
