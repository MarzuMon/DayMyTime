import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Promotion {
  id: string;
  title: string;
  description: string;
  target_signups: number;
  reward_days: number;
}

export default function PromotionsBanner() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from('promotions')
      .select('id, title, description, target_signups, reward_days')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setPromos(data);
      });
  }, []);

  if (promos.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-3">
            <Gift className="h-3.5 w-3.5" />
            Active Promotions
          </span>
          <h2 className="font-display text-2xl font-bold">Earn Free Pro Access</h2>
          <p className="text-muted-foreground mt-1">Refer friends and unlock premium features for free.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {promos.map((promo, i) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-xl border-2 border-primary/20 bg-card p-5 shadow-card hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => navigate('/auth')}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Gift className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-sm truncate">{promo.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{promo.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                        {promo.target_signups} referrals
                      </span>
                      <span className="text-primary font-semibold">
                        {promo.reward_days} days Pro free
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
