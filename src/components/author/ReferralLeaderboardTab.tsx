import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Medal, Users, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  code: string;
  signupCount: number;
  isPro: boolean;
}

export default function ReferralLeaderboardTab() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReferrals, setTotalReferrals] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    // Get all referral codes with their owners
    const { data: codes } = await supabase
      .from('referral_codes')
      .select('id, code, user_id');

    if (!codes || codes.length === 0) {
      setLoading(false);
      return;
    }

    // Get all signups
    const { data: signups } = await supabase
      .from('referral_signups')
      .select('referral_code_id');

    // Get profiles for display names
    const userIds = codes.map(c => c.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, is_pro')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Count signups per code
    const countMap = new Map<string, number>();
    signups?.forEach(s => {
      countMap.set(s.referral_code_id, (countMap.get(s.referral_code_id) || 0) + 1);
    });

    const leaderboard: LeaderboardEntry[] = codes.map(c => {
      const profile = profileMap.get(c.user_id);
      return {
        userId: c.user_id,
        displayName: profile?.display_name || 'Unnamed',
        code: c.code,
        signupCount: countMap.get(c.id) || 0,
        isPro: profile?.is_pro || false,
      };
    }).sort((a, b) => b.signupCount - a.signupCount);

    setEntries(leaderboard);
    setTotalReferrals(signups?.length || 0);
    setLoading(false);
  };

  const getMedal = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-xs text-muted-foreground font-bold">#{index + 1}</span>;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Loading leaderboard...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{entries.length}</p>
              <p className="text-sm text-muted-foreground">Total Referrers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalReferrals}</p>
              <p className="text-sm text-muted-foreground">Total Referral Signups</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{entries.filter(e => e.signupCount >= 20).length}</p>
              <p className="text-sm text-muted-foreground">Earned Free Pro</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Top Referrers</CardTitle>
          <CardDescription>Users ranked by referral signups</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No referral activity yet</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <div key={entry.userId} className={`flex items-center gap-3 p-3 rounded-lg ${i < 3 ? 'bg-primary/5 border border-primary/10' : 'bg-secondary'}`}>
                  {getMedal(i)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.displayName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{entry.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{entry.signupCount}</p>
                    <p className="text-xs text-muted-foreground">signups</p>
                  </div>
                  {entry.signupCount >= 20 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Pro earned</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
