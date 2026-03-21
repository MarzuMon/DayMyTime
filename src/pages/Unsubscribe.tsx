import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CalendarDays, MailX, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import SEOHead from '@/components/SEOHead';

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid === true) setStatus('valid');
        else if (data.reason === 'already_unsubscribed') setStatus('already');
        else setStatus('invalid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (data?.success) setStatus('success');
      else if (data?.reason === 'already_unsubscribed') setStatus('already');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead title="Unsubscribe – DayMyTime" description="Manage your email preferences" />
      <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-lg">DayMyTime</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">Verifying your request…</p>
            </>
          )}

          {status === 'valid' && (
            <>
              <MailX className="h-14 w-14 text-muted-foreground mx-auto" />
              <h1 className="font-display text-2xl font-bold">Unsubscribe from emails?</h1>
              <p className="text-muted-foreground">
                You'll stop receiving app emails from DayMyTime. You can always re-subscribe later.
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} variant="destructive" className="w-full max-w-xs mx-auto">
                {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</> : 'Confirm Unsubscribe'}
              </Button>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto" />
              <h1 className="font-display text-2xl font-bold">You've been unsubscribed</h1>
              <p className="text-muted-foreground">You won't receive any more app emails from us.</p>
              <Button variant="outline" onClick={() => navigate('/')}>Go to Homepage</Button>
            </>
          )}

          {status === 'already' && (
            <>
              <CheckCircle className="h-14 w-14 text-muted-foreground mx-auto" />
              <h1 className="font-display text-2xl font-bold">Already unsubscribed</h1>
              <p className="text-muted-foreground">You've already unsubscribed from our emails.</p>
              <Button variant="outline" onClick={() => navigate('/')}>Go to Homepage</Button>
            </>
          )}

          {(status === 'invalid' || status === 'error') && (
            <>
              <AlertCircle className="h-14 w-14 text-destructive mx-auto" />
              <h1 className="font-display text-2xl font-bold">
                {status === 'invalid' ? 'Invalid link' : 'Something went wrong'}
              </h1>
              <p className="text-muted-foreground">
                {status === 'invalid'
                  ? 'This unsubscribe link is invalid or has expired.'
                  : 'Please try again later or contact us.'}
              </p>
              <Button variant="outline" onClick={() => navigate('/')}>Go to Homepage</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
