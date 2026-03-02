import { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Volume2, Play, Square, Upload, Trash2 } from 'lucide-react';
import { playAlarmTone, stopAlarmTone } from '@/lib/alarmTones';
import WaveformAnimation from '@/components/WaveformAnimation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

interface CustomTone {
  name: string;
  path: string;
  url: string;
}

interface AlarmToneSelectorProps {
  value: AlarmTone;
  onChange: (tone: AlarmTone) => void;
  showLabel?: boolean;
}

export default function AlarmToneSelector({ value, onChange, showLabel = true }: AlarmToneSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [customTones, setCustomTones] = useState<CustomTone[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) loadCustomTones();
  }, [user]);

  const loadCustomTones = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('custom_tones').eq('id', user.id).single();
    if (profile?.custom_tones && Array.isArray(profile.custom_tones)) {
      setCustomTones(profile.custom_tones as unknown as CustomTone[]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('audio/')) {
      toast({ title: 'Invalid file', description: 'Please upload an audio file (MP3, WAV, etc.)', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum 5MB allowed', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('custom-tones').upload(path, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('custom-tones').getPublicUrl(path);
    const toneName = file.name.replace(/\.[^/.]+$/, '').slice(0, 20);
    const newTone: CustomTone = { name: toneName, path, url: urlData.publicUrl };
    const updated = [...customTones, newTone];

    await supabase.from('profiles').update({ custom_tones: updated as any }).eq('id', user.id);
    setCustomTones(updated);
    toast({ title: 'Tone uploaded!', description: toneName });
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteCustom = async (tone: CustomTone) => {
    if (!user) return;
    await supabase.storage.from('custom-tones').remove([tone.path]);
    const updated = customTones.filter(t => t.path !== tone.path);
    await supabase.from('profiles').update({ custom_tones: updated as any }).eq('id', user.id);
    setCustomTones(updated);
    if (value === `custom:${tone.path}`) onChange('default' as AlarmTone);
    toast({ title: 'Tone deleted' });
  };

  const handlePreview = () => {
    if (isPlaying) {
      stopAlarmTone();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (typeof value === 'string' && value.startsWith('custom:')) {
        const customPath = value.replace('custom:', '');
        const tone = customTones.find(t => t.path === customPath);
        if (tone) {
          const audio = new Audio(tone.url);
          audioRef.current = audio;
          audio.play();
          audio.onended = () => setIsPlaying(false);
        }
      } else {
        playAlarmTone(value);
        setTimeout(() => setIsPlaying(false), 2000);
      }
    }
  };

  const handleChange = (v: string) => {
    onChange(v as AlarmTone);
    stopAlarmTone();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    setIsPlaying(true);
    if (v.startsWith('custom:')) {
      const customPath = v.replace('custom:', '');
      const tone = customTones.find(t => t.path === customPath);
      if (tone) {
        const audio = new Audio(tone.url);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setIsPlaying(false);
      }
    } else {
      playAlarmTone(v);
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  const allTones = [
    ...ALARM_TONES,
    ...customTones.map(t => ({ value: `custom:${t.path}`, label: `🎤 ${t.name}` })),
  ];

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
            {allTones.map(tone => (
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

      {/* Upload custom tone */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          {uploading ? 'Uploading...' : 'Upload Custom Tone'}
        </Button>
      </div>

      {/* Custom tones list */}
      {customTones.length > 0 && (
        <div className="space-y-1">
          {customTones.map(tone => (
            <div key={tone.path} className="flex items-center gap-2 text-xs p-1.5 rounded bg-secondary/50">
              <span className="flex-1 truncate">🎤 {tone.name}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-5 w-5 text-destructive"
                onClick={() => handleDeleteCustom(tone)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <WaveformAnimation isPlaying={isPlaying} tone={value} />
    </div>
  );
}
