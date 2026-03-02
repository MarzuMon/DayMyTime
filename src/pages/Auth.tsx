import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

function ForgotPassword({ email: parentEmail }: { email: string }) {
  const email = parentEmail;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
      toast({ title: 'Check your email', description: 'Password reset link sent.' });
    }
    setLoading(false);
  };

  if (sent) return <p className="text-center text-xs text-muted-foreground mt-3">Reset link sent to {email}</p>;

  return (
    <div className="mt-3 text-center">
      <button
        type="button"
        onClick={handleReset}
        disabled={loading}
        className="text-xs text-primary hover:underline"
      >
        Forgot password?
      </button>
    </div>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  // Track referral after successful signup
  const trackReferral = async (userId: string) => {
    if (!refCode) return;
    try {
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', refCode)
        .maybeSingle();
      if (codeData) {
        await supabase.from('referral_signups').insert({
          referral_code_id: codeData.id,
          referred_user_id: userId,
        });
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      } else {
        // Track referral on first login if ref code was stored
        const storedRef = localStorage.getItem('dmt_ref');
        if (storedRef) {
          const { data: { user: loggedUser } } = await supabase.auth.getUser();
          if (loggedUser) {
            await trackReferral(loggedUser.id);
            localStorage.removeItem('dmt_ref');
          }
        }
        navigate('/app');
      }
    } else {
      // Store ref code for after email confirmation
      if (refCode) localStorage.setItem('dmt_ref', refCode);
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'We sent you a confirmation link.' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            <h1 className="font-display text-2xl font-bold">Day My Time</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-9"
                required={!isLogin}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        {isLogin && (
          <ForgotPassword email={email} />
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <button
          onClick={() => navigate('/')}
          className="block mx-auto mt-4 text-xs text-muted-foreground hover:underline"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}
