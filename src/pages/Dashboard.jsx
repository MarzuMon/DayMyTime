import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Bell, Search, Calendar, Clock, CheckCircle2, Users,
  LayoutGrid, List, ChevronRight, Sun, Moon, LogOut, UserCircle,
  Sparkles, TrendingUp, Target, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const MOCK_SCHEDULES = [
  { id: '1', title: 'Morning Standup', time: '09:00 AM', category: 'work', done: false, duration: '30m' },
  { id: '2', title: 'Design Review', time: '11:00 AM', category: 'work', done: false, duration: '1h' },
  { id: '3', title: 'Lunch Break', time: '12:30 PM', category: 'personal', done: false, duration: '45m' },
  { id: '4', title: 'Gym Session', time: '06:00 PM', category: 'health', done: true, duration: '1h' },
  { id: '5', title: 'Read Chapter 5', time: '08:30 PM', category: 'study', done: false, duration: '30m' },
];

const CATEGORIES = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'work', label: 'Work', emoji: '💼' },
  { key: 'personal', label: 'Personal', emoji: '🏠' },
  { key: 'health', label: 'Health', emoji: '💪' },
  { key: 'study', label: 'Study', emoji: '📚' },
];

const STATS = [
  { label: 'Today', value: '5', sub: 'tasks', icon: Target, color: 'bg-primary/10 text-primary' },
  { label: 'Done', value: '1', sub: 'completed', icon: CheckCircle2, color: 'bg-success/10 text-success' },
  { label: 'Streak', value: '7', sub: 'days', icon: Zap, color: 'bg-accent/10 text-accent' },
  { label: 'Focus', value: '4.5', sub: 'hours', icon: TrendingUp, color: 'bg-primary/10 text-primary' },
];

const categoryColors = {
  work: 'bg-primary/10 text-primary border-primary/20',
  personal: 'bg-accent/10 text-accent border-accent/20',
  health: 'bg-success/10 text-success border-success/20',
  study: 'bg-warning/10 text-warning border-warning/20',
};

export default function Dashboard() {
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState('grid');

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const filtered = useMemo(() => {
    if (filter === 'all') return MOCK_SCHEDULES;
    return MOCK_SCHEDULES.filter(s => s.category === filter);
  }, [filter]);

  const pending = filtered.filter(s => !s.done);
  const done = filtered.filter(s => s.done);

  return (
    <div className="min-h-screen bg-background text-foreground font-body transition-colors">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">D</span>
            </div>
            <span className="font-display font-bold text-lg tracking-tight hidden sm:block">DayMyTime</span>
          </div>

          <nav className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Bell className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <UserCircle className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8 pb-24">
        {/* ── Greeting ── */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <p className="text-muted-foreground text-sm font-medium">{dayName}, {dateStr}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Good morning! <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">You have <span className="text-primary font-semibold">{pending.length} tasks</span> lined up today.</p>
        </motion.section>

        {/* ── Stats Grid ── */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((stat) => (
            <div key={stat.label}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow group">
              <div className={`h-9 w-9 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="h-4.5 w-4.5" />
              </div>
              <p className="font-display text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
              <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-primary/5 group-hover:scale-150 transition-transform duration-500" />
            </div>
          ))}
        </motion.section>

        {/* ── Quick Actions ── */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="flex items-center gap-3">
          <Button className="flex-1 gap-2 h-11 rounded-xl font-display font-semibold text-sm">
            <Plus className="h-4 w-4" /> New Schedule
          </Button>
          <Button variant="outline" className="flex-1 gap-2 h-11 rounded-xl font-display font-semibold text-sm">
            <Users className="h-4 w-4" /> Team View
          </Button>
        </motion.section>

        {/* ── Category Filters ── */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <button key={cat.key} onClick={() => setFilter(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border
                  ${filter === cat.key
                    ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                  }`}>
                {cat.emoji ? <span>{cat.emoji}</span> : <cat.icon className="h-3.5 w-3.5" />}
                {cat.label}
              </button>
            ))}
          </div>
        </motion.section>

        {/* ── Timeline Progress ── */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={4}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Today's Progress
            </h2>
            <span className="text-xs text-muted-foreground">{done.length}/{filtered.length} done</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${filtered.length ? (done.length / filtered.length) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </motion.section>

        {/* ── Schedule Cards ── */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={5}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Upcoming
              <span className="text-primary">({pending.length})</span>
            </h2>
            <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-secondary">
              <button onClick={() => setView('grid')}
                className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView('list')}
                className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2'}>
            {pending.map((item, i) => (
              <motion.div key={item.id}
                variants={fadeUp} initial="hidden" animate="visible" custom={i}
                className={`group relative rounded-xl border bg-card p-4 hover:shadow-lg transition-all cursor-pointer
                  ${categoryColors[item.category] || 'border-border'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {item.time}
                      </span>
                      <span className="text-xs text-muted-foreground">· {item.duration}</span>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full border-2 border-border flex items-center justify-center group-hover:border-primary transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/0 group-hover:ring-primary/20 transition-all" />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Completed ── */}
        {done.length > 0 && (
          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={6}>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" /> Completed
              <span className="text-success">({done.length})</span>
            </h2>
            <div className="space-y-2">
              {done.map((item) => (
                <div key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3 opacity-60">
                  <div className="h-7 w-7 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  </div>
                  <p className="font-display text-sm line-through">{item.title}</p>
                  <span className="ml-auto text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Team CTA ── */}
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={7}
          className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-5 flex items-center gap-4 cursor-pointer group hover:border-primary/40 transition-all">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-sm">Upgrade to Pro</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Unlock team sync, custom tones & unlimited schedules</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </motion.section>
      </main>

      {/* ── FAB ── */}
      <button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50 md:hidden"
        aria-label="Add schedule"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
