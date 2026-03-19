import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/use-theme';
import SEOHead from '@/components/SEOHead';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sun, Moon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  publish_date: string;
  likes_count: number;
}

const categories: Record<string, {
  title: string;
  seoTitle: string;
  description: string;
  metaDescription: string;
  table: 'history_posts' | 'daily_tips';
  basePath: string;
  icon: string;
  pillarContent: { heading: string; text: string }[];
}> = {
  'productivity-tips': {
    title: 'Productivity Tips',
    seoTitle: 'Productivity Tips – Daily Time Management & Efficiency Ideas | DayMyTime',
    description: 'Master your time with proven productivity techniques. From morning routines to focus strategies, discover actionable tips to boost your daily efficiency.',
    metaDescription: 'Discover daily productivity tips, time management techniques, and focus strategies. Actionable advice for students and professionals to boost efficiency.',
    table: 'daily_tips',
    basePath: '/todaytip',
    icon: '⚡',
    pillarContent: [
      { heading: 'Morning Productivity Routines', text: 'Start your day right with structured morning habits. The most productive people follow consistent routines that prime their mind for focused work.' },
      { heading: 'Time Management Techniques', text: 'From the Pomodoro Technique to time blocking, discover methods that help you allocate your hours effectively and reduce procrastination.' },
      { heading: 'Focus Improvement Strategies', text: 'Learn how to minimize distractions, enter deep work states, and maintain concentration throughout your day for maximum output.' },
    ],
  },
  'daily-motivation': {
    title: 'Daily Motivation',
    seoTitle: 'Daily Motivation & Inspiration – Motivational Ideas | DayMyTime',
    description: 'Get your daily dose of motivation and inspiration. Discover ideas, stories, and actionable insights to keep you driven and focused on your goals.',
    metaDescription: 'Daily motivational ideas and inspiration to keep you driven. Actionable insights for personal growth, goal setting, and staying focused.',
    table: 'daily_tips',
    basePath: '/todaytip',
    icon: '🔥',
    pillarContent: [
      { heading: 'Goal Setting & Achievement', text: 'Break down big ambitions into achievable daily milestones. Learn the science of goal setting that actually drives results.' },
      { heading: 'Overcoming Procrastination', text: 'Understand why we procrastinate and discover practical methods to beat it. Small consistent actions lead to extraordinary results.' },
      { heading: 'Building Positive Habits', text: 'Replace unproductive habits with empowering ones. The key to lasting motivation is building systems, not relying on willpower alone.' },
    ],
  },
  'today-in-history': {
    title: 'Today in History',
    seoTitle: 'Today in History – Daily Historical Events & Facts | DayMyTime',
    description: 'Explore what happened on this day in history. From groundbreaking discoveries to pivotal moments, learn fascinating stories that shaped our world.',
    metaDescription: 'Discover what happened today in history. Daily historical events, discoveries, and fascinating stories that shaped the world. Curated by DayMyTime.',
    table: 'history_posts',
    basePath: '/history',
    icon: '📜',
    pillarContent: [
      { heading: 'Scientific Discoveries', text: 'From the discovery of DNA to the first moon landing, explore the scientific breakthroughs that changed humanity forever.' },
      { heading: 'World-Changing Events', text: 'Wars, revolutions, treaties, and movements — understand the pivotal events that shaped nations and global politics.' },
      { heading: 'Cultural Milestones', text: 'Art, music, literature, and cultural shifts that defined generations. Discover the creative moments that transformed society.' },
    ],
  },
  'self-improvement': {
    title: 'Self Improvement',
    seoTitle: 'Self Improvement Tips – Personal Growth & Development | DayMyTime',
    description: 'Invest in yourself with daily self improvement tips. Build better habits, develop new skills, and unlock your full potential with practical guidance.',
    metaDescription: 'Self improvement tips for personal growth and development. Build better habits, develop skills, and unlock your potential with daily actionable advice.',
    table: 'daily_tips',
    basePath: '/todaytip',
    icon: '🌱',
    pillarContent: [
      { heading: 'Mindfulness & Mental Health', text: 'Prioritize your mental wellbeing with mindfulness practices, stress management techniques, and emotional intelligence development.' },
      { heading: 'Skill Development', text: 'Never stop learning. Discover frameworks for rapidly acquiring new skills and building competencies that matter for your career and life.' },
      { heading: 'Work-Life Balance', text: 'Achieve harmony between professional ambitions and personal fulfillment. Learn boundaries, recovery strategies, and sustainable success practices.' },
    ],
  },
  'life-hacks': {
    title: 'Life Hacks',
    seoTitle: 'Life Hacks – Clever Tips & Smart Shortcuts | DayMyTime',
    description: 'Discover clever life hacks, everyday shortcuts, and smart solutions that simplify your routine and save you time, money, and effort.',
    metaDescription: 'Clever life hacks, everyday tricks, and smart shortcuts to simplify your daily routine. Save time and boost efficiency with practical tips from DayMyTime.',
    table: 'daily_tips',
    basePath: '/todaytip',
    icon: '💡',
    pillarContent: [
      { heading: 'Time-Saving Shortcuts', text: 'Cut hours from your weekly routine with clever shortcuts for cooking, cleaning, commuting, and digital workflows that compound over time.' },
      { heading: 'Money-Smart Living', text: 'Practical tricks to reduce expenses without sacrificing quality of life. From subscription audits to DIY solutions that pay for themselves.' },
      { heading: 'Digital Productivity Hacks', text: 'Master your devices and apps with power-user tips, automation recipes, and tool combinations that make technology work harder for you.' },
    ],
  },
};

