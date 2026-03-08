import { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { CalendarDays, Mail, Lock, User, ArrowLeft, Star, Shield, Zap, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import ReferralPromoCard from '@/components/ReferralPromoCard';

function ForgotPassword({ email: parentEmail }: { email: string }) {
  const email = parentEmail;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    if (!email) {
      toast({ title: 'Enter your email first', variant: 'destructive' });
      return;
    }
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
        className="text-xs text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        Forgot password?
      </button>
    </div>
  );
}

const benefits = [
  { icon: Zap, text: 'Lightning fast scheduling' },
  { icon: Bell, text: 'Smart actionable alerts' },
  { icon: Shield, text: 'Privacy-first, no data leaves your device' },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const redirectTo = searchParams.get('redirect');

  // Redirect authenticated users to /app
  if (!authLoading && user) {
    return <Navigate to={redirectTo || '/app'} replace />;
  }

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
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      } else {
        // If "remember me" is off, mark session as temporary
        if (!rememberMe) {
          sessionStorage.setItem('dmt_session_only', 'true');
        } else {
          sessionStorage.removeItem('dmt_session_only');
        }

        const storedRef = localStorage.getItem('dmt_ref');
        if (storedRef) {
          const { data: { user: loggedUser } } = await supabase.auth.getUser();
          if (loggedUser) {
            await trackReferral(loggedUser.id);
            localStorage.removeItem('dmt_ref');
          }
        }
        navigate(redirectTo || '/app');
      }
    } else {
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
    <div className="min-h-screen bg-background flex">
      <SEOHead
        title={isLogin ? 'Sign In – DayMyTime' : 'Sign Up – DayMyTime'}
        description="Sign in or create a free DayMyTime account to manage your schedules, meetings, and alerts."
        canonical="https://daymytime.com/auth"
      />

      {/* Left branding panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />

        <div className="relative flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-10">
            <img src="/images/logo-icon.png" alt="DayMyTime" className="h-11 w-11 rounded-xl shadow-glow" />
            <span className="font-display font-bold text-2xl">DayMyTime</span>
          </div>

          <h2 className="font-display text-3xl xl:text-4xl font-bold leading-tight mb-4">
            Plan smart.<br />
            <span className="text-gradient">Live better.</span>
          </h2>

          <p className="text-muted-foreground text-lg mb-10 max-w-md leading-relaxed">
            The simplest way to manage your schedules, meetings, and daily tasks.
          </p>

          <div className="space-y-4 mb-12">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Mini testimonial */}
          <div className="rounded-2xl glass p-5 max-w-sm">
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-3">"Finally a scheduler that doesn't overcomplicate things. Clean, fast, and just works."</p>
            <p className="text-xs text-muted-foreground font-medium">— Rahul M., Product Manager</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-3 lg:hidden">
              <img src="/images/logo-icon.png" alt="DayMyTime" className="h-10 w-10 rounded-xl shadow-glow" />
              <h1 className="font-display text-2xl font-bold">DayMyTime</h1>
            </div>
            <h1 className="hidden lg:block font-display text-2xl font-bold mb-1">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-muted-foreground lg:hidden">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </p>
            <p className="hidden lg:block text-sm text-muted-foreground">
              {isLogin ? 'Sign in to continue to your dashboard' : 'Get started with your free account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-xs font-medium">Display name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="displayName"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9 h-11 rounded-xl"
                    required={!isLogin}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer">
                  Remember me
                </Label>
              </div>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90 transition-opacity" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {isLogin && <ForgotPassword email={email} />}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl flex items-center justify-center gap-2.5"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast({ title: 'Google sign-in failed', description: String(error), variant: 'destructive' });
              }
            }}
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl flex items-center justify-center gap-2.5 mt-2.5"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("apple", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast({ title: 'Apple sign-in failed', description: String(error), variant: 'destructive' });
              }
            }}
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </Button>

          <ReferralPromoCard compact />

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {isLogin ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-1.5 mx-auto mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ArrowLeft className="h-3 w-3" /> Back to home
          </button>
        </motion.div>
      </div>
    </div>
  );
}
