import { supabase } from '@/integrations/supabase/client';

/**
 * For repeating schedules (daily/custom), completion is tracked per-date
 * in the schedule_completions table instead of the schedules.is_completed field.
 */

export function isRepeatingSchedule(repeatType: string): boolean {
  return repeatType === 'daily' || repeatType === 'custom';
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Fetch completion statuses for a list of schedule IDs on a specific date.
 * Returns a Map of scheduleId -> isCompleted
 */
export async function fetchCompletionsForDate(
  scheduleIds: string[],
  date: Date
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (scheduleIds.length === 0) return map;

  const dateStr = toDateString(date);
  const { data } = await supabase
    .from('schedule_completions')
    .select('schedule_id, is_completed')
    .eq('completion_date', dateStr)
    .in('schedule_id', scheduleIds);

  (data || []).forEach((row: any) => {
    map.set(row.schedule_id, row.is_completed);
  });

  return map;
}

/**
 * Toggle completion for a repeating schedule on a specific date.
 */
export async function toggleDateCompletion(
  scheduleId: string,
  userId: string,
  date: Date
): Promise<void> {
  const dateStr = toDateString(date);

  // Check if a record exists
  const { data: existing } = await supabase
    .from('schedule_completions')
    .select('id, is_completed')
    .eq('schedule_id', scheduleId)
    .eq('completion_date', dateStr)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('schedule_completions')
      .update({ is_completed: !existing.is_completed })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('schedule_completions')
      .insert({
        schedule_id: scheduleId,
        user_id: userId,
        completion_date: dateStr,
        is_completed: true,
      });
  }
}
