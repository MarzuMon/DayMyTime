import { useState, useEffect, useMemo, useCallback } from 'react';
import { Schedule, categoryConfig, ScheduleCategory } from '@/lib/types';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, toggleComplete } from '@/lib/scheduleStore';
import { scheduleAllNotifications, requestNotificationPermission, getNotificationPermission } from '@/lib/notifications';
import ScheduleCard from '@/components/ScheduleCard';
import ScheduleForm from '@/components/ScheduleForm';
import TimelineView from '@/components/TimelineView';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, Filter, Bell, LayoutList, Clock, LogOut, UserCircle, Moon, Sun, Crown, Users, ChevronRight } from 'lucide-react';
// useUserRole import kept for potential future use
import { isToday, isTomorrow, isAfter, startOfToday, addDays } from 'date-fns';
import heroPattern from '@/assets/hero-pattern.png';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { useUserRole } from '@/hooks/use-user-role';

import DailyScheduleSection from '@/components/DailyScheduleSection';
import WeeklyPlanView from '@/components/WeeklyPlanView';
import AdBanner from '@/components/AdBanner';
import ReferralSection from '@/components/ReferralSection';
import InstallPrompt from '@/components/InstallPrompt';
import BottomNav from '@/components/BottomNav';

type ViewMode = 'list' | 'timeline';

const Index = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [filterCategory, setFilterCategory] = useState<ScheduleCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const [teamMemberCount, setTeamMemberCount] = useState(0);

  const refreshSchedules = useCallback(async () => {
    const s = await getSchedules();
    setSchedules(s);
    return s;
  }, []);

  useEffect(() => {
    refreshSchedules().then(s => {
      setNotifPermission(getNotificationPermission());
      scheduleAllNotifications(s, refreshSchedules);
    });
    // Fetch team member count
    supabase.from('team_members').select('id', { count: 'exact', head: true })
      .then(({ count }) => setTeamMemberCount(count ?? 0));
  }, [refreshSchedules]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      scheduleAllNotifications(schedules, refreshSchedules);
      toast({ title: '🔔 Notifications enabled', description: "You'll get alerts when schedules are due." });
    } else {
      toast({ title: 'Notifications blocked', description: 'Enable them in browser settings.', variant: 'destructive' });
    }
  };

  const handleSave = async (schedule: Schedule) => {
    let updated: Schedule[];
    if (editingSchedule) {
      updated = await updateSchedule(schedule);
    } else {
      updated = await addSchedule(schedule);
    }
    setSchedules(updated);
    setEditingSchedule(null);
    scheduleAllNotifications(updated, refreshSchedules);
  };

  const handleDelete = async (id: string) => {
    const updated = await deleteSchedule(id);
    setSchedules(updated);
    scheduleAllNotifications(updated, refreshSchedules);
  };

  const handleToggle = async (id: string) => {
    const updated = await toggleComplete(id);
    setSchedules(updated);
    scheduleAllNotifications(updated, refreshSchedules);
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
  const completedSchedules = filtered.filter(s => s.isCompleted);

  const renderSection = (title: string, items: Schedule[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          {title} <span className="text-primary">({items.length})</span>
        </h2>
        <div className="space-y-2">
          {items.map(s => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onToggleComplete={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b bg-card">
        <img src={heroPattern} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="relative max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/images/daymytime-icon.png" alt="DayMyTime" className="h-8 w-8 rounded-md" />
              <img src="/images/daymytime-logo.png" alt="DayMyTime" className="h-7 hidden sm:block" />
              <h1 className="font-display text-3xl font-bold tracking-tight sm:hidden">DayMyTime</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button size="sm" variant="ghost" onClick={() => navigate('/profile')}>
                <UserCircle className="h-4 w-4 mr-1" /> Profile
              </Button>
              <Button size="sm" variant="ghost" onClick={() => navigate('/pro')}>
                <Crown className="h-4 w-4 mr-1" /> Pro
              </Button>
              <Button size="sm" variant="ghost" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1" /> Sign out
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Your smart visual scheduler. Simple, fast, meeting-ready.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <Button size="lg" onClick={() => { setEditingSchedule(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Schedule
            </Button>
            {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
              <Button size="lg" variant="outline" onClick={handleEnableNotifications}>
                <Bell className="h-4 w-4 mr-2" /> Enable Alerts
              </Button>
            )}
            {notifPermission === 'granted' && (
              <span className="flex items-center gap-1 text-xs text-success">
                <Bell className="h-3.5 w-3.5" /> Alerts on
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Filters + View Toggle */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto flex-1 scrollbar-hide">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                  filterCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                All
              </button>
              {Object.entries(categoryConfig).map(([key, { label, emoji }]) => (
                <button
                  key={key}
                  onClick={() => setFilterCategory(key as ScheduleCategory)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                    filterCategory === key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-secondary flex-shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'timeline' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title="Timeline view"
              >
                <Clock className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Plan */}
        <WeeklyPlanView />

        {/* Daily Schedule */}
        <DailyScheduleSection />

        {/* Team Schedule shortcut */}
        <div
          onClick={() => navigate('/teams')}
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 cursor-pointer transition-all group shadow-sm"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm uppercase tracking-wider text-foreground">Team Schedule</span>
              {teamMemberCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {teamMemberCount}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">View & manage team timetables</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="font-display text-lg font-semibold text-muted-foreground">No schedules yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Tap "Add Schedule" to get started</p>
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="space-y-6">
            <TimelineView schedules={filtered} selectedDate={new Date()} onEdit={handleEdit} />
            <TimelineView schedules={filtered} selectedDate={addDays(new Date(), 1)} onEdit={handleEdit} />
          </div>
        ) : (
          <>
            {renderSection('Today', todaySchedules)}
            {renderSection('Tomorrow', tomorrowSchedules)}
            {renderSection('Upcoming', upcomingSchedules)}
            {renderSection('Completed', completedSchedules)}
          </>
        )}

        {/* Team Timetable removed from dashboard - teams page only */}

        {/* Referral Section */}
        <ReferralSection />

        {/* Ad Banner for free users */}
        <AdBanner />

      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* FAB - positioned above bottom nav */}
      <button
        onClick={() => { setEditingSchedule(null); setFormOpen(true); }}
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-105 transition-transform md:hidden z-50"
        aria-label="Add schedule"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom Navigation */}
      <BottomNav />

      <ScheduleForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingSchedule(null);
        }}
        onSave={handleSave}
        editSchedule={editingSchedule}
      />
    </div>
  );
};

export default Index;
