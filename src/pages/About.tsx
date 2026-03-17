import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Bell, Video, Users, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';

const values = [
  { icon: Target, title: 'Simplicity First', desc: 'No bloat, no learning curve. Just a clean scheduler that works.' },
  { icon: Bell, title: 'Smart by Default', desc: 'Intelligent notifications that know when and how to alert you.' },
  { icon: Video, title: 'Meeting-Ready', desc: 'Built-in support for Zoom, Google Meet, and Microsoft Teams.' },
  { icon: Users, title: 'Team-Friendly', desc: 'Collaborate with shared calendars and team timetables.' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About DayMyTime – Our Mission for Productivity & Self Improvement"
        description="Learn about DayMyTime, the smart visual scheduler with daily productivity tips, history facts, and self improvement tools built for students and professionals."
        canonical="https://daymytime.com/about"
      />

      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/images/logo-icon.png" alt="DayMyTime" className="h-8 w-8 rounded-lg" loading="lazy" />
            <span className="font-display font-bold">About DayMyTime</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-xs font-semibold text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Our Story
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-6">
            Scheduling should be{' '}
            <span className="text-gradient">effortless</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            DayMyTime was born from a simple frustration: existing schedulers are either too complex or too basic. 
            We built a tool that's powerful yet simple — a visual scheduler that helps you plan your day, 
            get smart alerts, and join meetings with one tap.
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          className="rounded-2xl border bg-card p-8 sm:p-10 shadow-card mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CalendarDays className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-3">Our Mission</h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            To help students and professionals take control of their time with a beautifully simple scheduling tool. 
            No clutter, no confusion — just your day, perfectly organized.
          </p>
        </motion.div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
          {values.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              className="rounded-2xl border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">Join thousands of users who plan smarter with DayMyTime.</p>
          <Button size="lg" onClick={() => navigate('/auth')} className="rounded-xl gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90">
            Start Free Today
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
