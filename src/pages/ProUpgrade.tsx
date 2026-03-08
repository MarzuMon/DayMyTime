import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Crown, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SEOHead from '@/components/SEOHead';
import ReferralPromoCard from '@/components/ReferralPromoCard';

const PromotionsBanner = lazy(() => import('@/components/PromotionsBanner'));

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: 199, period: '/month', badge: null, months: 1 },
  { id: 'yearly', label: 'Yearly', price: 1499, period: '/year', badge: 'Save 37%', months: 12 },
];

const PRO_FEATURES = [
  'Create & manage team workspaces',
  'Shared team calendars',
  'Priority notifications',
  'Custom alarm tones',
  'Advanced analytics',
  'No ads experience',
];

export default function ProUpgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('is_pro').eq('id', user.id).single()
      .then(({ data }) => {
        setIsPro(data?.is_pro ?? false);
        setLoading(false);
      });
  }, [user]);

  const handlePayment = async () => {
    if (!user) return;
    setProcessing(true);

    const plan = PLANS.find(p => p.id === selectedPlan)!;

    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { plan: plan.id },
      });

      if (error) throw error;

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: 'INR',
        name: 'DayMyTime Pro',
        description: `${plan.label} Pro Plan`,
        order_id: data.order_id,
        handler: async (response: any) => {
          const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });
          if (verifyError) {
            toast({ title: 'Verification failed', description: verifyError.message, variant: 'destructive' });
          } else {
            setIsPro(true);
            toast({ title: '🎉 Welcome to Pro!', description: 'Your account has been upgraded.' });
          }
        },
        prefill: { email: user.email },
        theme: { color: '#2a9d8f' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({ title: 'Payment failed', description: err.message || 'Please try again.', variant: 'destructive' });
    }
    setProcessing(false);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Upgrade to Pro – DayMyTime"
        description="Unlock unlimited schedules, team workspaces, custom alarm tones, and ad-free experience with DayMyTime Pro."
        canonical="https://daymytime.com/pro"
      />
      <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-40" role="navigation">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate('/app')} aria-label="Back to app">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-display font-bold">Upgrade to Pro</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-10 space-y-8">
        {isPro ? (
          <div className="text-center py-10 space-y-4">
            <Crown className="h-16 w-16 text-accent mx-auto" />
            <h1 className="font-display text-2xl font-bold">You're a Pro member!</h1>
            <p className="text-muted-foreground">Enjoy all premium features.</p>
            <Button variant="outline" onClick={() => navigate('/app')}>Back to App</Button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <Sparkles className="h-10 w-10 text-accent mx-auto" aria-hidden="true" />
              <h1 className="font-display text-2xl font-bold">Unlock Pro Features</h1>
              <p className="text-muted-foreground text-sm">Get the most out of DayMyTime</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PLANS.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  aria-pressed={selectedPlan === plan.id}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === plan.id
                      ? 'border-primary bg-primary/5 shadow-elevated'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                      {plan.badge}
                    </span>
                  )}
                  <p className="font-display font-bold text-lg">₹{plan.price}</p>
                  <p className="text-xs text-muted-foreground">{plan.period}</p>
                  <p className="text-sm font-medium mt-1">{plan.label}</p>
                </button>
              ))}
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-card border">
              <p className="font-display font-semibold text-sm">Everything in Pro:</p>
              {PRO_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <Button size="lg" className="w-full" onClick={handlePayment} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Crown className="h-4 w-4 mr-2" />}
              Pay ₹{PLANS.find(p => p.id === selectedPlan)!.price} & Upgrade
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Auto-renews. Cancel anytime. Reverts to free if not renewed.
            </p>

            <Suspense fallback={null}>
              <PromotionsBanner />
            </Suspense>
          </>
        )}
      </main>
    </div>
  );
}
