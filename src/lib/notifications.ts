import { Schedule, platformConfig } from "./types";
import { toggleComplete } from "./scheduleStore";
import { playAlarmTone, stopAlarmTone } from "./alarmTones";

let scheduledTimers: Map<string, number> = new Map();
const SNOOZE_MINUTES = 5;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
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
  scheduledTimers.forEach((timer) => clearTimeout(timer));
  scheduledTimers.clear();
}

export function scheduleAllNotifications(schedules: Schedule[], onUpdate?: () => void) {
  cancelAllNotifications();
  schedules.filter((s) => !s.isCompleted).forEach((s) => scheduleNotification(s, onUpdate));
}

function snoozeSchedule(schedule: Schedule, onUpdate?: () => void) {
  const snoozedSchedule: Schedule = {
    ...schedule,
    scheduledTime: new Date(Date.now() + SNOOZE_MINUTES * 60 * 1000).toISOString(),
  };
  scheduleNotification(snoozedSchedule, onUpdate);
}

function showNotification(schedule: Schedule, onUpdate?: () => void) {
  if (Notification.permission !== "granted") return;

  // Play alarm tone
  try {
    playAlarmTone(schedule.alarmTone || "default");
    setTimeout(() => stopAlarmTone(), 10000);
  } catch (e) {
    console.warn("Could not play alarm tone:", e);
  }

  const catEmoji =
    schedule.category === "meeting"
      ? "🤝"
      : schedule.category === "class"
        ? "📚"
        : schedule.category === "work"
          ? "💼"
          : "📌";

  const body = schedule.meetingLink
    ? `${schedule.description || "Starts now"}\n🔗 Click to join | 💤 Close to snooze ${SNOOZE_MINUTES}min`
    : `${schedule.description || "Starts now"}\n💤 Close to snooze ${SNOOZE_MINUTES}min`;

  const notification = new Notification(`${catEmoji} ${schedule.title}`, {
    body,
    icon: "/favicon.png",
    tag: schedule.id,
    requireInteraction: true,
  });

  // Track if user interacted (clicked) — if not, snooze on close
  let userClicked = false;

  notification.onclick = () => {
    userClicked = true;
    stopAlarmTone();
    window.focus();
    if (schedule.meetingLink) {
      window.open(schedule.meetingLink, "_blank");
    }
    notification.close();
  };

  notification.onclose = () => {
    stopAlarmTone();
    // If user dismissed without clicking, snooze automatically
    if (!userClicked) {
      snoozeSchedule(schedule, onUpdate);
    }
  };

  // Duration complete notification
  if (schedule.duration) {
    window.setTimeout(
      () => {
        new Notification(`✅ ${schedule.title} — Duration Complete`, {
          body: `${schedule.duration} minutes have passed`,
          icon: "/favicon.ico",
          tag: `${schedule.id}-done`,
        });
      },
      schedule.duration * 60 * 1000,
    );
  }
}
