import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  requestNotificationPermission,
  getNotificationPermission,
} from '@/lib/notifications';

const REMINDER_OPTIONS = [
  { value: '0', label: 'At start time' },
  { value: '5', label: '5 min before' },
  { value: '10', label: '10 min before' },
  { value: '15', label: '15 min before' },
  { value: '30', label: '30 min before' },
];

const SNOOZE_OPTIONS = [
  { value: '3', label: '3 minutes' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
];

const PREFS_KEY = 'dmt_notification_prefs';

interface NotifPrefs {
  enabled: boolean;
  reminderMinutes: string;
  snoozeMinutes: string;
  soundEnabled: boolean;
  volume: number;
  autoSnooze: boolean;
  durationAlert: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  enabled: true,
  reminderMinutes: '0',
  snoozeMinutes: '5',
  soundEnabled: true,
  volume: 70,
  autoSnooze: true,
  durationAlert: true,
};

function loadPrefs(): NotifPrefs {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFS;
}

function savePrefs(prefs: NotifPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function getNotifPrefs(): NotifPrefs {
  return loadPrefs();
}

export default function NotificationPreferences() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const update = (patch: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      update({ enabled: true });
      toast({ title: 'Notifications enabled!' });
    } else {
      toast({ title: 'Permission denied', description: 'Enable notifications in your browser settings.', variant: 'destructive' });
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Permission status */}
        {permission === 'denied' && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            <BellOff className="h-3.5 w-3.5 inline mr-1" />
            Notifications are blocked. Enable them in your browser settings.
          </div>
        )}

        {permission === 'default' && (
          <Button size="sm" variant="outline" onClick={handleEnableNotifications} className="w-full">
            <Bell className="h-3.5 w-3.5 mr-2" />
            Enable Browser Notifications
          </Button>
        )}

        {permission === 'granted' && (
          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
            ✅ Notifications active
          </Badge>
        )}

        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="notif-toggle" className="text-sm flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            Schedule reminders
          </Label>
          <Switch
            id="notif-toggle"
            checked={prefs.enabled}
            onCheckedChange={(v) => update({ enabled: v })}
          />
        </div>

        {/* Reminder timing */}
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Remind me
          </Label>
          <Select value={prefs.reminderMinutes} onValueChange={(v) => update({ reminderMinutes: v })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Snooze duration */}
        <div className="space-y-1.5">
          <Label className="text-sm">Snooze duration</Label>
          <Select value={prefs.snoozeMinutes} onValueChange={(v) => update({ snoozeMinutes: v })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SNOOZE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sound toggle + volume */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-toggle" className="text-sm flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              Alarm sound
            </Label>
            <Switch
              id="sound-toggle"
              checked={prefs.soundEnabled}
              onCheckedChange={(v) => update({ soundEnabled: v })}
            />
          </div>
          {prefs.soundEnabled && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Volume: {prefs.volume}%</Label>
              <Slider
                value={[prefs.volume]}
                onValueChange={([v]) => update({ volume: v })}
                min={10}
                max={100}
                step={10}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Auto-snooze */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-snooze" className="text-sm">
            Auto-snooze on dismiss
          </Label>
          <Switch
            id="auto-snooze"
            checked={prefs.autoSnooze}
            onCheckedChange={(v) => update({ autoSnooze: v })}
          />
        </div>

        {/* Duration complete alert */}
        <div className="flex items-center justify-between">
          <Label htmlFor="duration-alert" className="text-sm">
            Alert when duration ends
          </Label>
          <Switch
            id="duration-alert"
            checked={prefs.durationAlert}
            onCheckedChange={(v) => update({ durationAlert: v })}
          />
        </div>

        <p className="text-[11px] text-muted-foreground pt-1">
          Settings are saved to this device. Alarm tone is set in the section above.
        </p>
      </CardContent>
    </Card>
  );
}
