import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Flame, TrendingUp, BarChart3, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DailyReport {
  id: string;
  report_date: string;
  total_schedules: number;
  completed_schedules: number;
  pending_schedules: number;
  category_breakdown: Record<string, { total: number; completed: number; minutes: number }>;
  focus_minutes: number;
  productivity_score: number;
  streak_days: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  personal: '#f59e0b',
  meeting: '#3b82f6',
  class: '#8b5cf6',
  work: '#10b981',
  exam: '#ef4444',
  team: '#6366f1',
  other: '#6b7280',
};

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0, pending: 0, focusMin: 0 });

  useEffect(() => {
    if (!user) return;
    fetchReports();
    fetchTodayStats();
  }, [user]);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', user!.id)
      .order('report_date', { ascending: false })
      .limit(30);

    const typed = (data || []) as unknown as DailyReport[];
    setReports(typed);
    if (typed.length > 0) setSelectedReport(typed[0]);
    setLoading(false);
  };

  const fetchTodayStats = async () => {
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const { data } = await supabase
      .from('schedules')
      .select('is_completed, duration')
      .gte('scheduled_time', dayStart)
      .lte('scheduled_time', dayEnd);

    if (data) {
      const total = data.length;
      const completed = data.filter(s => s.is_completed).length;
      const focusMin = data.filter(s => s.is_completed).reduce((sum, s) => sum + (s.duration || 0), 0);
      setTodayStats({ total, completed, pending: total - completed, focusMin });
    }
  };

  // Generate manual report for today
  const generateTodayReport = async () => {
    const today = new Date();
    const reportDate = format(today, 'yyyy-MM-dd');
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const { data: schedules } = await supabase
      .from('schedules')
      .select('category, duration, is_completed')
      .gte('scheduled_time', dayStart)
      .lte('scheduled_time', dayEnd);

    if (!schedules || schedules.length === 0) return;

    const total = schedules.length;
    const completed = schedules.filter(s => s.is_completed).length;
    const focusMinutes = schedules.filter(s => s.is_completed).reduce((sum, s) => sum + (s.duration || 0), 0);

    const categoryBreakdown: Record<string, { total: number; completed: number; minutes: number }> = {};
    for (const s of schedules) {
      if (!categoryBreakdown[s.category]) categoryBreakdown[s.category] = { total: 0, completed: 0, minutes: 0 };
      categoryBreakdown[s.category].total++;
      if (s.is_completed) {
        categoryBreakdown[s.category].completed++;
        categoryBreakdown[s.category].minutes += s.duration || 0;
      }
    }

    const productivityScore = Math.round((completed / total) * 100);

    // Get previous streak
    let streakDays = productivityScore === 100 ? 1 : 0;
    if (productivityScore === 100 && reports.length > 0) {
      const prev = reports[0];
      const prevDate = new Date(prev.report_date);
      const expectedPrev = subDays(today, 1);
      if (format(prevDate, 'yyyy-MM-dd') === format(expectedPrev, 'yyyy-MM-dd') && prev.productivity_score === 100) {
        streakDays = (prev.streak_days || 0) + 1;
      }
    }

    await supabase.from('daily_reports').upsert({
      user_id: user!.id,
      report_date: reportDate,
      total_schedules: total,
      completed_schedules: completed,
      pending_schedules: total - completed,
      category_breakdown: categoryBreakdown,
      focus_minutes: focusMinutes,
      productivity_score: productivityScore,
      streak_days: streakDays,
    }, { onConflict: 'user_id,report_date' });

    fetchReports();
  };

  const currentStreak = reports.length > 0 ? reports[0].streak_days : 0;

  // Chart data from last 7 reports
  const chartData = [...reports].reverse().slice(-7).map(r => ({
    date: format(new Date(r.report_date), 'MMM d'),
    completed: r.completed_schedules,
    pending: r.pending_schedules,
    score: r.productivity_score,
  }));

  const pieData = selectedReport
    ? Object.entries(selectedReport.category_breakdown).map(([cat, stats]) => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: stats.total,
        color: CATEGORY_COLORS[cat] || '#6b7280',
      }))
    : [];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead title="Reports – DayMyTime" description="View your daily productivity reports and analytics." />

      <header className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate('/app')} className="rounded-xl h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-lg font-bold">Daily Reports</h1>
            <p className="text-xs text-muted-foreground">Track your productivity over time</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Today's Live Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">Today's Progress</h2>
            <Button size="sm" variant="outline" onClick={generateTodayReport} className="rounded-xl text-xs h-7">
              Save Report
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: CalendarDays, label: 'Total', value: todayStats.total, color: 'text-primary' },
              { icon: Target, label: 'Pending', value: todayStats.pending, color: 'text-accent' },
              { icon: CheckCircle2, label: 'Done', value: todayStats.completed, color: 'text-success' },
              { icon: Clock, label: 'Focus', value: `${Math.round(todayStats.focusMin / 60)}h`, color: 'text-primary' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl border bg-card p-3 text-center">
                <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                <p className="font-display font-bold text-lg leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 p-4 rounded-2xl border bg-card"
        >
          <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center">
            <Flame className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-display font-bold text-lg">{currentStreak} day{currentStreak !== 1 ? 's' : ''}</p>
            <p className="text-xs text-muted-foreground">Current productivity streak (100% completion)</p>
          </div>
        </motion.div>

        {/* Weekly Chart */}
        {chartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              <TrendingUp className="h-3.5 w-3.5 inline mr-1.5" />
              Last 7 Days
            </h2>
            <div className="rounded-2xl border bg-card p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Report History */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
            <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />
            Report History
          </h2>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border bg-card">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-display font-semibold text-muted-foreground">No reports yet</p>
              <p className="text-xs text-muted-foreground mt-1">Reports are generated automatically at midnight</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedReport?.id === report.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-semibold text-sm">
                        {format(new Date(report.report_date), 'EEEE, MMM d')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {report.completed_schedules}/{report.total_schedules} tasks · {Math.round(report.focus_minutes / 60)}h focus
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.streak_days > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-accent font-medium">
                          <Flame className="h-3 w-3" /> {report.streak_days}
                        </span>
                      )}
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        report.productivity_score >= 80
                          ? 'bg-success/10 text-success'
                          : report.productivity_score >= 50
                          ? 'bg-accent/10 text-accent'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {report.productivity_score}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Selected Report Detail */}
        {selectedReport && pieData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Category Breakdown – {format(new Date(selectedReport.report_date), 'MMM d')}
            </h2>
            <div className="rounded-2xl border bg-card p-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {Object.entries(selectedReport.category_breakdown).map(([cat, stats]) => (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6b7280' }} />
                    <span className="capitalize text-muted-foreground">{cat}</span>
                    <span className="font-medium ml-auto">{stats.completed}/{stats.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
