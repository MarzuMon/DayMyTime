import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Bell, Video, Zap, Shield, Moon, Sun, Check, X, ArrowRight, Star, Sparkles, Users, BarChart3, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import SEOHead from '@/components/SEOHead';

const PromotionsBanner = lazy(() => import('@/components/PromotionsBanner'));

const features = [
  { icon: CalendarDays, title: 'Visual Scheduler', desc: 'See your day as a beautiful timeline or structured list view.', color: 'from-primary/20 to-primary/5' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Get notified right when your schedule starts — never miss a beat.', color: 'from-accent/20 to-accent/5' },
  { icon: Video, title: 'One-Tap Join', desc: 'Launch Zoom, Meet, or Teams directly from your notification.', color: 'from-meeting-zoom/20 to-meeting-zoom/5' },
  { icon: Clock, title: 'Duration Tracking', desc: 'Know exactly how long each task takes and when it ends.', color: 'from-warning/20 to-warning/5' },
  { icon: Users, title: 'Team Workspaces', desc: 'Collaborate with your team using shared calendars and timetables.', color: 'from-meeting-teams/20 to-meeting-teams/5' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Track productivity trends, completion rates and focus hours.', color: 'from-success/20 to-success/5' },
];

const howItWorks = [
  { step: '01', title: 'Create a schedule', desc: 'Add title, time, meeting link, and category in seconds.' },
  { step: '02', title: 'Get smart alerts', desc: 'Receive notifications with actionable buttons when it\'s time.' },
  { step: '03', title: 'Join & complete', desc: 'One tap to join meetings. Auto-track your productivity.' },
];

const testimonials = [
  { name: 'Priya S.', role: 'Engineering Student', text: 'I never miss my online classes anymore. The one-tap join is a game changer!', rating: 5 },
  { name: 'Rahul M.', role: 'Product Manager', text: 'Finally a scheduler that doesn\'t overcomplicate things. Clean, fast, and just works.', rating: 5 },
  { name: 'Ananya K.', role: 'Freelancer', text: 'The analytics feature helps me understand where my time actually goes.', rating: 5 },
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
  { feature: 'Team Workspaces', free: false, pro: true },
  { feature: 'Advanced Repeat Options', free: false, pro: true },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "DayMyTime",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web",
  "offers": [
    { "@type": "Offer", "price": "0", "priceCurrency": "INR", "name": "Free" },
    { "@type": "Offer", "price": "199", "priceCurrency": "INR", "name": "Pro Monthly" },
  ],
  "description": "Smart Visual Scheduler — Schedule tasks, get smart alerts, and join meetings with one tap.",
  "url": "https://daymytime.com",
};

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEOHead
        title="DayMyTime – Smart Visual Scheduler | Plan Smart. Live Better."
        description="Schedule tasks, get smart alerts, and join Zoom, Meet or Teams meetings with one tap. Free visual scheduler for students and professionals."
        canonical="https://daymytime.com/"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50" role="navigation" aria-label="Main navigation">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">DayMyTime</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="rounded-xl">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="hidden sm:flex rounded-xl">Sign In</Button>
            <Button size="sm" onClick={() => navigate('/app')} className="rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90">
              <span className="hidden sm:inline">Open App</span>
              <span className="sm:hidden">App</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28" aria-label="Hero">
        {/* Background effects */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />

        <motion.div
          className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-xs font-semibold text-primary mb-6 tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Visual Scheduler
          </motion.div>

          <motion.h1
            variants={fadeUp} custom={1}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Your meetings,{' '}
            <span className="text-gradient">perfectly timed.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp} custom={2}
            className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Schedule tasks, get smart alerts, and join meetings with one tap.
            Simple, fast, and meeting-ready — for students & professionals.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto h-12 px-8 text-base rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
              Get Started — Free <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto h-12 px-8 text-base rounded-xl glass">
              See Plans
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} custom={4} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <span className="text-sm font-medium">4.9/5 Rating</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <span className="text-sm text-muted-foreground">Trusted by <strong className="text-foreground">10,000+</strong> students & professionals</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="border-y bg-card/50" aria-label="Platform stats">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '500K+', label: 'Schedules Created' },
              { value: '99.9%', label: 'Uptime' },
              { value: '4.9★', label: 'User Rating' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <p className="font-display text-2xl sm:text-3xl font-bold text-gradient">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28" aria-label="Features">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">Features</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Everything you need to stay on track</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Powerful scheduling tools designed for simplicity. No learning curve.</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={stagger}
        >
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title} variants={fadeUp} custom={i}
              className="group rounded-2xl border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-foreground" aria-hidden="true" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/30 py-20 sm:py-28" aria-label="How it works">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4 uppercase tracking-wider">How It Works</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Simple as 1-2-3</h2>
            <p className="text-muted-foreground">Get started in under a minute. No complex setup.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center md:text-left"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground font-display text-lg font-bold mb-4 shadow-glow">
                  {step}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28" aria-label="Testimonials">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">Testimonials</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Loved by thousands</h2>
          <p className="text-muted-foreground">See what our users say about DayMyTime.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl border bg-card p-6 shadow-card"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="font-display font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Promotions Banner */}
      <Suspense fallback={null}>
        <PromotionsBanner />
      </Suspense>

      {/* Pricing */}
      <section id="pricing" className="bg-secondary/30 py-20 sm:py-28" aria-label="Pricing">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">Pricing</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free. Upgrade when you need more power.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            {/* Free Card */}
            <motion.div variants={fadeUp} custom={0} className="rounded-2xl border bg-card p-7 shadow-card">
              <h3 className="font-display font-bold text-lg mb-1">Free</h3>
              <p className="text-4xl font-display font-bold mb-1">₹0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-7">Ad-supported, perfect to get started</p>
              <Button className="w-full rounded-xl h-11" variant="outline" onClick={() => navigate('/auth')}>Get Started</Button>
            </motion.div>
            {/* Pro Card */}
            <motion.div variants={fadeUp} custom={1} className="rounded-2xl border-2 border-primary bg-card p-7 shadow-elevated relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
              <span className="inline-block px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold mb-3">Most Popular</span>
              <h3 className="font-display font-bold text-lg mb-1">Pro</h3>
              <p className="text-4xl font-display font-bold mb-1">₹199<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-7">Everything unlimited, ad-free</p>
              <Button className="w-full rounded-xl h-11 gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90" onClick={() => navigate('/auth')}>
                Start Free Trial <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border bg-card overflow-hidden shadow-card"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left p-4 font-display font-semibold">Feature</th>
                    <th className="p-4 font-display font-semibold text-center w-24">Free</th>
                    <th className="p-4 font-display font-semibold text-center w-24">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingRows.map(({ feature, free, pro }) => (
                    <tr key={feature} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-4 text-muted-foreground">{feature}</td>
                      <td className="p-4 text-center">
                        {free === true ? <Check className="h-4 w-4 text-primary mx-auto" aria-label="Included" /> :
                         free === false ? <X className="h-4 w-4 text-muted-foreground/30 mx-auto" aria-label="Not included" /> :
                         <span className="text-xs font-medium">{free}</span>}
                      </td>
                      <td className="p-4 text-center">
                        {pro === true ? <Check className="h-4 w-4 text-primary mx-auto" aria-label="Included" /> :
                         pro === false ? <X className="h-4 w-4 text-muted-foreground/30 mx-auto" aria-label="Not included" /> :
                         <span className="text-xs font-medium">{pro}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-28 text-center px-4 overflow-hidden" aria-label="Call to action">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Ready to take control of your time?</h2>
            <p className="text-muted-foreground text-lg mb-8">Join thousands of users who plan smarter every day.</p>
            <Button size="lg" onClick={() => navigate('/auth')} className="h-12 px-8 text-base rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90">
              Get Started for Free <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-10" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">DayMyTime</span>
            </div>
            <nav className="flex items-center gap-6 flex-wrap justify-center text-sm" aria-label="Footer navigation">
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <a href="mailto:ceo@daymytime.com" className="text-muted-foreground hover:text-foreground transition-colors">ceo@daymytime.com</a>
            </nav>
          </div>
          <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} DayMyTime. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
