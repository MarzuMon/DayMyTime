import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MESSAGES = [
  (n: number) => `🔥 ${n} people joined in the last hour`,
  (n: number) => `🎉 ${n} new members today`,
  (n: number) => `⚡ ${n} users are participating right now`,
];

interface LiveJoinNotificationProps {
  context?: 'giveaway' | 'general';
}

export default function LiveJoinNotification({ context = 'general' }: LiveJoinNotificationProps) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    const delay = (15 + Math.random() * 30) * 1000;

    const timer = setTimeout(async () => {
      shownRef.current = true;

      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);

      const recentJoins = count || 0;

      if (recentJoins > 0) {
        const msgFn = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        setMessage(msgFn(recentJoins));
      } else {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString());

        if (todayCount && todayCount > 0) {
          setMessage(`🎉 ${todayCount} new members today`);
        } else {
          setMessage(context === 'giveaway'
            ? '🎁 Join the giveaway before it ends!'
            : '✨ Join DayMyTime to boost your productivity!'
          );
        }
      }

      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, delay);

    return () => clearTimeout(timer);
  }, [context]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 max-w-xs animate-in slide-in-from-left-4 fade-in duration-300">
      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-md px-4 py-3 shadow-lg">
        <p className="text-xs font-medium">{message}</p>
      </div>
    </div>
  );
}
