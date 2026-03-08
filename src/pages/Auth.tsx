import { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { CalendarDays, Mail, Lock, User, ArrowLeft, Star, Shield, Zap, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';

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
            <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <CalendarDays className="h-6 w-6 text-primary-foreground" />
            </div>
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
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <CalendarDays className="h-5 w-5 text-primary-foreground" />
              </div>
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

          <p className="text-center text-sm text-muted-foreground">
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
