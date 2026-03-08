import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, X } from 'lucide-react';

interface Promotion {
  id: string;
  title: string;
  description: string;
  type: string;
}

const POPUP_KEY = 'promo_popup_last_shown';
const POPUP_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function PromoPopup({ isPro }: { isPro: boolean }) {
  const [open, setOpen] = useState(false);
  const [promo, setPromo] = useState<Promotion | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isPro) return;

    // Check cooldown — only show once per 24h
    const lastShown = localStorage.getItem(POPUP_KEY);
    if (lastShown && Date.now() - Number(lastShown) < POPUP_COOLDOWN_MS) return;

    // Fetch active promotion
    supabase
      .from('promotions')
      .select('id, title, description, type')
      .eq('is_active', true)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPromo(data[0] as Promotion);
          // Delay popup by 2 seconds so page loads first
          setTimeout(() => {
            setOpen(true);
            localStorage.setItem(POPUP_KEY, String(Date.now()));
          }, 2000);
        }
      });
  }, [isPro]);

  if (!promo) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md rounded-2xl border-primary/20 p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="gradient-primary p-6 text-center relative">
          <div className="absolute top-3 right-3">
            <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center mx-auto mb-3">
            <Crown className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold text-primary-foreground">{promo.title}</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {promo.description}
          </p>

          <div className="space-y-3 text-xs">
            {[
              'Unlimited schedules & cloud sync',
              'Advanced analytics & daily reports',
              'No ads experience',
              'Priority support',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setOpen(false)}
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1 rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow"
              onClick={() => { setOpen(false); navigate('/pro'); }}
            >
              <Crown className="h-4 w-4 mr-1.5" /> Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
