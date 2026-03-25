import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Users, Star, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Promotion {
  id: string;
  title: string;
  description: string;
  type: string;
  image_url: string | null;
}

const POPUP_KEY = 'promo_popup_last_shown';
const POPUP_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default function PromoPopup({ isPro }: { isPro: boolean }) {
  const [open, setOpen] = useState(false);
  const [promo, setPromo] = useState<Promotion | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isPro) return;

    const lastShown = localStorage.getItem(POPUP_KEY);
    if (lastShown && Date.now() - Number(lastShown) < POPUP_COOLDOWN_MS) return;

    supabase
      .from('promotions')
      .select('id, title, description, type, image_url')
      .eq('is_active', true)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPromo(data[0] as Promotion);
          setTimeout(() => {
            setOpen(true);
            localStorage.setItem(POPUP_KEY, String(Date.now()));
          }, 2000);
        }
      });
  }, [isPro]);

  if (!promo) return null;

  const isReferral = promo.type === 'referral';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl border-0 p-0 overflow-hidden shadow-2xl bg-transparent">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Background with gradient */}
              <div className="relative">
                {/* Decorative top section */}
                <div className="relative bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden">
                  {/* Floating decorative elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary-foreground/10 blur-xl" />
                    <div className="absolute top-12 -left-8 h-20 w-20 rounded-full bg-accent/20 blur-lg" />
                    <div className="absolute bottom-2 right-12 h-16 w-16 rounded-full bg-primary-foreground/5 blur-md" />
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setOpen(false)}
                    className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-primary-foreground/10 backdrop-blur flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-primary-foreground" />
                  </button>

                  {/* Image or Icon */}
                  <div className="relative z-10 px-6 pt-8 pb-6 text-center">
                    {promo.image_url ? (
                      <img src={promo.image_url} alt={promo.title} className="w-full max-h-40 object-cover rounded-xl mb-4 mx-auto" />
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.15, damping: 12 }}
                        className="mx-auto mb-4"
                      >
                        <div className="h-16 w-16 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center mx-auto ring-2 ring-primary-foreground/20 shadow-lg">
                          {isReferral ? (
                            <Gift className="h-8 w-8 text-primary-foreground" />
                          ) : (
                            <Star className="h-8 w-8 text-primary-foreground" />
                          )}
                        </div>
                      </motion.div>
                    )}
                    <h2 className="font-display text-xl font-bold text-primary-foreground tracking-tight">
                      {promo.title}
                    </h2>
                    <p className="text-sm text-primary-foreground/80 mt-2 leading-relaxed max-w-[280px] mx-auto">
                      {promo.description}
                    </p>
                  </div>
                </div>

                {/* Content section */}
                <div className="bg-card px-6 py-5 space-y-4">
                  {/* Feature highlights */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {(isReferral ? [
                      { icon: Users, label: 'Invite 20 friends', color: 'text-primary' },
                      { icon: Gift, label: '1 month free Pro', color: 'text-accent' },
                      { icon: Star, label: 'Unlock all features', color: 'text-primary' },
                      { icon: Zap, label: 'No limits', color: 'text-accent' },
                    ] : [
                      { icon: Zap, label: 'Unlimited schedules', color: 'text-primary' },
                      { icon: Star, label: 'Advanced analytics', color: 'text-accent' },
                      { icon: Gift, label: 'Ad-free experience', color: 'text-primary' },
                      { icon: Users, label: 'Priority support', color: 'text-accent' },
                    ]).map(({ icon: Icon, label, color }, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/50"
                      >
                        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                        <span className="text-xs font-medium text-foreground">{label}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-11 text-sm"
                      onClick={() => setOpen(false)}
                    >
                      Maybe Later
                    </Button>
                    <Button
                      className="flex-1 rounded-xl h-11 text-sm gradient-primary border-0 text-primary-foreground shadow-glow font-semibold"
                      onClick={() => {
                        setOpen(false);
                        navigate(isReferral ? '/profile' : '/pro');
                      }}
                    >
                      {isReferral ? (
                        <><Gift className="h-4 w-4 mr-1.5" /> Share & Earn</>
                      ) : (
                        <><Star className="h-4 w-4 mr-1.5" /> Upgrade Now</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
