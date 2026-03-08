import { supabase } from '@/integrations/supabase/client';
import { Schedule } from './types';

// Map DB row to Schedule type
function rowToSchedule(row: any): Schedule {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    scheduledTime: row.scheduled_time,
    duration: row.duration,
    meetingLink: row.meeting_link || undefined,
    meetingPlatform: row.meeting_platform || undefined,
    category: row.category,
    repeatType: row.repeat_type,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    imagePath: row.image_path || undefined,
    alarmTone: row.alarm_tone || 'default',
    teamId: row.team_id || undefined,
    repeatDays: row.repeat_days || undefined,
  };
}

export async function getSchedules(): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('scheduled_time', { ascending: true });

  if (error) {
    console.error('Schedule fetch failed');
    return [];
  }
  return (data || []).map(rowToSchedule);
}

export async function addSchedule(schedule: Schedule): Promise<Schedule[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { error } = await supabase.from('schedules').insert({
    id: schedule.id,
    user_id: user.id,
    title: schedule.title,
    description: schedule.description,
    scheduled_time: schedule.scheduledTime,
    duration: schedule.duration,
    meeting_link: schedule.meetingLink || null,
    meeting_platform: schedule.meetingPlatform || null,
    category: schedule.category,
    repeat_type: schedule.repeatType,
    is_completed: schedule.isCompleted,
    image_path: schedule.imagePath || null,
    alarm_tone: schedule.alarmTone || 'default',
    team_id: schedule.teamId || null,
    repeat_days: schedule.repeatDays || null,
  });

  if (error) console.error('Schedule add failed');
  return getSchedules();
}

export async function updateSchedule(updated: Schedule): Promise<Schedule[]> {
  const { error } = await supabase.from('schedules').update({
    title: updated.title,
    description: updated.description,
    scheduled_time: updated.scheduledTime,
    duration: updated.duration,
    meeting_link: updated.meetingLink || null,
    meeting_platform: updated.meetingPlatform || null,
    category: updated.category,
    repeat_type: updated.repeatType,
    is_completed: updated.isCompleted,
    image_path: updated.imagePath || null,
    alarm_tone: updated.alarmTone || 'default',
    team_id: updated.teamId || null,
    repeat_days: updated.repeatDays || null,
  }).eq('id', updated.id);

  if (error) console.error('Error updating schedule:', error);
  return getSchedules();
}

export async function deleteSchedule(id: string): Promise<Schedule[]> {
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) console.error('Error deleting schedule:', error);
  return getSchedules();
}

export async function toggleComplete(id: string): Promise<Schedule[]> {
  // Fetch current state first
  const { data } = await supabase.from('schedules').select('is_completed').eq('id', id).single();
  if (data) {
    await supabase.from('schedules').update({ is_completed: !data.is_completed }).eq('id', id);
  }
  return getSchedules();
}
