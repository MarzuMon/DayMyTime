import { useState, useEffect } from 'react';
import { Schedule, ScheduleCategory, detectMeetingPlatform, RepeatType, AlarmTone } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { categoryConfig } from '@/lib/types';
import { Clock, Link as LinkIcon, Tag, Type, AlignLeft, RotateCcw, LayoutTemplate, ImagePlus, X, Users } from 'lucide-react';
import { useAdminSetting } from '@/hooks/use-admin-settings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AlarmToneSelector from '@/components/AlarmToneSelector';
import { Checkbox } from '@/components/ui/checkbox';

interface GlobalTemplate {
  id: string;
  name: string;
  category: string;
  duration: number;
  description: string;
}

interface ScheduleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (schedule: Schedule) => void;
  editSchedule?: Schedule | null;
}

function getPublicUrl(path: string) {
  return supabase.storage.from('schedule-images').getPublicUrl(path).data.publicUrl;
}

export default function ScheduleForm({ open, onOpenChange, onSave, editSchedule }: ScheduleFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(editSchedule?.title ?? '');
  const [description, setDescription] = useState(editSchedule?.description ?? '');
  const formatLocalDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [scheduledTime, setScheduledTime] = useState(
    editSchedule?.scheduledTime
      ? formatLocalDateTime(editSchedule.scheduledTime)
      : ''
  );
  const [duration, setDuration] = useState(editSchedule?.duration?.toString() ?? '30');
  const [meetingLink, setMeetingLink] = useState(editSchedule?.meetingLink ?? '');
  const [category, setCategory] = useState<ScheduleCategory>(editSchedule?.category ?? 'meeting');
  const [repeatType, setRepeatType] = useState<RepeatType>(editSchedule?.repeatType ?? 'none');
  const [alarmTone, setAlarmTone] = useState<AlarmTone>(editSchedule?.alarmTone ?? 'default');
  const [defaultToneLoaded, setDefaultToneLoaded] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editSchedule?.imagePath ? getPublicUrl(editSchedule.imagePath) : null);
  const [uploading, setUploading] = useState(false);
  const [teamId, setTeamId] = useState<string>(editSchedule?.teamId ?? '');
  const [repeatDays, setRepeatDays] = useState<number[]>(editSchedule?.repeatDays ?? []);
  const [userTeams, setUserTeams] = useState<{ id: string; name: string }[]>([]);

  // Fetch user's teams
  useEffect(() => {
    if (!user) return;
    const fetchTeams = async () => {
      const { data: ownedTeams } = await supabase.from('teams').select('id, name').eq('owner_id', user.id);
      const { data: memberTeams } = await supabase.from('team_members').select('team_id, teams(id, name)').eq('user_id', user.id);
      const teams: { id: string; name: string }[] = [...(ownedTeams || [])];
      memberTeams?.forEach((m: any) => {
        if (m.teams && !teams.find(t => t.id === m.teams.id)) {
          teams.push({ id: m.teams.id, name: m.teams.name });
        }
      });
      setUserTeams(teams);
    };
    fetchTeams();
  }, [user]);

  const { value: globalTemplates, loading: templatesLoading } = useAdminSetting<GlobalTemplate[]>('global_templates', []);

  // Load user's default alarm tone for new schedules
  useEffect(() => {
    if (!open || editSchedule || defaultToneLoaded || !user) return;
    supabase.from('profiles').select('default_alarm_tone').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.default_alarm_tone) {
          setAlarmTone(data.default_alarm_tone as AlarmTone);
        }
        setDefaultToneLoaded(true);
      });
  }, [open, editSchedule, user, defaultToneLoaded]);

  // Reset form when editSchedule changes
  useEffect(() => {
    if (open) {
      setTitle(editSchedule?.title ?? '');
      setDescription(editSchedule?.description ?? '');
      setScheduledTime(
        editSchedule?.scheduledTime
          ? formatLocalDateTime(editSchedule.scheduledTime)
          : ''
      );
      setDuration(editSchedule?.duration?.toString() ?? '30');
      setMeetingLink(editSchedule?.meetingLink ?? '');
      setCategory(editSchedule?.category ?? 'meeting');
      setRepeatType(editSchedule?.repeatType ?? 'none');
      if (editSchedule) {
        setAlarmTone(editSchedule.alarmTone ?? 'default');
        setImagePreview(editSchedule.imagePath ? getPublicUrl(editSchedule.imagePath) : null);
      } else {
        setDefaultToneLoaded(false);
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [open, editSchedule]);

  const applyTemplate = (templateId: string) => {
    const t = globalTemplates.find(t => t.id === templateId);
    if (!t) return;
    setTitle(t.name);
    setDescription(t.description);
    setDuration(t.duration.toString());
    setCategory((t.category as ScheduleCategory) || 'other');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledTime || !user) return;

    setUploading(true);
    let imagePath = editSchedule?.imagePath || undefined;

    // Upload new image if selected
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('schedule-images').upload(filePath, imageFile);
      if (!error) {
        imagePath = filePath;
      }
    } else if (!imagePreview && editSchedule?.imagePath) {
      // Image was removed
      imagePath = undefined;
    }

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
      alarmTone,
      imagePath,
      isCompleted: editSchedule?.isCompleted ?? false,
      createdAt: editSchedule?.createdAt ?? new Date().toISOString(),
    };

    setUploading(false);
    onSave(schedule);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editSchedule ? 'Edit Schedule' : 'New Schedule'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selector */}
          {!editSchedule && !templatesLoading && globalTemplates.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" /> Use Template
              </Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {globalTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" /> Image (optional)
            </Label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded-lg border object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
            )}
          </div>

          {/* Alarm Tone with Waveform */}
          <AlarmToneSelector value={alarmTone} onChange={setAlarmTone} />

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={uploading}>
              {uploading ? 'Uploading...' : editSchedule ? 'Update' : 'Add Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
