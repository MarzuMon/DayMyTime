import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft, Camera, Save, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AlarmToneSelector from '@/components/AlarmToneSelector';
import NotificationPreferences from '@/components/NotificationPreferences';
import SEOHead from '@/components/SEOHead';
import ReferralProgressCard from '@/components/ReferralProgressCard';
import type { AlarmTone } from '@/lib/types';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [defaultAlarmTone, setDefaultAlarmTone] = useState<AlarmTone>('default');
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name, avatar_url, default_alarm_tone, is_pro').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || '');
          setAvatarUrl(data.avatar_url);
          setDefaultAlarmTone((data.default_alarm_tone as AlarmTone) || 'default');
          setIsPro(data.is_pro);
        }
        setLoading(false);
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      console.error('Avatar upload error:', error);
      toast({ title: 'Upload failed', description: 'Could not upload avatar. Please try again.', variant: 'destructive' });
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(publicUrl + '?t=' + Date.now());
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      toast({ title: 'Avatar updated!' });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      default_alarm_tone: defaultAlarmTone,
    }).eq('id', user.id);
    if (error) {
      console.error('Profile save error:', error);
      toast({ title: 'Save failed', description: 'Could not save profile. Please try again.', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!' });
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="My Profile – DayMyTime" description="Manage your DayMyTime profile, avatar, and alarm tone preferences." />
      <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-40" role="navigation">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate('/app')} aria-label="Back to app">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display font-bold">My Profile</span>
          {isPro && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center gap-1">
              <Crown className="h-3 w-3" /> PRO
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-10 space-y-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-secondary border-2 border-primary/20 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="text-3xl font-display font-bold text-primary">
                  {displayName?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-elevated hover:scale-105 transition-transform"
              aria-label="Upload avatar"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} aria-label="Choose avatar file" />
          </div>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="profile-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display Name</Label>
          <Input id="profile-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" autoComplete="name" />
        </div>

        {/* Default Alarm Tone */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Default Alarm Tone</Label>
          <p className="text-xs text-muted-foreground">This tone will be auto-selected for new schedules.</p>
          <AlarmToneSelector value={defaultAlarmTone} onChange={setDefaultAlarmTone} showLabel={false} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>

        {/* Referral Dashboard */}
        <ReferralProgressCard />

        {!isPro && (
          <Button variant="outline" className="w-full" onClick={() => navigate('/pro')}>
            <Crown className="h-4 w-4 mr-2 text-accent" /> Upgrade to Pro
          </Button>
        )}
      </main>
    </div>
  );
}
