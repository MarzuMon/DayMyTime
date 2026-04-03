import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Bell, Video, Moon, Sun, Check, X, ArrowRight, Star, Sparkles, Users, BarChart3, ChevronDown, Play, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import { generateFaqJsonLd, generateWebsiteJsonLd } from '@/lib/seo-utils';

const NewsletterSubscribe = lazy(() => import('@/components/NewsletterSubscribe'));
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
  { title: 'Dashboard', desc: 'Your daily overview with stats, schedules, and quick actions.', image: '/images/screenshot-dashboard.webp' },
  { title: 'Task Planner', desc: 'Create and manage tasks with categories, duration, and repeats.', image: '/images/screenshot-planner.webp' },
  { title: 'Meeting Alerts', desc: 'Smart notifications with one-tap join for video meetings.', image: '/images/screenshot-alerts.webp' },
  { title: 'Mobile View', desc: 'Fully responsive design optimized for on-the-go scheduling.', image: '/images/screenshot-mobile.webp' },
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
  "description": "Make every day count with DayMyTime. Discover productivity tips, inspiring history stories, and practical self improvement ideas. Free visual scheduler.",
  "url": "https://daymytime.com",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "1200",
    "bestRating": "5"
  },
  "sameAs": [
    "https://twitter.com/daymytime"
  ]
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
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-sm text-muted-foreground leading-relaxed pb-5 px-1">{a}</p>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEOHead
        title="DayMyTime – Smart Visual Scheduler | Productivity Tips & Daily Inspiration"
        description="Make every day count with DayMyTime. Discover productivity tips, inspiring history stories, and practical self improvement ideas. Free visual scheduler for students and professionals."
        canonical="https://daymytime.com/"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebsiteJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFaqJsonLd(faqs)) }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50" role="navigation" aria-label="Main navigation">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo-icon.webp" alt="DayMyTime" className="h-9 w-9 rounded-xl shadow-glow" width="36" height="36" fetchPriority="high" />
            <span className="font-display font-bold text-lg tracking-tight">DayMyTime</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-muted-foreground hover:text-foreground transition-colors">Features</button>
            <button onClick={() => document.getElementById('screenshots')?.scrollIntoView({ behavior: 'smooth' })} className="text-muted-foreground hover:text-foreground transition-colors">Screenshots</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
            <button onClick={() => navigate('/giveaway')} className="text-primary font-semibold hover:text-primary/80 transition-colors">🎁 Giveaway</button>
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

      {/* Hero — CSS animations only, no framer-motion */}
      <section className="relative pt-24 pb-14 sm:pt-40 sm:pb-28" aria-label="Hero">
        <div className="absolute inset-0 gradient-hero" aria-hidden="true" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl will-change-auto hidden sm:block" aria-hidden="true" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl will-change-auto hidden sm:block" aria-hidden="true" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-xs font-semibold text-primary mb-4 sm:mb-6 tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Smart Visual Scheduler
              </div>

              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4 sm:mb-6">
                Make Every Day{' '}
                <span className="text-gradient">Count</span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-xl max-w-lg mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed">
                Productivity tips, history stories & smart scheduling. Plan smart. Live better.
              </p>

              <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 delay-150 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                <Button size="lg" onClick={() => navigate('/todaytip')} className="w-full sm:w-auto h-12 px-8 text-base rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                  Explore Today <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/history')} className="w-full sm:w-auto h-12 px-8 text-base rounded-xl glass">
                  <Play className="h-4 w-4 mr-2" /> Read History
                </Button>
              </div>

              {/* Content Section Buttons — hidden on mobile to reduce above-fold weight */}
              <div className="hidden sm:flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => navigate('/auth')} className="rounded-xl glass gap-1.5">
                  🚀 Start Free Scheduler
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/about')} className="rounded-xl glass gap-1.5">
                  📖 Learn More
                </Button>
                <Button size="sm" onClick={() => navigate('/giveaway')} className="rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90 gap-1.5">
                  🎁 Join Giveaway
                </Button>
              </div>

              {/* Social proof */}
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 delay-300 mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 sm:gap-6">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <span className="text-sm font-medium">4.9/5</span>
                </div>
                <span className="text-sm text-muted-foreground">Trusted by <strong className="text-foreground">10,000+</strong> users</span>
              </div>
            </div>

            {/* Right: Dashboard preview placeholder — hidden on mobile */}
            <div className="hidden lg:block animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
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
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
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
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl sm:text-3xl font-bold text-gradient">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28" aria-label="Features">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">Features</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Everything you need to stay on track</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Powerful scheduling tools designed for simplicity. No learning curve.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <div
              key={title}
              className="group rounded-2xl border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-foreground" aria-hidden="true" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section id="screenshots" className="bg-secondary/30 py-20 sm:py-28" aria-label="Screenshots">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4 uppercase tracking-wider">Screenshots</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">See DayMyTime in action</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">A clean, intuitive interface that makes scheduling effortless.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {screenshots.map(({ title, desc, image }) => (
              <div
                key={title}
                className="group rounded-2xl border bg-card overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={image}
                      alt={`${title} - DayMyTime scheduler screenshot`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width="400"
                      height="300"
                    />
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28" aria-label="How it works">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4 uppercase tracking-wider">How It Works</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Simple as 1-2-3</h2>
          <p className="text-muted-foreground">Get started in under a minute. No complex setup.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {howItWorks.map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground font-display text-lg font-bold mb-4 shadow-glow">
                {step}
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/30 py-20 sm:py-28" aria-label="Testimonials">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">Testimonials</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Loved by thousands</h2>
            <p className="text-muted-foreground">See what our users say about DayMyTime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border bg-card p-6 shadow-card">
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
              </div>
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
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">Pricing</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free. Upgrade when you need more power.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
            {/* Free Card */}
            <div className="rounded-2xl border bg-card p-8 shadow-card">
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
            </div>
            {/* Pro Card */}
            <div className="rounded-2xl border-2 border-primary bg-card p-8 shadow-elevated relative overflow-hidden">
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
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-2xl border bg-card overflow-hidden shadow-card max-w-3xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-secondary/30 py-20 sm:py-28" aria-label="FAQ">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">FAQ</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Frequently asked questions</h2>
            <p className="text-muted-foreground">Everything you need to know about DayMyTime.</p>
          </div>

          <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-card">
            {faqs.map(faq => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-28 text-center px-4 overflow-hidden" aria-label="Call to action">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Ready to take control of your time?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join thousands of users who plan smarter every day.</p>
          <Button size="lg" onClick={() => navigate('/auth')} className="h-12 px-8 text-base rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90 mb-8">
            Get Started for Free <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <div className="max-w-md mx-auto">
            <Suspense fallback={<div className="h-40 rounded-xl bg-muted/30 animate-pulse" />}>
              <NewsletterSubscribe
                title="📬 Or subscribe for updates"
                description="Get productivity tips, history facts, and app updates in your inbox."
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12 sm:py-16" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <img src="/images/logo-icon.webp" alt="DayMyTime" className="h-8 w-8 rounded-lg" loading="lazy" width="32" height="32" />
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
                <a href="/topics/productivity-tips" className="block text-muted-foreground hover:text-foreground transition-colors">Productivity Guide</a>
                <a href="/topics/daily-motivation" className="block text-muted-foreground hover:text-foreground transition-colors">Daily Motivation</a>
                <a href="/topics/self-improvement" className="block text-muted-foreground hover:text-foreground transition-colors">Self Improvement</a>
                <a href="/about" className="block text-muted-foreground hover:text-foreground transition-colors">About</a>
                <a href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</a>
                <a href="/giveaway" className="block text-primary font-semibold hover:text-primary/80 transition-colors">🎁 Giveaway</a>
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

      {/* Scroll to top — CSS transition */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-xl gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:opacity-90 transition-opacity animate-in fade-in zoom-in-90 duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
