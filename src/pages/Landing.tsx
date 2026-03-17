import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Bell, Video, Moon, Sun, Check, X, ArrowRight, Star, Sparkles, Users, BarChart3, ChevronDown, Play, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { lazy, Suspense, useState } from 'react';
import SEOHead from '@/components/SEOHead';

const PromotionsBanner = lazy(() => import('@/components/PromotionsBanner'));

const features = [
  { icon: CalendarDays, title: 'Visual Scheduler', desc: 'Plan tasks using a beautiful timeline layout. See your entire day at a glance.', color: 'from-primary/20 to-primary/5' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Never miss tasks or meetings. Get notified right when your schedule starts.', color: 'from-accent/20 to-accent/5' },
  { icon: Video, title: 'One-Tap Meeting Join', desc: 'Join Zoom, Google Meet, or Teams instantly from your notification.', color: 'from-meeting-zoom/20 to-meeting-zoom/5' },
  { icon: BarChart3, title: 'Productivity Insights', desc: 'Track how you spend your time with smart analytics and completion rates.', color: 'from-success/20 to-success/5' },
  { icon: Users, title: 'Team Workspaces', desc: 'Collaborate with your team using shared calendars and timetables.', color: 'from-meeting-teams/20 to-meeting-teams/5' },
  { icon: Clock, title: 'Duration Tracking', desc: 'Know exactly how long each task takes and auto-complete when done.', color: 'from-warning/20 to-warning/5' },
];

const howItWorks = [
  { step: '1', title: 'Create your schedule', desc: 'Add title, time, meeting link, and category in seconds.' },
  { step: '2', title: 'Add tasks or meeting links', desc: 'Paste Zoom, Meet, or Teams links — we detect the platform automatically.' },
  { step: '3', title: 'Get alerts & join instantly', desc: 'Receive smart notifications and join meetings with one tap.' },
];

const screenshots = [
  { title: 'Dashboard', desc: 'Your daily overview with stats, schedules, and quick actions.', image: '/images/screenshot-dashboard.jpg' },
  { title: 'Task Planner', desc: 'Create and manage tasks with categories, duration, and repeats.', image: '/images/screenshot-planner.jpg' },
  { title: 'Meeting Alerts', desc: 'Smart notifications with one-tap join for video meetings.', image: '/images/screenshot-alerts.jpg' },
  { title: 'Mobile View', desc: 'Fully responsive design optimized for on-the-go scheduling.', image: '/images/screenshot-mobile.jpg' },
];

const testimonials = [
  { name: 'Priya S.', role: 'Engineering Student', text: 'I never miss my online classes anymore. The one-tap join is a game changer!', rating: 5 },
  { name: 'Rahul M.', role: 'Product Manager', text: 'Finally a scheduler that doesn\'t overcomplicate things. Clean, fast, and just works.', rating: 5 },
  { name: 'Ananya K.', role: 'Freelancer', text: 'The analytics feature helps me understand where my time actually goes.', rating: 5 },
];

const pricingFree = [
  'Visual timetable',
  'Meeting alerts',
  'Basic scheduling',
  'Timeline view',
  'Browser notifications',
  '20 schedules/day',
];

const pricingPro = [
  'Everything in Free',
  'No ads',
  'Advanced alerts',
  'Priority reminders',
  'Smart analytics',
  'Custom alarm tones',
  'Team workspaces',
  'Unlimited schedules',
  'Cloud backup & sync',
  'Future AI scheduling',
];

const faqs = [
  { q: 'Is DayMyTime free to use?', a: 'Yes! The Free plan includes visual scheduling, meeting alerts, and basic task management. Upgrade to Pro for advanced features like analytics, custom tones, and unlimited schedules.' },
  { q: 'How do meeting alerts work?', a: 'When you add a meeting link (Zoom, Google Meet, or Teams), DayMyTime detects the platform automatically. You\'ll get a browser notification with a one-tap "Join Now" button when it\'s time.' },
  { q: 'Can I use DayMyTime on my phone?', a: 'Absolutely! DayMyTime is a fully responsive web app that works beautifully on mobile browsers. You can even install it as a PWA for an app-like experience.' },
  { q: 'What meeting platforms are supported?', a: 'We currently support Google Meet, Zoom, and Microsoft Teams. Just paste your meeting link and we\'ll detect the platform automatically.' },
  { q: 'How does the Pro plan pricing work?', a: 'Pro is $5/month (₹199/month). You can also earn a free month by referring 20 friends! Cancel anytime, no hidden fees.' },
  { q: 'Is my data secure?', a: 'Yes. All data is stored securely with encryption. We use industry-standard authentication and never share your personal information.' },
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
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
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
    { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free" },
    { "@type": "Offer", "price": "5", "priceCurrency": "USD", "name": "Pro Monthly" },
  ],
  "description": "Plan your day visually, get smart alerts, and join meetings instantly with DayMyTime.",
  "url": "https://daymytime.com",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "1200",
    "bestRating": "5"
  }
};

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-1 text-left group"
        aria-expanded={open}
      >
        <span className="font-display font-semibold text-sm sm:text-base pr-4">{q}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground leading-relaxed pb-5 px-1">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setShowScrollTop(latest > 400);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEOHead
        title="DayMyTime – Smart Visual Scheduler | Productivity Tips & Daily Inspiration"
        description="Make every day count with DayMyTime. Discover productivity tips, inspiring history stories, and practical self improvement ideas. Free visual scheduler for students and professionals."
        canonical="https://daymytime.com/"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50" role="navigation" aria-label="Main navigation">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo-icon.png" alt="DayMyTime" className="h-9 w-9 rounded-xl shadow-glow" loading="eager" fetchPriority="high" />
            <span className="font-display font-bold text-lg tracking-tight">DayMyTime</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-muted-foreground hover:text-foreground transition-colors">Features</button>
            <button onClick={() => document.getElementById('screenshots')?.scrollIntoView({ behavior: 'smooth' })} className="text-muted-foreground hover:text-foreground transition-colors">Screenshots</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="rounded-xl">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="hidden sm:flex rounded-xl">Sign In</Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90">
              Start Free <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28" aria-label="Hero">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />

        <motion.div
          className="relative max-w-5xl mx-auto px-4 sm:px-6"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-xs font-semibold text-primary mb-6 tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Smart Visual Scheduler
              </motion.div>

              <motion.h1
                variants={fadeUp} custom={1}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
              >
                Make Every Day{' '}
                <span className="text-gradient">Count</span>
              </motion.h1>

              <motion.p
                variants={fadeUp} custom={2}
                className="text-muted-foreground text-lg sm:text-xl max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed"
              >
                Discover productivity tips, inspiring history stories, and practical ideas to improve your daily life.
                Plan smart. Live better.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                <Button size="lg" onClick={() => navigate('/todaytip')} className="w-full sm:w-auto h-12 px-8 text-base rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                  Explore Today <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/history')} className="w-full sm:w-auto h-12 px-8 text-base rounded-xl glass">
                  <Play className="h-4 w-4 mr-2" /> Read History
                </Button>
              </motion.div>

              {/* Content Section Buttons */}
              <motion.div variants={fadeUp} custom={3.5} className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => navigate('/auth')} className="rounded-xl glass gap-1.5">
                  🚀 Start Free Scheduler
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/about')} className="rounded-xl glass gap-1.5">
                  📖 Learn More
                </Button>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 sm:gap-6">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <span className="text-sm font-medium">4.9/5</span>
                </div>
                <span className="text-sm text-muted-foreground">Trusted by <strong className="text-foreground">10,000+</strong> users</span>
              </motion.div>
            </div>

            {/* Right: Dashboard preview placeholder */}
            <motion.div
              variants={fadeUp} custom={2}
              className="hidden lg:block"
            >
              <div className="relative rounded-2xl border bg-card shadow-elevated overflow-hidden p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                      <CalendarDays className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm">Today's Schedule</div>
                      <div className="text-xs text-muted-foreground">3 tasks • 2 meetings</div>
                    </div>
                  </div>
                  {[
                    { time: '9:00 AM', title: 'Team Standup', tag: 'Google Meet', tagColor: 'bg-meeting-meet/10 text-meeting-meet' },
                    { time: '11:00 AM', title: 'Design Review', tag: 'Zoom', tagColor: 'bg-meeting-zoom/10 text-meeting-zoom' },
                    { time: '2:00 PM', title: 'Sprint Planning', tag: 'Teams', tagColor: 'bg-meeting-teams/10 text-meeting-teams' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors">
                      <div className="text-xs font-mono text-muted-foreground w-16 flex-shrink-0">{item.time}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.title}</div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.tagColor}`}>{item.tag}</span>
                    </div>
                  ))}
                </div>
                {/* Floating decorative glow */}
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
              </div>
            </motion.div>
          </div>
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
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28" aria-label="Features">
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

      {/* Screenshots */}
      <section id="screenshots" className="bg-secondary/30 py-20 sm:py-28" aria-label="Screenshots">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4 uppercase tracking-wider">Screenshots</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">See DayMyTime in action</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">A clean, intuitive interface that makes scheduling effortless.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {screenshots.map(({ title, desc, image }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group rounded-2xl border bg-card overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={image}
                    alt={`${title} screenshot`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28" aria-label="How it works">
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
              className="text-center"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground font-display text-lg font-bold mb-4 shadow-glow">
                {step}
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/30 py-20 sm:py-28" aria-label="Testimonials">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
        </div>
      </section>

      {/* Promotions Banner */}
      <Suspense fallback={null}>
        <PromotionsBanner />
      </Suspense>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28" aria-label="Pricing">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
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
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            {/* Free Card */}
            <motion.div variants={fadeUp} custom={0} className="rounded-2xl border bg-card p-8 shadow-card">
              <h3 className="font-display font-bold text-lg mb-1">Free</h3>
              <p className="text-4xl font-display font-bold mb-1">$0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Perfect to get started</p>
              <ul className="space-y-3 mb-8">
                {pricingFree.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full rounded-xl h-11" variant="outline" onClick={() => navigate('/auth')}>Get Started</Button>
            </motion.div>
            {/* Pro Card */}
            <motion.div variants={fadeUp} custom={1} className="rounded-2xl border-2 border-primary bg-card p-8 shadow-elevated relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
              <span className="inline-block px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold mb-3">Most Popular</span>
              <h3 className="font-display font-bold text-lg mb-1">Pro</h3>
              <p className="text-4xl font-display font-bold mb-1">$5<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Everything unlimited, ad-free</p>
              <ul className="space-y-3 mb-8">
                {pricingPro.slice(0, 8).map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full rounded-xl h-11 gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90" onClick={() => navigate('/auth')}>
                Start Free Trial <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border bg-card overflow-hidden shadow-card max-w-3xl mx-auto"
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

      {/* FAQ */}
      <section id="faq" className="bg-secondary/30 py-20 sm:py-28" aria-label="FAQ">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">FAQ</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Frequently asked questions</h2>
            <p className="text-muted-foreground">Everything you need to know about DayMyTime.</p>
          </motion.div>

          <motion.div
            className="rounded-2xl border bg-card p-6 sm:p-8 shadow-card"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          >
            {faqs.map(faq => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
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
      <footer className="border-t bg-card/50 py-12 sm:py-16" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <img src="/images/logo-icon.png" alt="DayMyTime" className="h-8 w-8 rounded-lg" loading="lazy" width="32" height="32" />
                <span className="font-display font-bold">DayMyTime</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Smart Visual Scheduler with productivity tips, daily inspiration, and history facts for students and professionals.</p>
            </div>
            {/* Product */}
            <div>
              <h4 className="font-display font-semibold text-sm mb-3">Product</h4>
              <nav className="space-y-2 text-sm" aria-label="Product links">
                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="block text-muted-foreground hover:text-foreground transition-colors">Features</button>
                <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="block text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
                <button onClick={() => document.getElementById('screenshots')?.scrollIntoView({ behavior: 'smooth' })} className="block text-muted-foreground hover:text-foreground transition-colors">Screenshots</button>
              </nav>
            </div>
            {/* Content */}
            <div>
              <h4 className="font-display font-semibold text-sm mb-3">Content</h4>
              <nav className="space-y-2 text-sm" aria-label="Content links">
                <a href="/todaytip" className="block text-muted-foreground hover:text-foreground transition-colors">Productivity Tips</a>
                <a href="/history" className="block text-muted-foreground hover:text-foreground transition-colors">This Day in History</a>
                <a href="/about" className="block text-muted-foreground hover:text-foreground transition-colors">About</a>
                <a href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              </nav>
            </div>
            {/* Legal */}
            <div>
              <h4 className="font-display font-semibold text-sm mb-3">Legal</h4>
              <nav className="space-y-2 text-sm" aria-label="Legal links">
                <a href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                <a href="/disclaimer" className="block text-muted-foreground hover:text-foreground transition-colors">Disclaimer</a>
              </nav>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} DayMyTime. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-xl gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
