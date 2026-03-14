import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/use-theme';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft, Sun, Moon, Lightbulb, Heart, Share2,
  ChevronLeft, ChevronRight, Twitter, Facebook, Linkedin, Clock, User, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface DailyTip {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  featured_image_2: string | null;
  image_align: string;
  author_name: string;
  publish_date: string;
  seo_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  likes_count: number;
}

export default function TodayTip() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [tips, setTips] = useState<DailyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTip, setSelectedTip] = useState<DailyTip | null>(null);
  const [liked, setLiked] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [email, setEmail] = useState('');
  const PAGE_SIZE = 9;

  useEffect(() => { fetchTips(); }, [page]);
  useEffect(() => { if (selectedTip && user) checkLiked(); }, [selectedTip, user]);

  const fetchTips = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_tips')
      .select('*')
      .eq('status', 'published')
      .order('publish_date', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (data) {
      setTips(data as unknown as DailyTip[]);
      setHasMore(data.length === PAGE_SIZE);
      if (!selectedTip && data.length > 0) setSelectedTip(data[0] as unknown as DailyTip);
    }
    setLoading(false);
  };

  const checkLiked = async () => {
    if (!user || !selectedTip) return;
    const { data } = await supabase.from('post_likes').select('id')
      .eq('post_id', selectedTip.id).eq('post_type', 'tip').eq('user_id', user.id).maybeSingle();
    setLiked(!!data);
  };

  const toggleLike = async () => {
    if (!user) { toast.error('Please sign in to like'); return; }
    if (!selectedTip) return;
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', selectedTip.id).eq('post_type', 'tip').eq('user_id', user.id);
      setLiked(false);
      setSelectedTip(t => t ? { ...t, likes_count: t.likes_count - 1 } : t);
    } else {
      await supabase.from('post_likes').insert({ post_id: selectedTip.id, post_type: 'tip', user_id: user.id });
      setLiked(true);
      setSelectedTip(t => t ? { ...t, likes_count: t.likes_count + 1 } : t);
    }
  };

  const subscribe = async () => {
    if (!email.trim()) return;
    const { error } = await supabase.from('newsletter_followers').insert({ email: email.trim() });
    if (error?.code === '23505') toast.info('Already subscribed!');
    else if (error) toast.error('Failed to subscribe');
    else { toast.success('Subscribed!'); setEmail(''); }
  };

  const share = (platform: string) => {
    if (!selectedTip) return;
    const url = `https://daymytime.com/todaytip`;
    const text = selectedTip.title;
    const links: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    window.open(links[platform], '_blank', 'width=600,height=400');
  };

  const todayTip = selectedTip;
  const jsonLd = todayTip ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: todayTip.seo_title || todayTip.title,
    description: todayTip.meta_description || todayTip.excerpt,
    image: todayTip.featured_image,
    author: { '@type': 'Person', name: todayTip.author_name },
    datePublished: todayTip.publish_date,
    publisher: { '@type': 'Organization', name: 'DayMyTime' },
  } : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={todayTip?.seo_title || "Today's Productivity Tip – DayMyTime"}
        description={todayTip?.meta_description || "Daily productivity tips for better time management. Boost your efficiency with actionable advice from DayMyTime."}
        canonical="https://daymytime.com/todaytip"
      />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Button>
            <img src="/images/logo-icon.png" alt="DayMyTime" className="h-7 w-7 rounded-lg" />
            <span className="font-display font-bold text-sm">DayMyTime</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate('/history')} className="text-xs">History</Button>
            <Button size="icon" variant="ghost" onClick={toggleTheme} className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-10 relative">
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-accent/20 text-xs font-semibold text-accent mb-4">
              <Lightbulb className="h-3.5 w-3.5" />
              Daily Tip
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
              Today's Productivity <span className="text-gradient">Tip</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Actionable advice to help you manage your time better, every day.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 pb-20">
        {loading && !todayTip ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : todayTip ? (
          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            {(todayTip.featured_image || todayTip.featured_image_2) && (
              <div className={`flex gap-3 mb-6 ${todayTip.image_align === 'center' ? 'justify-center' : todayTip.image_align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {todayTip.featured_image && (
                  <img src={todayTip.featured_image} alt={todayTip.title} className={`${todayTip.featured_image_2 ? 'w-1/2' : 'w-full'} h-64 sm:h-80 object-cover rounded-2xl`} loading="lazy" />
                )}
                {todayTip.featured_image_2 && (
                  <img src={todayTip.featured_image_2} alt={`${todayTip.title} - 2`} className={`${todayTip.featured_image ? 'w-1/2' : 'w-full'} h-64 sm:h-80 object-cover rounded-2xl`} loading="lazy" />
                )}
              </div>
            )}
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">{todayTip.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{todayTip.author_name}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(todayTip.publish_date), 'MMM d, yyyy')}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{Math.ceil(todayTip.content.split(' ').length / 200)} min read</span>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: todayTip.content.replace(/\n/g, '<br/>') }} />

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 border-t border-b border-border py-4 mb-8">
              <Button size="sm" variant={liked ? "default" : "outline"} onClick={toggleLike} className="gap-1.5">
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {todayTip.likes_count}
              </Button>
              <Button size="sm" variant="outline" onClick={() => share('twitter')} className="gap-1.5">
                <Twitter className="h-4 w-4" /> Tweet
              </Button>
              <Button size="sm" variant="outline" onClick={() => share('facebook')} className="gap-1.5">
                <Facebook className="h-4 w-4" /> Share
              </Button>
              <Button size="sm" variant="outline" onClick={() => share('linkedin')} className="gap-1.5">
                <Linkedin className="h-4 w-4" /> Post
              </Button>
            </div>

            {/* Newsletter */}
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-6">
                <h3 className="font-display font-bold mb-2">💡 Get daily productivity tips</h3>
                <p className="text-sm text-muted-foreground mb-3">Subscribe for actionable time management advice.</p>
                <div className="flex gap-2">
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1" />
                  <Button onClick={subscribe}>Subscribe</Button>
                </div>
              </CardContent>
            </Card>
          </motion.article>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No tips published yet. Check back soon!</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        )}

        {/* Previous Tips */}
        {tips.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold mb-6">Previous Tips</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {tips.map(tip => (
                <motion.div key={tip.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full" onClick={() => { setSelectedTip(tip); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    {tip.featured_image && (
                      <img src={tip.featured_image} alt={tip.title} className="w-full h-40 object-cover" loading="lazy" />
                    )}
                    <CardContent className="pt-4">
                      <h3 className="font-display font-bold text-sm mb-1 line-clamp-2">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{format(new Date(tip.publish_date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tip.excerpt}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button size="sm" variant="outline" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} DayMyTime. All rights reserved.</p>
      </footer>
    </div>
  );
}
