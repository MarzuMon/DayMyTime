import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Schedule, categoryConfig, ScheduleCategory } from '@/lib/types';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, toggleComplete } from '@/lib/scheduleStore';
import { scheduleAllNotifications, requestNotificationPermission, getNotificationPermission } from '@/lib/notifications';
import ScheduleCard from '@/components/ScheduleCard';
import ScheduleForm from '@/components/ScheduleForm';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, Filter, Bell, LayoutList, Clock, LogOut, UserCircle, Moon, Sun, Crown, Users, ChevronRight, Target, CheckCircle2, Timer } from 'lucide-react';
import { isToday, isTomorrow, isAfter, startOfToday, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { useUserRole } from '@/hooks/use-user-role';
import { useIsMobile } from '@/hooks/use-mobile';
import SEOHead from '@/components/SEOHead';
import DashboardSkeleton from '@/components/DashboardSkeleton';

// Lazy load all non-critical components
const DailyScheduleSection = lazy(() => import('@/components/DailyScheduleSection'));
const WeeklyPlanView = lazy(() => import('@/components/WeeklyPlanView'));
const InstallPrompt = lazy(() => import('@/components/InstallPrompt'));
const BottomNav = lazy(() => import('@/components/BottomNav'));
const TimelineView = lazy(() => import('@/components/TimelineView'));

type ViewMode = 'list' | 'timeline';

const Index = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [filterCategory, setFilterCategory] = useState<ScheduleCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [isPro, setIsPro] = useState(false);

  const refreshSchedules = useCallback(async () => {
    const s = await getSchedules();
    setSchedules(s);
    setIsLoading(false);
    return s;
  }, []);

  useEffect(() => {
    refreshSchedules().then(s => {
      setNotifPermission(getNotificationPermission());
      scheduleAllNotifications(s, refreshSchedules, isPro);
    });
    supabase.from('team_members').select('id', { count: 'exact', head: true })
      .then(({ count }) => setTeamMemberCount(count ?? 0));
  }, [refreshSchedules]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || '');
      });
  }, [user]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      scheduleAllNotifications(schedules, refreshSchedules, isPro);
      toast({ title: '🔔 Notifications enabled', description: "You'll get alerts when schedules are due." });
    } else {
      toast({ title: 'Notifications blocked', description: 'Enable them in browser settings.', variant: 'destructive' });
    }
  };

  const handleSave = async (schedule: Schedule) => {
    const updated = editingSchedule ? await updateSchedule(schedule) : await addSchedule(schedule);
    setSchedules(updated);
    setEditingSchedule(null);
    scheduleAllNotifications(updated, refreshSchedules, isPro);
  };

  const handleDelete = async (id: string) => {
    const updated = await deleteSchedule(id);
    setSchedules(updated);
    scheduleAllNotifications(updated, refreshSchedules, isPro);
  };

  const handleToggle = async (id: string) => {
    const updated = await toggleComplete(id);
    setSchedules(updated);
    scheduleAllNotifications(updated, refreshSchedules, isPro);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormOpen(true);
  };

  const filtered = useMemo(() => {
    let items = schedules;
    if (filterCategory !== 'all') {
      items = items.filter(s => s.category === filterCategory);
    }
    return items.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [schedules, filterCategory]);

  const todaySchedules = filtered.filter(s => isToday(new Date(s.scheduledTime)) && !s.isCompleted);
  const tomorrowSchedules = filtered.filter(s => isTomorrow(new Date(s.scheduledTime)) && !s.isCompleted);
  const upcomingSchedules = filtered.filter(s => {
    const d = new Date(s.scheduledTime);
    return !isToday(d) && !isTomorrow(d) && isAfter(d, startOfToday()) && !s.isCompleted;
  });
  const _completedSchedules = filtered.filter(s => s.isCompleted);

  // Quick stats
  const todayTotal = schedules.filter(s => isToday(new Date(s.scheduledTime))).length;
  const todayDone = schedules.filter(s => isToday(new Date(s.scheduledTime)) && s.isCompleted).length;
  const todayRemaining = todayTotal - todayDone;
  const focusMinutes = schedules.filter(s => s.isCompleted && isToday(new Date(s.scheduledTime))).reduce((sum, s) => sum + (s.duration || 0), 0);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const renderSection = (title: string, items: Schedule[]) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3" aria-label={`${title} schedules`}>
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {title} <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{items.length}</span>
        </h2>
        <div className="space-y-2">
          {items.map(s => (
            <ScheduleCard key={s.id} schedule={s} onToggleComplete={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
          ))}
        </div>
      </section>
    );
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead title="Dashboard – DayMyTime" description="Manage your schedules, meetings, and daily tasks." />

      {/* Header */}
      <header className="relative overflow-hidden border-b">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative max-w-2xl mx-auto px-4 py-5 sm:py-7">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <img src="/images/logo-icon.webp" alt="DayMyTime" className="h-9 w-9 rounded-xl shadow-glow" width={36} height={36} fetchPriority="high" />
              <div className="hidden sm:block">
                <span className="font-display font-bold text-base">DayMyTime</span>
              </div>
            </div>
            <nav className="flex items-center gap-1" aria-label="App navigation">
              <Button size="icon" variant="ghost" onClick={toggleTheme} className="h-8 w-8 rounded-xl" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {isAdmin && (
                <Button size="icon" variant="ghost" onClick={() => navigate('/marzooq-dashboard')} className="h-8 w-8 rounded-xl" aria-label="Admin">
                  <Crown className="h-4 w-4 text-accent" />
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => navigate('/profile')} className="h-8 w-8 rounded-xl" aria-label="Profile">
                <UserCircle className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={signOut} className="h-8 w-8 rounded-xl" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </nav>
          </div>

          {/* Greeting */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              {greeting}{displayName ? `, ${displayName}` : ''} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Here's your schedule overview</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
            {[
              { icon: CalendarDays, label: 'Today', value: todayTotal, color: 'text-primary' },
              { icon: Target, label: 'Remaining', value: todayRemaining, color: 'text-accent' },
              { icon: CheckCircle2, label: 'Done', value: todayDone, color: 'text-success' },
              { icon: Timer, label: 'Focus', value: `${Math.round(focusMinutes / 60)}h`, color: 'text-primary' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl glass p-3 text-center" style={{ minHeight: '76px' }}>
                <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                <p className="font-display font-bold text-lg leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={() => { setEditingSchedule(null); setFormOpen(true); }} className="rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90 h-10">
              <Plus className="h-4 w-4 mr-1.5" /> Add Schedule
            </Button>
            {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
              <Button variant="outline" onClick={handleEnableNotifications} className="rounded-xl h-10">
                <Bell className="h-4 w-4 mr-1.5" /> Enable Alerts
              </Button>
            )}
            {notifPermission === 'granted' && (
              <span className="flex items-center gap-1.5 text-xs text-success font-medium" role="status">
                <Bell className="h-3.5 w-3.5" /> Alerts on
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 sm:space-y-6">
        {/* Filters + View Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 scrollbar-hide" role="tablist" aria-label="Category filter">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <button
              onClick={() => setFilterCategory('all')}
              role="tab"
              aria-selected={filterCategory === 'all'}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                filterCategory === 'all'
                  ? 'gradient-primary text-primary-foreground shadow-glow'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              All
            </button>
            {Object.entries(categoryConfig).map(([key, { label, emoji }]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key as ScheduleCategory)}
                role="tab"
                aria-selected={filterCategory === key}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                  filterCategory === key
                    ? 'gradient-primary text-primary-foreground shadow-glow'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 border rounded-xl p-0.5 bg-secondary flex-shrink-0" role="tablist" aria-label="View mode">
            <button
              onClick={() => setViewMode('list')}
              role="tab"
              aria-selected={viewMode === 'list'}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-card' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              role="tab"
              aria-selected={viewMode === 'timeline'}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-card shadow-card' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Timeline view"
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekly Plan */}
        <Suspense fallback={null}>
          <WeeklyPlanView
            onEdit={(schedule) => { setEditingSchedule(schedule); setFormOpen(true); }}
            onCreateForDate={(date) => {
              setEditingSchedule(null);
              setFormOpen(true);
              // Pass date via a small timeout so the form mounts first
              setTimeout(() => {
                const event = new CustomEvent('prefill-schedule-date', { detail: date.toISOString() });
                window.dispatchEvent(event);
              }, 100);
            }}
          />
        </Suspense>

        {/* Daily Schedule */}
        <Suspense fallback={null}>
          <DailyScheduleSection
            onToggleComplete={handleToggle}
            onEdit={(schedule) => { setEditingSchedule(schedule); setFormOpen(true); }}
            onDelete={handleDelete}
          />
        </Suspense>

        {/* Team Schedule shortcut */}
        <div
          onClick={() => navigate('/teams')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/teams')}
          className="flex items-center gap-3 p-4 rounded-2xl border bg-card hover:shadow-elevated cursor-pointer transition-all group"
          aria-label="Go to Team Schedule"
        >
          <div className="h-11 w-11 rounded-xl bg-meeting-teams/10 flex items-center justify-center group-hover:bg-meeting-teams/20 transition-colors">
            <Users className="h-5 w-5 text-meeting-teams" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm">Team Schedule</span>
              {teamMemberCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold">
                  {teamMemberCount}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">View & manage team timetables</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 sm:py-20 animate-in fade-in zoom-in-95 duration-300">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="font-display text-lg font-semibold text-muted-foreground">No schedules yet</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Tap "Add Schedule" to get started</p>
            <Button onClick={() => { setEditingSchedule(null); setFormOpen(true); }} className="rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90">
              <Plus className="h-4 w-4 mr-1.5" /> Create your first schedule
            </Button>
          </div>
        ) : viewMode === 'timeline' ? (
          <Suspense fallback={<div className="h-96 animate-pulse bg-secondary/50 rounded-2xl" />}>
            <div className="space-y-6">
              <TimelineView schedules={filtered} selectedDate={new Date()} onEdit={handleEdit} />
              <TimelineView schedules={filtered} selectedDate={addDays(new Date(), 1)} onEdit={handleEdit} />
            </div>
          </Suspense>
        ) : (
          <>
            {renderSection('Today', todaySchedules)}
            {renderSection('Tomorrow', tomorrowSchedules)}
            {renderSection('Upcoming', upcomingSchedules)}
          </>
        )}

      </main>

      {!isMobile && <Suspense fallback={null}><InstallPrompt /></Suspense>}

      {/* FAB */}
      <button
        onClick={() => { setEditingSchedule(null); setFormOpen(true); }}
        className="fixed bottom-20 right-4 sm:right-6 h-14 w-14 rounded-2xl gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-transform md:hidden z-50"
        aria-label="Add schedule"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Suspense fallback={null}><BottomNav /></Suspense>

      <ScheduleForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingSchedule(null); }}
        onSave={handleSave}
        editSchedule={editingSchedule}
      />
    </div>
  );
};

export default Index;
