import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { CalendarDays, Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface DailySlot {
  id: string;
  title: string;
  time: string; // HH:mm
  duration: number;
}

const DEFAULT_SLOTS: DailySlot[] = [];

export default function DailyScheduleSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<DailySlot[]>(DEFAULT_SLOTS);
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', `daily_schedule_${user.id}`)
      .maybeSingle();
    if (data?.value && Array.isArray(data.value)) {
      setSlots(data.value as unknown as DailySlot[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const saveSlots = async (updated: DailySlot[]) => {
    if (!user) return;
    setSlots(updated);
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key: `daily_schedule_${user.id}`, value: updated as any }, { onConflict: 'key' });
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    }
  };

  const addSlot = () => {
    const newSlot: DailySlot = {
      id: crypto.randomUUID(),
      title: '',
      time: '09:00',
      duration: 30,
    };
    saveSlots([...slots, newSlot]);
  };

  const updateSlot = (id: string, field: keyof DailySlot, value: string | number) => {
    const updated = slots.map(s => s.id === id ? { ...s, [field]: value } : s);
    saveSlots(updated);
  };

  const removeSlot = (id: string) => {
    saveSlots(slots.filter(s => s.id !== id));
  };

  const applyToday = async () => {
    if (!user || slots.length === 0) return;
    const today = new Date();
    const dateStr = format(today, 'yyyy-MM-dd');

    for (const slot of slots) {
      if (!slot.title.trim()) continue;
      const scheduledTime = new Date(`${dateStr}T${slot.time}:00`).toISOString();
      await supabase.from('schedules').insert({
        user_id: user.id,
        title: slot.title,
        scheduled_time: scheduledTime,
        duration: slot.duration,
        category: 'personal',
        repeat_type: 'none',
      });
    }
    toast({ title: '✅ Daily schedule applied', description: `${slots.filter(s => s.title.trim()).length} tasks added for today.` });
  };

  if (loading) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Set Daily Schedule
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addSlot}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Slot
          </Button>
          {slots.length > 0 && (
            <Button size="sm" onClick={applyToday}>
              Apply Today
            </Button>
          )}
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-xl">
          <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No daily routine set yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add time slots to create your daily template</p>
        </div>
      ) : (
        <div className="space-y-2">
          {slots.sort((a, b) => a.time.localeCompare(b.time)).map(slot => (
            <div key={slot.id} className="flex items-center gap-2 p-3 rounded-xl border bg-card shadow-card">
              <input
                type="time"
                value={slot.time}
                onChange={e => updateSlot(slot.id, 'time', e.target.value)}
                className="bg-secondary rounded-md px-2 py-1 text-sm font-mono w-24 border-0"
              />
              <Input
                value={slot.title}
                onChange={e => updateSlot(slot.id, 'title', e.target.value)}
                placeholder="Task name..."
                className="flex-1 h-8 text-sm"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="number"
                  value={slot.duration}
                  onChange={e => updateSlot(slot.id, 'duration', parseInt(e.target.value) || 15)}
                  className="bg-secondary rounded-md px-2 py-1 text-sm w-14 text-center border-0"
                  min={5}
                  max={480}
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
              <button onClick={() => removeSlot(slot.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
