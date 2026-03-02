import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Check, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReferralSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [signupCount, setSignupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;
    // Get or create referral code
    const { data: codes } = await supabase
      .from('referral_codes')
      .select('id, code')
      .eq('user_id', user.id);

    if (codes && codes.length > 0) {
      setCode(codes[0].code);
      // Count signups
      const { data: signups } = await supabase
        .from('referral_signups')
        .select('id')
        .eq('referral_code_id', codes[0].id);
      setSignupCount(signups?.length ?? 0);
    } else {
      // Generate unique code
      const newCode = `DMT-${user.id.slice(0, 6).toUpperCase()}`;
      await supabase.from('referral_codes').insert({ user_id: user.id, code: newCode });
      setCode(newCode);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/auth?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: '🔗 Link copied!', description: 'Share it with friends to earn free Pro!' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;

  const progress = Math.min((signupCount / 20) * 100, 100);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">Refer & Earn Pro</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Share your referral link. When 20 friends sign up, you get <strong>1 month free Pro</strong>!
      </p>
      <div className="flex gap-2">
        <Input value={`${window.location.origin}/auth?ref=${code}`} readOnly className="text-xs" />
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {signupCount} / 20 signups</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
