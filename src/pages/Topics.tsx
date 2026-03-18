import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/use-theme';
import SEOHead from '@/components/SEOHead';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sun, Moon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CategoryMeta {
  key: string;
  title: string;
  description: string;
  icon: string;
  table: 'history_posts' | 'daily_tips';
  basePath: string;
}

const categories: CategoryMeta[] = [
  {
    key: 'productivity-tips',
    title: 'Productivity Tips',
    description: 'Master your time with proven productivity techniques, morning routines, and focus strategies.',
    icon: '⚡',
    table: 'daily_tips',
    basePath: '/topics/productivity-tips',
  },
  {
    key: 'daily-motivation',
    title: 'Daily Motivation',
    description: 'Get your daily dose of motivation with goal-setting ideas, habit-building techniques, and inspirational insights.',
    icon: '🔥',
    table: 'daily_tips',
    basePath: '/topics/daily-motivation',
  },
  {
    key: 'today-in-history',
    title: 'Today in History',
    description: 'Explore groundbreaking discoveries, pivotal moments, and fascinating stories that shaped our world.',
    icon: '📜',
    table: 'history_posts',
    basePath: '/topics/today-in-history',
  },
  {
    key: 'self-improvement',
    title: 'Self Improvement',
    description: 'Build better habits, develop new skills, and unlock your full potential with practical daily guidance.',
    icon: '🌱',
    table: 'daily_tips',
    basePath: '/topics/self-improvement',
  },
];

export default function Topics() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    const [tipsRes, historyRes] = await Promise.all([
      supabase.from('daily_tips').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('history_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ]);
    setCounts({
      'daily_tips': tipsRes.count ?? 0,
      'history_posts': historyRes.count ?? 0,
    });
    setLoading(false);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All Topics – DayMyTime',
    description: 'Explore all content categories on DayMyTime: productivity tips, daily motivation, history facts, and self improvement.',
    url: 'https://daymytime.com/topics',
    isPartOf: { '@type': 'WebSite', name: 'DayMyTime', url: 'https://daymytime.com' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Explore Topics – Productivity, Motivation, History & Self Improvement | DayMyTime"
        description="Browse all content categories on DayMyTime. Discover productivity tips, daily motivation, history facts, and self improvement articles."
        canonical="https://daymytime.com/topics"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Button>
            <img src="/images/logo-icon.png" alt="DayMyTime" className="h-7 w-7 rounded-lg" width={28} height={28} />
            <span className="font-display font-bold text-sm">DayMyTime</span>
          </div>
          <Button size="icon" variant="ghost" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-10 relative">
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="relative max-w-4xl mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Topics' },
          ]} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
              Explore All Topics
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Dive into curated categories covering productivity, motivation, history, and personal growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow h-full"
                onClick={() => navigate(cat.basePath)}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{cat.icon}</span>
                    <div className="flex-1">
                      <h2 className="font-display font-bold text-lg mb-1">{cat.title}</h2>
                      <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {loading ? '...' : `${counts[cat.table] ?? 0} articles`}
                        </span>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs">
                          Explore <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" role="contentinfo">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-4" aria-label="Footer navigation">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <a href="/todaytip" className="hover:text-foreground transition-colors">Productivity Tips</a>
            <a href="/history" className="hover:text-foreground transition-colors">History</a>
            <a href="/about" className="hover:text-foreground transition-colors">About</a>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          </nav>
          <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} DayMyTime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
