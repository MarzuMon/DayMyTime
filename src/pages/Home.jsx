import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles, ArrowRight, CalendarCheck, Zap, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const highlights = [
  {
    icon: CalendarCheck,
    title: 'Visual Scheduling',
    desc: 'Drag, tap, and organize your day in a beautiful timeline view.',
  },
  {
    icon: Zap,
    title: 'Instant Alerts',
    desc: 'Smart notifications that fire right when you need them.',
  },
  {
    icon: Users,
    title: 'Team Sync',
    desc: 'Collaborate with your team on shared timetables.',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-accent/8 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-card/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-lg tracking-tight">DayMyTime</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate('/app')}>
              Open App <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 sm:py-32 px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeIn} custom={0} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-card text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Smart scheduling for modern life
          </motion.div>

          <motion.h1
            variants={fadeIn}
            custom={1}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5"
          >
            Own every minute
            <br />
            <span className="text-primary">of your day.</span>
          </motion.h1>

          <motion.p
            variants={fadeIn}
            custom={2}
            className="text-muted-foreground text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            The visual scheduler that helps you plan tasks, catch every meeting, and stay in flow — all in one clean interface.
          </motion.p>

          <motion.div variants={fadeIn} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto text-base px-8">
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/app')} className="w-full sm:w-auto text-base">
              Try Without Account
            </Button>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            variants={fadeIn}
            custom={4}
            className="mt-14 flex items-center justify-center gap-8 sm:gap-12 text-center"
          >
            {[
              { value: '10K+', label: 'Schedules Created' },
              { value: '4.9★', label: 'User Rating' },
              { value: '100%', label: 'Free to Start' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Highlights */}
      <section className="py-16 sm:py-24 px-4 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Built for how you work</h2>
            <p className="text-muted-foreground mt-2">Three pillars that make DayMyTime different.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {highlights.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                variants={fadeIn}
                custom={i}
                className="group rounded-2xl border bg-card p-6 sm:p-8 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center rounded-3xl border bg-card p-10 sm:p-14 shadow-elevated"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
            Ready to take control?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands who plan smarter with DayMyTime. It's free, fast, and private.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="text-base px-10">
            Create Free Account
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 DayMyTime</span>
          <nav className="flex items-center gap-4 flex-wrap justify-center" aria-label="Footer navigation">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
            <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
