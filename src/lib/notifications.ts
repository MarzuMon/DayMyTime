import { Schedule } from "./types";
import { playAlarmTone, stopAlarmTone } from "./alarmTones";
import { getNotifPrefs } from "@/components/NotificationPreferences";

let scheduledTimers: Map<string, number> = new Map();
let preReminderTimers: Map<string, number> = new Map();

function getSnoozeMinutes() {
  return parseInt(getNotifPrefs().snoozeMinutes) || 5;
}

function getPreReminderMinutes() {
  return parseInt(getNotifPrefs().reminderMinutes) || 0;
}

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

export function scheduleNotification(schedule: Schedule, onUpdate?: () => void, isPro?: boolean) {
  cancelNotification(schedule.id);

  const time = new Date(schedule.scheduledTime).getTime();
  const now = Date.now();
  const delay = time - now;

  if (delay <= 0 || schedule.isCompleted) return;

  // Schedule pre-reminder (free users use prefs, Pro users always get it)
  const preMinutes = getPreReminderMinutes();
  const reminderMin = isPro ? Math.max(preMinutes, 10) : preMinutes;
  if (reminderMin > 0) {
    const preDelay = delay - reminderMin * 60 * 1000;
    if (preDelay > 0) {
      const preTimer = window.setTimeout(() => {
        showPreReminder(schedule, reminderMin);
        preReminderTimers.delete(schedule.id);
      }, preDelay);
      preReminderTimers.set(schedule.id, preTimer);
    }
  }

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
  const preTimer = preReminderTimers.get(id);
  if (preTimer) {
    clearTimeout(preTimer);
    preReminderTimers.delete(id);
  }
}

export function cancelAllNotifications() {
  scheduledTimers.forEach((timer) => clearTimeout(timer));
  scheduledTimers.clear();
  preReminderTimers.forEach((timer) => clearTimeout(timer));
  preReminderTimers.clear();
}

export function scheduleAllNotifications(schedules: Schedule[], onUpdate?: () => void, isPro?: boolean) {
  cancelAllNotifications();
  schedules.filter((s) => !s.isCompleted).forEach((s) => scheduleNotification(s, onUpdate, isPro));
}

function showPreReminder(schedule: Schedule, minutes: number) {
  if (Notification.permission !== "granted") return;

  const catEmoji =
    schedule.category === "meeting" ? "🤝"
      : schedule.category === "class" ? "📚"
        : schedule.category === "work" ? "💼"
          : "📌";

  const body = schedule.meetingLink
    ? `Starting in ${minutes} minutes\n🔗 ${schedule.description || "Get ready!"}`
    : `Starting in ${minutes} minutes\n${schedule.description || "Get ready!"}`;

  const notification = new Notification(`⏰ ${catEmoji} ${schedule.title} — Soon!`, {
    body,
    icon: "/favicon.ico",
    tag: `${schedule.id}-pre`,
  });

  notification.onclick = () => {
    window.focus();
    if (schedule.meetingLink) {
      window.open(schedule.meetingLink, "_blank");
    }
    notification.close();
  };
}

function snoozeSchedule(schedule: Schedule, onUpdate?: () => void) {
  const snoozeMin = getSnoozeMinutes();
  const snoozedSchedule: Schedule = {
    ...schedule,
    scheduledTime: new Date(Date.now() + snoozeMin * 60 * 1000).toISOString(),
  };
  scheduleNotification(snoozedSchedule, onUpdate);
}

function showNotification(schedule: Schedule, onUpdate?: () => void) {
  if (Notification.permission !== "granted") return;

  const prefs = getNotifPrefs();
  const snoozeMin = getSnoozeMinutes();

  // Play alarm tone based on prefs
  if (prefs.soundEnabled) {
    try {
      playAlarmTone(schedule.alarmTone || "default");
      setTimeout(() => stopAlarmTone(), 10000);
    } catch (e) {
      console.warn("Could not play alarm tone:", e);
    }
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
    ? `${schedule.description || "Starts now"}\n🔗 Click to join | 💤 Close to snooze ${snoozeMin}min`
    : `${schedule.description || "Starts now"}\n💤 Close to snooze ${snoozeMin}min`;

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
