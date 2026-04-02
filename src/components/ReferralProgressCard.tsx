import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Check, Users, Trophy, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const TIERS = [
  { count: 1, label: 'Giveaway Entry', icon: '🎟️', color: 'text-muted-foreground' },
  { count: 3, label: 'Bonus Entry (3x chance)', icon: '🎯', color: 'text-primary' },
  { count: 10, label: 'Guaranteed Reward', icon: '🏆', color: 'text-yellow-500' },
  { count: 20, label: '1 Month Free Pro', icon: '👑', color: 'text-primary' },
];

interface ReferralProgressCardProps {
  compact?: boolean;
  showShareButton?: boolean;
}

export default function ReferralProgressCard({ compact = false, showShareButton = true }: ReferralProgressCardProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [signupCount, setSignupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: codes } = await supabase
      .from('referral_codes')
      .select('id, code')
      .eq('user_id', user.id);

    if (codes && codes.length > 0) {
      setCode(codes[0].code);
      const { data: signups } = await supabase
        .from('referral_signups')
        .select('id')
        .eq('referral_code_id', codes[0].id);
      setSignupCount(signups?.length ?? 0);
    } else {
      const newCode = `DMT-${user.id.slice(0, 6).toUpperCase()}`;
      await supabase.from('referral_codes').insert({ user_id: user.id, code: newCode });
      setCode(newCode);
    }
    setLoading(false);
  };

  const referralUrl = `https://daymytime.com/auth?ref=${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('🔗 Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = `🔥 DayMyTime Mega Giveaway! 🎁\n\nWin ₹500 Amazon Voucher! 😍\n\nJoin now & schedule smarter 👇\n${referralUrl}\n\n⏳ Limited time only!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading || !user) return null;

  const nextTier = TIERS.find(t => signupCount < t.count) || TIERS[TIERS.length - 1];
  const progressToNext = nextTier ? Math.min((signupCount / nextTier.count) * 100, 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-primary/20 bg-card ${compact ? 'p-3' : 'p-4'} space-y-3`}
    >
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-sm">Refer & Earn Rewards</h3>
      </div>

      {/* Tier Progress */}
      <div className="space-y-1.5">
        {TIERS.map((tier) => {
          const reached = signupCount >= tier.count;
          return (
            <div key={tier.count} className={`flex items-center gap-2 text-xs ${reached ? 'opacity-100' : 'opacity-50'}`}>
              <span>{tier.icon}</span>
              <span className={`flex-1 ${reached ? 'font-semibold' : ''}`}>{tier.label}</span>
              <span className={`font-mono text-[10px] ${reached ? tier.color + ' font-bold' : 'text-muted-foreground'}`}>
                {reached ? '✅' : `${tier.count} referrals`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {signupCount} referral{signupCount !== 1 ? 's' : ''}</span>
          <span className="font-semibold text-foreground">Next: {nextTier.label}</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        {signupCount > 0 && signupCount < nextTier.count && (
          <p className="text-[11px] text-muted-foreground">
            🔥 {nextTier.count - signupCount} more to unlock <strong>{nextTier.label}</strong>!
          </p>
        )}
      </div>

      {/* Referral Link */}
      <div className="flex gap-2">
        <Input value={referralUrl} readOnly className="text-xs h-8" />
        <Button size="sm" variant="outline" onClick={handleCopy} className="h-8 px-2">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Share Buttons */}
      {showShareButton && (
        <div className="flex gap-2">
          <Button size="sm" onClick={shareWhatsApp} className="flex-1 gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white">
            <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" /> Copy Link
          </Button>
        </div>
      )}
    </motion.div>
  );
}
