import { Schedule, platformConfig } from './types';
import { toggleComplete } from './scheduleStore';
import { playAlarmTone, stopAlarmTone } from './alarmTones';

let scheduledTimers: Map<string, number> = new Map();

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function scheduleNotification(schedule: Schedule, onUpdate?: () => void) {
  cancelNotification(schedule.id);

  const time = new Date(schedule.scheduledTime).getTime();
  const now = Date.now();
  const delay = time - now;

  if (delay <= 0 || schedule.isCompleted) return;

  const timer = window.setTimeout(() => {
    showNotification(schedule, onUpdate);
    scheduledTimers.delete(schedule.id);
  }, delay);

  scheduledTimers.set(schedule.id, timer);
}

export function cancelNotification(id: string) {
  const timer = scheduledTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    scheduledTimers.delete(id);
  }
}

export function cancelAllNotifications() {
  scheduledTimers.forEach(timer => clearTimeout(timer));
  scheduledTimers.clear();
}

export function scheduleAllNotifications(schedules: Schedule[], onUpdate?: () => void) {
  cancelAllNotifications();
  schedules
    .filter(s => !s.isCompleted)
    .forEach(s => scheduleNotification(s, onUpdate));
}

function showNotification(schedule: Schedule, onUpdate?: () => void) {
  if (Notification.permission !== 'granted') return;

  // Play alarm tone
  try {
    playAlarmTone(schedule.alarmTone || 'default');
    // Stop alarm after 10 seconds
    setTimeout(() => stopAlarmTone(), 10000);
  } catch (e) {
    console.warn('Could not play alarm tone:', e);
  }

  const catEmoji = schedule.category === 'meeting' ? '🤝' : 
    schedule.category === 'class' ? '📚' : 
    schedule.category === 'work' ? '💼' : '📌';

  const body = schedule.meetingLink
    ? `${schedule.description || 'Starts now'}\n🔗 Click to join meeting`
    : schedule.description || 'Starts now';

  const notification = new Notification(`${catEmoji} ${schedule.title}`, {
    body,
    icon: '/favicon.png',
    tag: schedule.id,
    requireInteraction: true,
  });

  notification.onclick = () => {
    stopAlarmTone();
    window.focus();
    if (schedule.meetingLink) {
      window.open(schedule.meetingLink, '_blank');
    }
    notification.close();
  };

  // Auto-snooze: show again in 5 min if not dismissed
  // The browser handles close, but we can schedule completion after duration
  if (schedule.duration) {
    window.setTimeout(() => {
      // Duration ended notification
      new Notification(`✅ ${schedule.title} — Duration Complete`, {
        body: `${schedule.duration} minutes have passed`,
        icon: '/favicon.ico',
        tag: `${schedule.id}-done`,
      });
    }, schedule.duration * 60 * 1000);
  }
}
