import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsletterSubscribeProps {
  title?: string;
  description?: string;
  icon?: string;
  variant?: 'accent' | 'primary' | 'default';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterSubscribe({
  title = '📬 Stay updated',
  description = 'Get the latest tips and articles delivered to your inbox.',
  variant = 'default',
}: NewsletterSubscribeProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const variantClasses: Record<string, string> = {
    accent: 'bg-accent/5 border-accent/20',
    primary: 'bg-primary/5 border-primary/20',
    default: 'bg-muted/30 border-border',
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('newsletter_followers')
        .insert({ email: trimmed });

      if (dbError?.code === '23505') {
        toast.info('You\'re already subscribed!');
        setEmail('');
      } else if (dbError) {
        toast.error('Something went wrong. Please try again.');
      } else {
        setSuccess(true);
        setEmail('');
        toast.success('Subscribed successfully!');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <Card className={variantClasses[variant]}>
      <CardContent className="pt-6 pb-5">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-2"
            >
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-display font-bold text-sm">✅ Subscribed successfully!</p>
              <p className="text-xs text-muted-foreground mt-1">You'll receive our latest updates.</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="font-display font-bold mb-1 text-sm sm:text-base">{title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">{description}</p>
              <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
                <div className="flex-1 relative">
                  <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="newsletter-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="your@email.com"
                    className="pl-9"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'newsletter-error' : undefined}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading} className="min-w-[100px]">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
                </Button>
              </form>
              {error && (
                <p id="newsletter-error" className="text-xs text-destructive mt-1.5" role="alert">
                  {error}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                🔒 We respect your privacy. No spam, unsubscribe anytime.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
