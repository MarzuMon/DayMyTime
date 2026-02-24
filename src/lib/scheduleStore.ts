import { Schedule } from './types';

const STORAGE_KEY = 'timewise_schedules';

export function getSchedules(): Schedule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSchedules(schedules: Schedule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

export function addSchedule(schedule: Schedule) {
  const schedules = getSchedules();
  schedules.push(schedule);
  saveSchedules(schedules);
  return schedules;
}

export function updateSchedule(updated: Schedule) {
  const schedules = getSchedules().map(s => s.id === updated.id ? updated : s);
  saveSchedules(schedules);
  return schedules;
}

export function deleteSchedule(id: string) {
  const schedules = getSchedules().filter(s => s.id !== id);
  saveSchedules(schedules);
  return schedules;
}

export function toggleComplete(id: string) {
  const schedules = getSchedules().map(s =>
    s.id === id ? { ...s, isCompleted: !s.isCompleted } : s
  );
  saveSchedules(schedules);
  return schedules;
}
