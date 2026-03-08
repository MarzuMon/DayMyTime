export type MeetingPlatform = 'zoom' | 'meet' | 'teams' | 'other';

export type ScheduleCategory = 'meeting' | 'class' | 'work' | 'personal' | 'exam' | 'team' | 'other';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export type AlarmTone = 'default' | 'chime' | 'bell' | 'alarm' | 'gentle' | 'urgent' | 'melody' | 'digital' | 'nature' | 'piano' | 'none';

export interface Schedule {
  id: string;
  title: string;
  description: string;
  scheduledTime: string; // ISO string
  duration: number; // minutes
  meetingLink?: string;
  meetingPlatform?: MeetingPlatform;
  category: ScheduleCategory;
  repeatType: RepeatType;
  isCompleted: boolean;
  createdAt: string;
  imagePath?: string;
  alarmTone: AlarmTone;
}

export function detectMeetingPlatform(url: string): MeetingPlatform {
  if (!url) return 'other';
  if (url.includes('zoom.us')) return 'zoom';
  if (url.includes('meet.google.com')) return 'meet';
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'teams';
  return 'other';
}

export const categoryConfig: Record<ScheduleCategory, { label: string; emoji: string }> = {
  personal: { label: 'Personal', emoji: '🏠' },
  meeting: { label: 'Meeting', emoji: '🤝' },
  class: { label: 'Class', emoji: '📚' },
  work: { label: 'Work', emoji: '💼' },
  exam: { label: 'Exam', emoji: '📝' },
  other: { label: 'Other', emoji: '📌' },
};

export const platformConfig: Record<MeetingPlatform, { label: string; colorClass: string }> = {
  zoom: { label: 'Zoom', colorClass: 'text-meeting-zoom' },
  meet: { label: 'Google Meet', colorClass: 'text-meeting-meet' },
  teams: { label: 'Teams', colorClass: 'text-meeting-teams' },
  other: { label: 'Link', colorClass: 'text-meeting-default' },
};
