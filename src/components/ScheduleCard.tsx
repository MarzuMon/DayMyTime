import { Schedule, categoryConfig, platformConfig } from '@/lib/types';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { Clock, ExternalLink, Check, Trash2, Pencil, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ScheduleCardProps {
  schedule: Schedule;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (schedule: Schedule) => void;
}

export default function ScheduleCard({ schedule, onToggleComplete, onDelete, onEdit }: ScheduleCardProps) {
  const time = new Date(schedule.scheduledTime);
  const past = isPast(time) && !schedule.isCompleted;
  const catConfig = categoryConfig[schedule.category];
  const platform = schedule.meetingPlatform ? platformConfig[schedule.meetingPlatform] : null;

  const dateLabel = isToday(time) ? 'Today' : isTomorrow(time) ? 'Tomorrow' : format(time, 'MMM d');

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card p-4 shadow-card transition-all hover:shadow-elevated animate-slide-up',
        schedule.isCompleted && 'opacity-60',
        past && 'border-destructive/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{catConfig.emoji}</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {catConfig.label}
            </span>
            {past && (
              <span className="text-xs font-medium text-destructive">Overdue</span>
            )}
          </div>

          <h3 className={cn(
            'font-display font-semibold text-base leading-tight',
            schedule.isCompleted && 'line-through'
          )}>
            {schedule.title}
          </h3>

          {schedule.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {schedule.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dateLabel}, {format(time, 'h:mm a')}
            </span>
            <span className="flex items-center gap-1">
              {schedule.duration} min
            </span>
            {schedule.repeatType !== 'none' && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                {schedule.repeatType}
              </span>
            )}
          </div>

          {schedule.meetingLink && platform && (
            <a
              href={schedule.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1.5 mt-3 text-sm font-medium transition-colors hover:underline',
                platform.colorClass
              )}
            >
              <Video className="h-3.5 w-3.5" />
              Join {platform.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onToggleComplete(schedule.id)}
            title={schedule.isCompleted ? 'Mark incomplete' : 'Mark complete'}
          >
            <Check className={cn('h-4 w-4', schedule.isCompleted && 'text-success')} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onEdit(schedule)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{schedule.title}" will be permanently deleted. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete(schedule.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
