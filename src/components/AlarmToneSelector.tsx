import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Volume2, Play, Square } from 'lucide-react';
import { playAlarmTone, stopAlarmTone } from '@/lib/alarmTones';
import WaveformAnimation from '@/components/WaveformAnimation';
import type { AlarmTone } from '@/lib/types';

const ALARM_TONES = [
  { value: 'default', label: '🔔 Default' },
  { value: 'chime', label: '🎵 Chime' },
  { value: 'bell', label: '🔕 Bell' },
  { value: 'alarm', label: '⏰ Alarm' },
  { value: 'gentle', label: '🌊 Gentle' },
  { value: 'urgent', label: '🚨 Urgent' },
  { value: 'melody', label: '🎶 Melody' },
  { value: 'digital', label: '💻 Digital' },
  { value: 'nature', label: '🌿 Nature' },
  { value: 'piano', label: '🎹 Piano' },
  { value: 'none', label: '🔇 Silent' },
];

interface AlarmToneSelectorProps {
  value: AlarmTone;
  onChange: (tone: AlarmTone) => void;
  showLabel?: boolean;
}

export default function AlarmToneSelector({ value, onChange, showLabel = true }: AlarmToneSelectorProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePreview = () => {
    if (isPlaying) {
      stopAlarmTone();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playAlarmTone(value);
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  const handleChange = (v: string) => {
    onChange(v as AlarmTone);
    stopAlarmTone();
    setIsPlaying(true);
    playAlarmTone(v);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" /> Alarm Tone
        </Label>
      )}
      <div className="flex gap-2">
        <Select value={value} onValueChange={handleChange}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALARM_TONES.map(tone => (
              <SelectItem key={tone.value} value={tone.value}>
                {tone.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="icon" variant="outline" onClick={handlePreview} title={isPlaying ? 'Stop' : 'Preview tone'}>
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      <WaveformAnimation isPlaying={isPlaying} tone={value} />
    </div>
  );
}