export default function CategoryPage() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const { theme, toggleTheme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const cat = categories[category || ''];

  useEffect(() => {
    if (!cat) return;
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    if (!cat) return;
    setLoading(true);
    const { data } = await supabase
      .from(cat.table)
      .select('id, title, slug, excerpt, featured_image, publish_date, likes_count')
      .eq('status', 'published')
      .order('publish_date', { ascending: false })
      .limit(12);
    if (data) setPosts(data as Post[]);
    setLoading(false);
  };

  if (!cat) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.title,
    description: cat.metaDescription,
    url: `https://daymytime.com/topics/${category}`,
    isPartOf: { '@type': 'WebSite', name: 'DayMyTime', url: 'https://daymytime.com' },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={cat.seoTitle}
        description={cat.metaDescription}
        canonical={`https://daymytime.com/topics/${category}`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Button>
            <img src="/images/logo-icon.webp" alt="DayMyTime" className="h-7 w-7 rounded-lg" />
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
            { label: 'Topics', href: '/' },
            { label: cat.title },
          ]} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="text-4xl mb-4 block">{cat.icon}</span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
              {cat.title}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">{cat.description}</p>
          </motion.div>
        </div>
      </section>

      {/* Pillar Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold mb-8 text-center">Complete Guide to {cat.title}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {cat.pillarContent.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h3 className="font-display font-bold text-base mb-2">{item.heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="font-display text-2xl font-bold mb-6">Latest {cat.title} Articles</h2>
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading...</div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {posts.map(post => (
              <motion.div key={post.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
                  onClick={() => navigate(`${cat.basePath}/${post.slug}`)}
                >
                  {post.featured_image && (
                    <img src={post.featured_image} alt={post.title} className="w-full h-40 object-cover" loading="lazy" />
                  )}
                  <CardContent className="pt-4">
                    <h3 className="font-display font-bold text-sm mb-1 line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{format(new Date(post.publish_date), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-10">Articles coming soon. Check back shortly!</p>
        )}

        <div className="text-center">
          <Button onClick={() => navigate(cat.basePath)} className="gap-2">
            Browse All {cat.title} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Internal Links */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="font-display text-xl font-bold mb-4">Explore More Topics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(categories).filter(([key]) => key !== category).map(([key, c]) => (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/topics/${key}`)}>
              <CardContent className="pt-4 pb-4 text-center">
                <span className="text-2xl block mb-1">{c.icon}</span>
                <h3 className="font-display font-bold text-xs">{c.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

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
            <a href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</a>
          </nav>
          <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} DayMyTime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
