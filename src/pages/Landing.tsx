import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Bell, Video, Zap, Shield, Moon, Sun, Check, X, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import SEOHead from '@/components/SEOHead';

const PromotionsBanner = lazy(() => import('@/components/PromotionsBanner'));

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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
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
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="DayMyTime – Smart Visual Scheduler | Plan Smart. Live Better."
        description="Schedule tasks, get smart alerts, and join Zoom, Meet or Teams meetings with one tap. Free visual scheduler for students and professionals."
        canonical="https://daymytime.com/"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-40" role="navigation" aria-label="Main navigation">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/images/daymytime-logo.png"
              alt="DayMyTime – Smart Visual Scheduler"
              className="h-9 hidden sm:block"
              width="160"
              height="36"
            />
            <span className="font-display font-bold text-lg sm:hidden">DayMyTime</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button size="sm" onClick={() => navigate('/app')}>
              <span className="hidden sm:inline">Open App</span>
              <span className="sm:hidden">App</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden" aria-label="Hero">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <motion.div
          className="relative max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.span
            variants={fadeUp} custom={0}
            className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 tracking-wide uppercase"
          >
            Smart Visual Scheduler
          </motion.span>
          <motion.h1
            variants={fadeUp} custom={1}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4"
          >
            Your meetings,<br />
            <span className="text-primary">perfectly timed.</span>
          </motion.h1>
          <motion.p
            variants={fadeUp} custom={2}
            className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8"
          >
            Schedule tasks, get smart alerts, and join meetings with one tap. Simple, fast, and meeting-ready.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto">
              Get Started — Free <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto">
              See Plans
            </Button>
          </motion.div>
          {/* Social proof */}
          <motion.div variants={fadeUp} custom={4} className="mt-8 flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-warning text-warning" />
              ))}
            </div>
            <span className="ml-2">Trusted by students & professionals</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20" aria-label="Features">
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="font-display text-2xl font-bold text-center mb-12"
        >
          Everything you need
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={stagger}
        >
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title} variants={fadeUp} custom={i}
              className="rounded-xl border bg-card p-5 sm:p-6 shadow-card hover:shadow-elevated transition-shadow"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Promotions Banner */}
      <Suspense fallback={null}>
        <PromotionsBanner />
      </Suspense>

      {/* Pricing */}
      <section id="pricing" className="bg-secondary/30 py-16 sm:py-20" aria-label="Pricing">
        <div className="max-w-3xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="font-display text-2xl font-bold text-center mb-2"
          >
            Simple pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="text-center text-muted-foreground mb-10"
          >
            Start free. Upgrade when you need more.
          </motion.p>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            {/* Free Card */}
            <motion.div variants={fadeUp} custom={0} className="rounded-xl border bg-card p-6 shadow-card">
              <h3 className="font-display font-bold text-lg mb-1">Free</h3>
              <p className="text-3xl font-bold mb-1">₹0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Ad-supported</p>
              <Button className="w-full" variant="outline" onClick={() => navigate('/auth')}>Get Started</Button>
            </motion.div>
            {/* Pro Card */}
            <motion.div variants={fadeUp} custom={1} className="rounded-xl border-2 border-primary bg-card p-6 shadow-elevated relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">Popular</span>
              <h3 className="font-display font-bold text-lg mb-1">Pro</h3>
              <p className="text-3xl font-bold mb-1">₹199<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Everything unlimited</p>
              <Button className="w-full" onClick={() => navigate('/auth')}>Start Free Trial</Button>
            </motion.div>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl border bg-card overflow-hidden shadow-card"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left p-3 font-display font-semibold">Feature</th>
                    <th className="p-3 font-display font-semibold text-center w-20 sm:w-24">Free</th>
                    <th className="p-3 font-display font-semibold text-center w-20 sm:w-24">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingRows.map(({ feature, free, pro }) => (
                    <tr key={feature} className="border-b last:border-0">
                      <td className="p-3 text-muted-foreground">{feature}</td>
                      <td className="p-3 text-center">
                        {free === true ? <Check className="h-4 w-4 text-primary mx-auto" aria-label="Included" /> :
                         free === false ? <X className="h-4 w-4 text-muted-foreground/40 mx-auto" aria-label="Not included" /> :
                         <span className="text-xs">{free}</span>}
                      </td>
                      <td className="p-3 text-center">
                        {pro === true ? <Check className="h-4 w-4 text-primary mx-auto" aria-label="Included" /> :
                         pro === false ? <X className="h-4 w-4 text-muted-foreground/40 mx-auto" aria-label="Not included" /> :
                         <span className="text-xs">{pro}</span>}
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
      <section className="py-16 sm:py-20 text-center px-4" aria-label="Call to action">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">Ready to take control of your time?</h2>
          <p className="text-muted-foreground mb-6">Join thousands of users who plan smarter every day.</p>
          <Button size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto">
            Get Started for Free <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" role="contentinfo">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 DayMyTime</span>
          <nav className="flex items-center gap-4 flex-wrap justify-center" aria-label="Footer navigation">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="/contact" className="hover:text-primary transition-colors">Contact Us</a>
            <a href="mailto:ceo@daymytime.com" className="hover:text-primary transition-colors">ceo@daymytime.com</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
