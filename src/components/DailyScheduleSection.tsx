import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { CalendarDays, Plus, Trash2, Clock, ChevronUp, ArrowUpToLine, GripVertical, Copy, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScheduleCategory, categoryConfig } from '@/lib/types';

interface DailySlot {
  id: string;
  title: string;
  time: string;
  duration: number;
  category: ScheduleCategory;
}

interface DailyTemplate {
  id: string;
  name: string;
  slots: DailySlot[];
}

const categoryColors: Record<ScheduleCategory, string> = {
  meeting: 'border-l-blue-500 bg-blue-500/5',
  class: 'border-l-violet-500 bg-violet-500/5',
  work: 'border-l-amber-500 bg-amber-500/5',
  personal: 'border-l-emerald-500 bg-emerald-500/5',
  exam: 'border-l-rose-500 bg-rose-500/5',
  other: 'border-l-slate-400 bg-slate-400/5',
};

const categoryDotColors: Record<ScheduleCategory, string> = {
  meeting: 'bg-blue-500',
  class: 'bg-violet-500',
  work: 'bg-amber-500',
  personal: 'bg-emerald-500',
  exam: 'bg-rose-500',
  other: 'bg-slate-400',
};

const DEFAULT_TEMPLATES: DailyTemplate[] = [
  { id: 'weekday', name: 'Weekday', slots: [] },
  { id: 'weekend', name: 'Weekend', slots: [] },
  { id: 'study', name: 'Study Day', slots: [] },
];

