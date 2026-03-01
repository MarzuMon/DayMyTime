import { useState, useEffect } from 'react';
import { Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow } from 'date-fns';

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

  if (loading) return null;
  if (schedules.length === 0) return null;

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE, MMM d');
  };

  return (
    <section className="space-y-4">
      <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Users className="h-4 w-4" /> Team Timetable
      </h2>
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
    </section>
  );
}
