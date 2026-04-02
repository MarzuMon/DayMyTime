import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

interface Entry {
  name: string;
  count: number;
}

export default function ReferralLeaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: codes } = await supabase
        .from('referral_codes')
        .select('id, user_id');
      if (!codes?.length) { setLoading(false); return; }

      const { data: signups } = await supabase
        .from('referral_signups')
        .select('referral_code_id');

      const countMap = new Map<string, number>();
      signups?.forEach(s => {
        countMap.set(s.referral_code_id, (countMap.get(s.referral_code_id) || 0) + 1);
      });

      // Build per-user counts
      const userCounts = new Map<string, number>();
      codes.forEach(c => {
        const prev = userCounts.get(c.user_id) || 0;
        userCounts.set(c.user_id, prev + (countMap.get(c.id) || 0));
      });

      // Only users with >0 referrals
      const userIds = [...userCounts.entries()].filter(([, c]) => c > 0).map(([id]) => id);
      if (!userIds.length) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const nameMap = new Map(profiles?.map(p => [p.id, p.display_name || 'User']) || []);

      const board: Entry[] = userIds
        .map(id => ({ name: nameMap.get(id) || 'User', count: userCounts.get(id)! }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setEntries(board);
      setLoading(false);
    })();
  }, []);

  const getIcon = (i: number) => {
    if (i === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (i === 1) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (i === 2) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="w-4 text-center text-[10px] font-bold text-muted-foreground">#{i + 1}</span>;
  };

  if (loading || !entries.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" /> Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {entries.map((e, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${i < 3 ? 'bg-primary/5 border border-primary/10' : 'bg-secondary'}`}
            >
              {getIcon(i)}
              <span className="flex-1 truncate font-medium">{e.name}</span>
              <span className="font-bold tabular-nums">{e.count}</span>
              <span className="text-xs text-muted-foreground">referrals</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
