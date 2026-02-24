import { useState, useEffect, useMemo } from 'react';
import { Schedule, categoryConfig, ScheduleCategory } from '@/lib/types';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, toggleComplete } from '@/lib/scheduleStore';
import ScheduleCard from '@/components/ScheduleCard';
import ScheduleForm from '@/components/ScheduleForm';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, Filter } from 'lucide-react';
import { isToday, isTomorrow, isAfter, startOfToday } from 'date-fns';
import heroPattern from '@/assets/hero-pattern.png';

const Index = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [filterCategory, setFilterCategory] = useState<ScheduleCategory | 'all'>('all');

  useEffect(() => {
    setSchedules(getSchedules());
  }, []);

  const handleSave = (schedule: Schedule) => {
    if (editingSchedule) {
      setSchedules(updateSchedule(schedule));
    } else {
      setSchedules(addSchedule(schedule));
    }
    setEditingSchedule(null);
  };

  const handleDelete = (id: string) => {
    setSchedules(deleteSchedule(id));
  };

  const handleToggle = (id: string) => {
    setSchedules(toggleComplete(id));
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
        <img
          src={heroPattern}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold tracking-tight">
              TimeWise
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Your smart visual scheduler. Simple, fast, meeting-ready.
          </p>
          <Button
            className="mt-5"
            size="lg"
            onClick={() => { setEditingSchedule(null); setFormOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Schedule
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
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
      </div>

      {/* Schedule Lists */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="font-display text-lg font-semibold text-muted-foreground">No schedules yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Tap "Add Schedule" to get started</p>
          </div>
        ) : (
          <>
            {renderSection('Today', todaySchedules)}
            {renderSection('Tomorrow', tomorrowSchedules)}
            {renderSection('Upcoming', upcomingSchedules)}
            {renderSection('Completed', completedSchedules)}
          </>
        )}
      </main>

      {/* FAB for mobile */}
      <button
        onClick={() => { setEditingSchedule(null); setFormOpen(true); }}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-105 transition-transform md:hidden"
        aria-label="Add schedule"
      >
        <Plus className="h-6 w-6" />
      </button>

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
