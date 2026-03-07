import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Login() {
  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const redirectTo = searchParams.get('redirect');

  const trackReferral = async (userId) => {
    if (!refCode) return;
    try {
      const { data } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', refCode)
        .maybeSingle();
      if (data) {
        await supabase.from('referral_signups').insert({
          referral_code_id: data.id,
          referred_user_id: userId,
        });
      }
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (mode === 'forgot') {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setResetSent(true);
        toast({ title: 'Check your email', description: 'Password reset link sent.' });
      }
      setLoading(false);
      return;
    }

    if (!password.trim()) return;
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      } else {
        const storedRef = localStorage.getItem('dmt_ref');
        if (storedRef) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) { await trackReferral(user.id); localStorage.removeItem('dmt_ref'); }
        }
        navigate(redirectTo || '/dashboard');
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

  const title = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password';
  const subtitle = mode === 'login'
    ? 'Sign in to manage your schedules'
    : mode === 'signup'
    ? 'Start organizing your day'
    : 'Enter your email to receive a reset link';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary/5 items-center justify-center">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center px-12 max-w-md"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            Smart scheduling
          </div>
          <h2 className="text-4xl font-display font-bold text-foreground mb-4 leading-tight">
            Your time,<br />beautifully organized
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Schedules, alarms, team sync&nbsp;— everything in one place. Plan smarter, not harder.
          </p>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          key={mode}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-2 mb-10">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">DayMyTime</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 custom={1} variants={fadeUp} className="text-2xl font-display font-bold text-foreground mb-1">
            {title}
          </motion.h1>
          <motion.p custom={2} variants={fadeUp} className="text-sm text-muted-foreground mb-8">
            {subtitle}
          </motion.p>

          {/* Forgot — success state */}
          {mode === 'forgot' && resetSent ? (
            <motion.div custom={3} variants={fadeUp} className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
              <Mail className="mx-auto h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">Reset link sent to <strong className="text-foreground">{email}</strong></p>
              <button onClick={() => { setMode('login'); setResetSent(false); }} className="text-sm text-primary font-medium hover:underline">
                Back to sign in
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display name */}
              {mode === 'signup' && (
                <motion.div custom={3} variants={fadeUp}>
                  <label htmlFor="displayName" className="sr-only">Display name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="displayName"
                      placeholder="Display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      autoComplete="name"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email */}
              <motion.div custom={mode === 'signup' ? 4 : 3} variants={fadeUp}>
                <label htmlFor="email" className="sr-only">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                    autoComplete="email"
                  />
                </div>
              </motion.div>

              {/* Password */}
              {mode !== 'forgot' && (
                <motion.div custom={mode === 'signup' ? 5 : 4} variants={fadeUp}>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-11 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                      minLength={6}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Forgot link */}
              {mode === 'login' && (
                <motion.div custom={5} variants={fadeUp} className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </motion.div>
              )}

              {/* Submit */}
              <motion.div custom={6} variants={fadeUp}>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading
                    ? 'Please wait…'
                    : mode === 'login'
                    ? 'Sign In'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Send Reset Link'}
                </button>
              </motion.div>
            </form>
          )}

          {/* Toggle mode */}
          <motion.p custom={7} variants={fadeUp} className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-primary font-medium hover:underline">Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setResetSent(false); }} className="text-primary font-medium hover:underline">Sign in</button>
              </>
            )}
          </motion.p>

          {/* Back */}
          <motion.div custom={8} variants={fadeUp} className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Back to home
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
