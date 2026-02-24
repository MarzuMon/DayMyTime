import { Schedule, categoryConfig } from '@/lib/types';
import { format, isToday, isTomorrow, startOfDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, Video, ExternalLink } from 'lucide-react';

interface TimelineViewProps {
  schedules: Schedule[];
  selectedDate: Date;
  onEdit: (schedule: Schedule) => void;
}

const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 6;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export default function TimelineView({ schedules, selectedDate, onEdit }: TimelineViewProps) {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = startOfDay(addDays(selectedDate, 1));

  const daySchedules = schedules.filter(s => {
    const t = new Date(s.scheduledTime);
    return t >= dayStart && t < dayEnd;
  });

  const dateLabel = isToday(selectedDate) ? 'Today' : isTomorrow(selectedDate) ? 'Tomorrow' : format(selectedDate, 'EEEE, MMM d');

  return (
    <div className="relative">
      <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
        {dateLabel}
      </h3>
      <div className="relative border rounded-lg bg-card overflow-hidden">
        {/* Hour lines */}
        {HOURS.map(hour => (
          <div
            key={hour}
            className="flex items-start border-b border-border/50 last:border-b-0"
            style={{ height: HOUR_HEIGHT }}
          >
            <div className="w-14 flex-shrink-0 text-xs text-muted-foreground py-1 px-2 text-right font-medium">
              {format(new Date(2000, 0, 1, hour), 'h a')}
            </div>
            <div className="flex-1 relative border-l border-border/50" />
          </div>
        ))}

        {/* Schedule blocks */}
        {daySchedules.map(schedule => {
          const time = new Date(schedule.scheduledTime);
          const hours = time.getHours();
          const minutes = time.getMinutes();
          const startOffset = (hours - START_HOUR + minutes / 60) * HOUR_HEIGHT;
          const blockHeight = Math.max((schedule.duration / 60) * HOUR_HEIGHT, 28);
          const cat = categoryConfig[schedule.category];

          // Clamp to visible area
          if (hours < START_HOUR || hours > END_HOUR) return null;

          return (
            <button
              key={schedule.id}
              onClick={() => onEdit(schedule)}
              className={cn(
                'absolute left-16 right-2 rounded-md px-3 py-1.5 text-left transition-all',
                'hover:ring-2 hover:ring-primary/30 cursor-pointer',
                'border shadow-sm',
                schedule.isCompleted
                  ? 'bg-muted/60 border-border opacity-50'
                  : 'bg-primary/10 border-primary/20'
              )}
              style={{
                top: startOffset,
                height: blockHeight,
                minHeight: 28,
              }}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-xs flex-shrink-0">{cat.emoji}</span>
                <span className={cn(
                  'text-sm font-medium truncate',
                  schedule.isCompleted && 'line-through'
                )}>
                  {schedule.title}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-auto">
                  {format(time, 'h:mm a')}
                </span>
              </div>
              {blockHeight > 40 && (
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {schedule.duration}m
                  </span>
                  {schedule.meetingLink && (
                    <span className="flex items-center gap-0.5 text-primary">
                      <Video className="h-3 w-3" />
                      Join
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Current time indicator */}
        {isToday(selectedDate) && <CurrentTimeIndicator />}
      </div>
    </div>
  );
}

function CurrentTimeIndicator() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours < START_HOUR || hours > END_HOUR) return null;

  const top = (hours - START_HOUR + minutes / 60) * HOUR_HEIGHT;

  return (
    <div className="absolute left-14 right-0 flex items-center z-10 pointer-events-none" style={{ top }}>
      <div className="h-2.5 w-2.5 rounded-full bg-destructive -ml-1.5" />
      <div className="flex-1 h-0.5 bg-destructive/60" />
    </div>
  );
}