export default function DailyScheduleSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DailyTemplate[]>(DEFAULT_TEMPLATES);
  const [activeTemplateId, setActiveTemplateId] = useState('weekday');
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];
  const slots = activeTemplate?.slots || [];

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', `daily_templates_${user.id}`)
      .maybeSingle();
    
    if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
      setTemplates(data.value as unknown as DailyTemplate[]);
      setActiveTemplateId((data.value as unknown as DailyTemplate[])[0].id);
    } else {
      // Migrate old single-template data
      const { data: oldData } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', `daily_schedule_${user.id}`)
        .maybeSingle();
      
      if (oldData?.value && Array.isArray(oldData.value) && oldData.value.length > 0) {
        const migrated: DailyTemplate[] = [
          { id: 'weekday', name: 'Weekday', slots: oldData.value as unknown as DailySlot[] },
          { id: 'weekend', name: 'Weekend', slots: [] },
          { id: 'study', name: 'Study Day', slots: [] },
        ];
        setTemplates(migrated);
        await saveTemplates(migrated);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const saveTemplates = async (updated: DailyTemplate[]) => {
    if (!user) return;
    setTemplates(updated);
    await supabase
      .from('admin_settings')
      .upsert({ key: `daily_templates_${user.id}`, value: updated as any }, { onConflict: 'key' });
  };

  const updateSlots = (newSlots: DailySlot[]) => {
    const updated = templates.map(t =>
      t.id === activeTemplateId ? { ...t, slots: newSlots } : t
    );
    saveTemplates(updated);
  };

  const addSlot = () => {
    const newSlot: DailySlot = {
      id: crypto.randomUUID(),
      title: '',
      time: '09:00',
      duration: 30,
      category: 'personal',
    };
    updateSlots([...slots, newSlot]);
  };

  const updateSlot = (id: string, field: keyof DailySlot, value: string | number) => {
    updateSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSlot = (id: string) => {
    updateSlots(slots.filter(s => s.id !== id));
  };

  const moveToTop = (index: number) => {
    if (index === 0) return;
    const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
    const item = sorted[index];
    const newSlots = [item, ...sorted.filter((_, i) => i !== index)];
    updateSlots(newSlots);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
    const newSlots = [...sorted];
    [newSlots[index - 1], newSlots[index]] = [newSlots[index], newSlots[index - 1]];
    // Swap times to maintain order
    const tempTime = newSlots[index - 1].time;
    newSlots[index - 1] = { ...newSlots[index - 1], time: newSlots[index].time };
    newSlots[index] = { ...newSlots[index], time: tempTime };
    updateSlots(newSlots);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
      const newSlots = [...sorted];
      const [moved] = newSlots.splice(dragIndex, 1);
      newSlots.splice(dragOverIndex, 0, moved);
      updateSlots(newSlots);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const addTemplate = () => {
    const newTemplate: DailyTemplate = {
      id: crypto.randomUUID(),
      name: `Template ${templates.length + 1}`,
      slots: [],
    };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setActiveTemplateId(newTemplate.id);
  };

  const duplicateTemplate = () => {
    if (!activeTemplate) return;
    const dup: DailyTemplate = {
      id: crypto.randomUUID(),
      name: `${activeTemplate.name} (Copy)`,
      slots: activeTemplate.slots.map(s => ({ ...s, id: crypto.randomUUID() })),
    };
    const updated = [...templates, dup];
    saveTemplates(updated);
    setActiveTemplateId(dup.id);
  };

  const deleteTemplate = () => {
    if (templates.length <= 1) return;
    const updated = templates.filter(t => t.id !== activeTemplateId);
    saveTemplates(updated);
    setActiveTemplateId(updated[0].id);
  };

  const startRename = () => {
    setRenamingId(activeTemplateId);
    setRenameValue(activeTemplate?.name || '');
  };

  const confirmRename = () => {
    if (!renameValue.trim()) return;
    const updated = templates.map(t =>
      t.id === renamingId ? { ...t, name: renameValue.trim() } : t
    );
    saveTemplates(updated);
    setRenamingId(null);
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
        category: slot.category,
        repeat_type: 'none',
      });
    }
    toast({ title: '✅ Daily schedule applied', description: `${slots.filter(s => s.title.trim()).length} tasks added for today.` });
  };

  if (loading) return null;

  const sortedSlots = [...slots].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Today Schedules
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

      {/* Template tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTemplateId(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
              activeTemplateId === t.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {renamingId === t.id ? (
              <span className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <input
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmRename()}
                  className="bg-transparent border-b border-primary-foreground/50 outline-none w-20 text-xs"
                  autoFocus
                />
                <Check className="h-3 w-3 cursor-pointer" onClick={confirmRename} />
                <X className="h-3 w-3 cursor-pointer" onClick={() => setRenamingId(null)} />
              </span>
            ) : (
              <>
                {t.name} ({t.slots.length})
              </>
            )}
          </button>
        ))}
        <button
          onClick={addTemplate}
          className="px-2 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Template actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={startRename} className="text-xs h-7">
          <Edit2 className="h-3 w-3 mr-1" /> Rename
        </Button>
        <Button size="sm" variant="ghost" onClick={duplicateTemplate} className="text-xs h-7">
          <Copy className="h-3 w-3 mr-1" /> Duplicate
        </Button>
        {templates.length > 1 && (
          <Button size="sm" variant="ghost" onClick={deleteTemplate} className="text-xs h-7 text-destructive hover:text-destructive">
            <Trash2 className="h-3 w-3 mr-1" /> Delete Template
          </Button>
        )}
      </div>

      {sortedSlots.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-xl">
          <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No slots in "{activeTemplate?.name}"</p>
          <p className="text-xs text-muted-foreground mt-1">Add time slots to build this template</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSlots.map((slot, index) => (
            <div
              key={slot.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-3 rounded-xl border border-l-4 shadow-card transition-all ${categoryColors[slot.category]} ${
                dragOverIndex === index ? 'ring-2 ring-primary/40' : ''
              } ${dragIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
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
              <select
                value={slot.category}
                onChange={e => updateSlot(slot.id, 'category', e.target.value)}
                className="bg-secondary rounded-md px-2 py-1 text-sm border-0 appearance-none cursor-pointer"
              >
                {Object.entries(categoryConfig).map(([key, { label, emoji }]) => (
                  <option key={key} value={key}>{emoji} {label}</option>
                ))}
              </select>
              <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${categoryDotColors[slot.category]}`} />
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
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {index > 0 && (
                  <>
                    <button onClick={() => moveToTop(index)} className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Move to top">
                      <ArrowUpToLine className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveUp(index)} className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Move up">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                <button onClick={() => removeSlot(slot.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
