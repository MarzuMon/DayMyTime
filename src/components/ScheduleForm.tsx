import { useState } from 'react';
import { Schedule, ScheduleCategory, detectMeetingPlatform, RepeatType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { categoryConfig } from '@/lib/types';
import { Clock, Link as LinkIcon, Tag, Type, AlignLeft, RotateCcw } from 'lucide-react';

interface ScheduleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (schedule: Schedule) => void;
  editSchedule?: Schedule | null;
}

export default function ScheduleForm({ open, onOpenChange, onSave, editSchedule }: ScheduleFormProps) {
  const [title, setTitle] = useState(editSchedule?.title ?? '');
  const [description, setDescription] = useState(editSchedule?.description ?? '');
  const [scheduledTime, setScheduledTime] = useState(
    editSchedule?.scheduledTime
      ? new Date(editSchedule.scheduledTime).toISOString().slice(0, 16)
      : ''
  );
  const [duration, setDuration] = useState(editSchedule?.duration?.toString() ?? '30');
  const [meetingLink, setMeetingLink] = useState(editSchedule?.meetingLink ?? '');
  const [category, setCategory] = useState<ScheduleCategory>(editSchedule?.category ?? 'meeting');
  const [repeatType, setRepeatType] = useState<RepeatType>(editSchedule?.repeatType ?? 'none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledTime) return;

    const schedule: Schedule = {
      id: editSchedule?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      scheduledTime: new Date(scheduledTime).toISOString(),
      duration: parseInt(duration) || 30,
      meetingLink: meetingLink.trim() || undefined,
      meetingPlatform: meetingLink.trim() ? detectMeetingPlatform(meetingLink.trim()) : undefined,
      category,
      repeatType,
      isCompleted: editSchedule?.isCompleted ?? false,
      createdAt: editSchedule?.createdAt ?? new Date().toISOString(),
    };

    onSave(schedule);
    onOpenChange(false);
    // Reset
    setTitle('');
    setDescription('');
    setScheduledTime('');
    setDuration('30');
    setMeetingLink('');
    setCategory('meeting');
    setRepeatType('none');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editSchedule ? 'Edit Schedule' : 'New Schedule'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
              <Type className="h-3.5 w-3.5 text-muted-foreground" /> Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Math Class, Team Standup..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
              <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" /> Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Date & Time
              </Label>
              <Input
                id="time"
                type="datetime-local"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Duration (min)
              </Label>
              <Input
                id="duration"
                type="number"
                min="5"
                max="480"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingLink" className="flex items-center gap-2 text-sm font-medium">
              <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" /> Meeting Link
            </Label>
            <Input
              id="meetingLink"
              type="url"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://zoom.us/j/... (optional)"
            />
            {meetingLink && (
              <p className="text-xs text-muted-foreground">
                Detected: {detectMeetingPlatform(meetingLink) === 'other' ? 'Custom link' : detectMeetingPlatform(meetingLink).charAt(0).toUpperCase() + detectMeetingPlatform(meetingLink).slice(1)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Category
              </Label>
              <Select value={category} onValueChange={v => setCategory(v as ScheduleCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, { label, emoji }]) => (
                    <SelectItem key={key} value={key}>
                      {emoji} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /> Repeat
              </Label>
              <Select value={repeatType} onValueChange={v => setRepeatType(v as RepeatType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editSchedule ? 'Update' : 'Add Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
