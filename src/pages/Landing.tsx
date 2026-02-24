import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Bell, Video, Zap, Shield, Moon, Sun, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

const features = [
  { icon: CalendarDays, title: 'Visual Scheduler', desc: 'See your day as a beautiful timeline or structured list.' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Get notified right when your schedule starts — never miss a beat.' },
  { icon: Video, title: 'One-Tap Join', desc: 'Launch Zoom, Meet, or Teams directly from your notification.' },
  { icon: Clock, title: 'Duration Tracking', desc: 'Know exactly how long each task takes and when it ends.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'No login needed. Works instantly with local storage.' },
  { icon: Shield, title: 'Privacy First', desc: 'All data stays on your device. Nothing leaves your browser.' },
];

const pricingRows = [
  { feature: 'Add / Edit / Delete Schedules', free: true, pro: true },
  { feature: 'Meeting Link Integration', free: true, pro: true },
  { feature: 'Browser Notifications', free: true, pro: true },
  { feature: 'Timeline View', free: true, pro: true },
  { feature: 'Active Schedules', free: '20 / day', pro: 'Unlimited' },
  { feature: 'Themes', free: 'Light only', pro: 'All themes' },
  { feature: 'Ad-Free Experience', free: false, pro: true },
  { feature: 'Smart Analytics', free: false, pro: true },
  { feature: 'Cloud Backup & Sync', free: false, pro: true },
  { feature: 'Custom Alarm Tones', free: false, pro: true },
  { feature: 'Priority Notifications', free: false, pro: true },
  { feature: 'Advanced Repeat Options', free: false, pro: true },
];

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-lg">TimeWise</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button size="sm" onClick={() => navigate('/app')}>Open App</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative max-w-3xl mx-auto px-4 py-24 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 tracking-wide uppercase">
            Smart Visual Scheduler
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            Your meetings,<br />
            <span className="text-primary">perfectly timed.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Schedule tasks, get smart alerts, and join meetings with one tap. Simple, fast, and meeting-ready.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/app')}>
              Get Started — Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              See Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="font-display text-2xl font-bold text-center mb-12">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6 shadow-card hover:shadow-elevated transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-secondary/30 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-center mb-2">Simple pricing</h2>
          <p className="text-center text-muted-foreground mb-10">Start free. Upgrade when you need more.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Free Card */}
            <div className="rounded-xl border bg-card p-6 shadow-card">
              <h3 className="font-display font-bold text-lg mb-1">Free</h3>
              <p className="text-3xl font-bold mb-1">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Ad-supported</p>
              <Button className="w-full" variant="outline" onClick={() => navigate('/app')}>Get Started</Button>
            </div>
            {/* Pro Card */}
            <div className="rounded-xl border-2 border-primary bg-card p-6 shadow-elevated relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">Popular</span>
              <h3 className="font-display font-bold text-lg mb-1">Pro</h3>
              <p className="text-3xl font-bold mb-1">$4.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Everything unlimited</p>
              <Button className="w-full" onClick={() => navigate('/app')}>Start Free Trial</Button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-3 font-display font-semibold">Feature</th>
                  <th className="p-3 font-display font-semibold text-center w-24">Free</th>
                  <th className="p-3 font-display font-semibold text-center w-24">Pro</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map(({ feature, free, pro }) => (
                  <tr key={feature} className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground">{feature}</td>
                    <td className="p-3 text-center">
                      {free === true ? <Check className="h-4 w-4 text-primary mx-auto" /> :
                       free === false ? <X className="h-4 w-4 text-muted-foreground/40 mx-auto" /> :
                       <span className="text-xs">{free}</span>}
                    </td>
                    <td className="p-3 text-center">
                      {pro === true ? <Check className="h-4 w-4 text-primary mx-auto" /> :
                       pro === false ? <X className="h-4 w-4 text-muted-foreground/40 mx-auto" /> :
                       <span className="text-xs">{pro}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 TimeWise</span>
          <span>Simple • Visual • Meeting-ready</span>
        </div>
      </footer>
    </div>
  );
}