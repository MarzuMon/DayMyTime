import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, getDay } from 'date-fns';
import { Calendar, ChevronDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { categoryConfig } from '@/lib/types';

interface DailySlot {
  id: string;
  title: string;
  time: string;
  duration: number;
  category: string;
}

interface DailyTemplate {
  id: string;
  name: string;
  slots: DailySlot[];
}

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface WeeklyMapping {
  [day: number]: string; // day index -> template id
}

export default function WeeklyTemplateView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DailyTemplate[]>([]);
  const [mapping, setMapping] = useState<WeeklyMapping>({});
  const [loading, setLoading] = useState(true);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);

  const today = getDay(new Date()) as DayOfWeek;

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [templatesRes, mappingRes] = await Promise.all([
      supabase.from('admin_settings').select('value').eq('key', `daily_templates_${user.id}`).maybeSingle(),
      supabase.from('admin_settings').select('value').eq('key', `weekly_mapping_${user.id}`).maybeSingle(),
    ]);

    if (templatesRes.data?.value && Array.isArray(templatesRes.data.value)) {
      setTemplates(templatesRes.data.value as unknown as DailyTemplate[]);
    }

    if (mappingRes.data?.value && typeof mappingRes.data.value === 'object' && !Array.isArray(mappingRes.data.value)) {
      const val = mappingRes.data.value as Record<string, unknown>;
      const parsed: WeeklyMapping = {};
      for (const [k, v] of Object.entries(val)) {
        if (k !== 'autoApply') parsed[Number(k)] = v as string;
      }
      setMapping(parsed);
      setAutoApplyEnabled(!!(val as any).autoApply);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-apply on load if enabled
  useEffect(() => {
    if (!autoApplyEnabled || !user || loading || templates.length === 0) return;

    const todayTemplateId = mapping[today];
    if (!todayTemplateId) return;

    const lastApplyKey = `last_auto_apply_${user.id}`;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastApply = localStorage.getItem(lastApplyKey);

    if (lastApply === todayStr) return; // Already applied today

    const template = templates.find(t => t.id === todayTemplateId);
    if (!template || template.slots.length === 0) return;

    applyTemplate(template, true);
    localStorage.setItem(lastApplyKey, todayStr);
  }, [autoApplyEnabled, user, loading, templates, mapping, today]);

  const saveMapping = async (newMapping: WeeklyMapping, newAutoApply: boolean) => {
    if (!user) return;
    setMapping(newMapping);
    setAutoApplyEnabled(newAutoApply);
    await supabase.from('admin_settings').upsert({
      key: `weekly_mapping_${user.id}`,
      value: { ...newMapping, autoApply: newAutoApply } as any,
    }, { onConflict: 'key' });
  };

  const handleDayChange = (day: number, templateId: string) => {
    const newMapping = { ...mapping };
    if (templateId === '') {
      delete newMapping[day];
    } else {
      newMapping[day] = templateId;
    }
    saveMapping(newMapping, autoApplyEnabled);
  };

  const applyTemplate = async (template: DailyTemplate, silent = false) => {
    if (!user) return;
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    let count = 0;

    for (const slot of template.slots) {
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
      count++;
    }

    if (!silent) {
      toast({ title: '✅ Template applied', description: `${count} tasks added for today from "${template.name}".` });
    }
  };

  const todayTemplate = templates.find(t => t.id === mapping[today]);

  if (loading || templates.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Weekly Template Plan
        </h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoApplyEnabled}
              onChange={e => saveMapping(mapping, e.target.checked)}
              className="rounded border-border"
            />
            <Zap className="h-3 w-3" />
            Auto-apply
          </label>
        </div>
      </div>

      {/* Day-to-template grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_NAMES.map((name, i) => {
          const isToday = i === today;
          const assignedTemplate = templates.find(t => t.id === mapping[i]);
          
          return (
            <div
              key={i}
              className={`rounded-lg border p-2 text-center transition-colors ${
                isToday
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card'
              }`}
            >
              <div className={`text-xs font-semibold mb-1.5 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {name}
              </div>
              <select
                value={mapping[i] || ''}
                onChange={e => handleDayChange(i, e.target.value)}
                className="w-full bg-secondary rounded px-1 py-0.5 text-[10px] border-0 appearance-none cursor-pointer text-center truncate"
                title={DAY_FULL[i]}
              >
                <option value="">—</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {assignedTemplate && (
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {assignedTemplate.slots.length} slots
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Today's template quick-apply */}
      {todayTemplate && (
        <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
          <div className="flex-1">
            <div className="text-sm font-medium">
              Today's template: <span className="text-primary">{todayTemplate.name}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {todayTemplate.slots.filter(s => s.title.trim()).length} tasks •{' '}
              {todayTemplate.slots.reduce((sum, s) => sum + s.duration, 0)} min total
            </div>
          </div>
          <Button size="sm" onClick={() => applyTemplate(todayTemplate)}>
            Apply Now
          </Button>
        </div>
      )}
    </section>
  );
}
