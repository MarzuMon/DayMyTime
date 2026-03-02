import { useState, useEffect } from 'react';
import { Users, Clock, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow } from 'date-fns';
import { Button } from '@/components/ui/button';
import ScheduleForm from '@/components/ScheduleForm';
import { Schedule } from '@/lib/types';
import { addSchedule } from '@/lib/scheduleStore';

interface TeamSchedule {
  id: string;
  title: string;
  scheduled_time: string;
  duration: number;
  category: string;
  display_name: string;
  avatar_url: string | null;
}

export default function TeamTimetable() {
  const [schedules, setSchedules] = useState<TeamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchTeam = async () => {
    const { data } = await supabase
      .from('schedules')
      .select('id, title, scheduled_time, duration, category, user_id')
      .gte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(20);

    if (!data || data.length === 0) { setSchedules([]); setLoading(false); return; }

    const userIds = [...new Set(data.map(s => s.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    setSchedules(data.map(s => ({
      ...s,
      display_name: profileMap.get(s.user_id)?.display_name || 'Unknown',
      avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
    })));
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();

    const channel = supabase
      .channel('team-schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        fetchTeam();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSave = async (schedule: Schedule) => {
    await addSchedule(schedule);
    fetchTeam();
  };

  if (loading) return null;

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE, MMM d');
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Team Schedule
        </h2>
        <Button size="sm" variant="outline" onClick={() => setFormOpen(true)} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-xl">
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No team schedules yet</p>
          <Button size="sm" variant="ghost" className="mt-2 gap-1" onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create one
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.slice(0, 10).map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card shadow-card">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-primary">{s.display_name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.display_name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium">{format(new Date(s.scheduled_time), 'h:mm a')}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-end">
                  <Clock className="h-3 w-3" /> {s.duration}m · {getDateLabel(s.scheduled_time)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScheduleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        editSchedule={null}
      />
    </section>
  );
}