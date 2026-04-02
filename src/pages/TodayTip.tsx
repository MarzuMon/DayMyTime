import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/use-theme';
import SEOHead from '@/components/SEOHead';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import RelatedPosts from '@/components/RelatedPosts';
import NewsletterSubscribe from '@/components/NewsletterSubscribe';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import LikeButton from '@/components/LikeButton';
import CommentSection from '@/components/CommentSection';
import { useCommentCounts } from '@/hooks/use-comment-counts';
import { useEngagementTriggers } from '@/hooks/use-engagement-triggers';
import { LikeNudge, EngagementPopup } from '@/components/EngagementNudge';
import SocialProofToast from '@/components/SocialProofToast';
import {
  ArrowLeft, Sun, Moon, Lightbulb,
  ChevronLeft, ChevronRight, Twitter, Facebook, Linkedin, Clock, User, Calendar,
  Instagram, Copy, MessageSquare
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
  const { slug } = useParams();
  const { theme, toggleTheme } = useTheme();
  
  const [tips, setTips] = useState<DailyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTip, setSelectedTip] = useState<DailyTip | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const PAGE_SIZE = 9;
  const tipIds = useMemo(() => tips.map(t => t.id), [tips]);
  const commentCounts = useCommentCounts(tipIds, 'tip');
  const todayTip = selectedTip;
  const engagement = useEngagementTriggers(todayTip?.id);

  useEffect(() => {
    if (slug) {
      fetchBySlug(slug);
    } else {
      fetchTips();
    }
  }, [slug, page]);

  useEffect(() => {
    if (selectedTip) {
      trackView(selectedTip.id);
    }
  }, [selectedTip]);

  const fetchBySlug = async (s: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_tips').select('*').eq('slug', s).eq('status', 'published').maybeSingle();
    if (data) setSelectedTip(data as unknown as DailyTip);
    const { data: listData } = await supabase
      .from('daily_tips').select('*').eq('status', 'published')
      .order('publish_date', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (listData) {
      setTips(listData as unknown as DailyTip[]);
      setHasMore(listData.length === PAGE_SIZE);
    }
    setLoading(false);
  };

  const fetchTips = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_tips').select('*').eq('status', 'published')
      .order('publish_date', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (data) {
      setTips(data as unknown as DailyTip[]);
      setHasMore(data.length === PAGE_SIZE);
      if (!selectedTip && data.length > 0) setSelectedTip(data[0] as unknown as DailyTip);
    }
    setLoading(false);
  };

  const trackView = async (postId: string) => {
    await supabase.from('page_views').insert({
      page_path: `/todaytip/${slug || ''}`,
      post_id: postId,
    } as any);
  };



  const getShareUrl = () => {
    if (!selectedTip) return '';
    return `https://daymytime.com/todaytip/${selectedTip.slug}`;
  };

  const share = (platform: string) => {
    if (!selectedTip) return;
    const url = getShareUrl();
    const text = selectedTip.title;
    if (platform === 'instagram' || platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success(platform === 'instagram' ? 'Link copied! Paste it on Instagram.' : 'Link copied!');
      return;
    }
    const links: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    window.open(links[platform], '_blank', 'width=600,height=400');
  };

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
        title={todayTip?.seo_title || "Today's Productivity Tip – Daily Inspiration & Self Improvement | DayMyTime"}
        description={todayTip?.meta_description || "Daily productivity tips and self improvement ideas for better time management. Boost your efficiency with actionable daily inspiration from DayMyTime."}
        canonical={`https://daymytime.com/todaytip${todayTip ? `/${todayTip.slug}` : ''}`}
        type={todayTip ? 'article' : 'website'}
        image={todayTip?.featured_image || undefined}
        article={todayTip ? { publishedTime: todayTip.publish_date, author: todayTip.author_name, section: 'Productivity' } : undefined}
      />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

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
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate('/history')} className="text-xs">History</Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/giveaway')} className="text-xs text-primary font-semibold">🎁 Giveaway</Button>
            <Button size="icon" variant="ghost" onClick={toggleTheme} className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-10 relative">
        <div className="absolute inset-0 gradient-hero opacity-50" />
       <div className="relative max-w-4xl mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Productivity Tips', href: '/todaytip' },
            ...(todayTip ? [{ label: todayTip.title }] : []),
          ]} />
          <div className="text-center">
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
              <LikeButton postId={todayTip.id} postType="tip" />
              <Button size="sm" variant="outline" onClick={() => share('twitter')} className="gap-1.5">
                <Twitter className="h-4 w-4" /> Tweet
              </Button>
              <Button size="sm" variant="outline" onClick={() => share('facebook')} className="gap-1.5">
                <Facebook className="h-4 w-4" /> Share
              </Button>
              <Button size="sm" variant="outline" onClick={() => share('linkedin')} className="gap-1.5">
                <Linkedin className="h-4 w-4" /> Post
              </Button>
              <Button size="sm" variant="outline" onClick={() => share('instagram')} className="gap-1.5">
                <Instagram className="h-4 w-4" /> Instagram
              </Button>
              <Button size="sm" variant="outline" onClick={() => share('copy')} className="gap-1.5">
                <Copy className="h-4 w-4" /> Copy Link
              </Button>
            </div>

            {/* Comments */}
            <div className="mb-8">
              <CommentSection postId={todayTip.id} postType="tip" />
            </div>

            {/* Related Posts */}
            <RelatedPosts currentPostId={todayTip.id} type="tips" keywords={todayTip.keywords} />

            {/* Newsletter */}
            <div className="mt-8">
              <NewsletterSubscribe context="tips" variant="accent" />
            </div>
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
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full" onClick={() => { setSelectedTip(tip); navigate(`/todaytip/${tip.slug}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    {tip.featured_image && (
                      <img src={tip.featured_image} alt={tip.title} className="w-full h-40 object-cover" loading="lazy" />
                    )}
                    <CardContent className="pt-4">
                      <h3 className="font-display font-bold text-sm mb-1 line-clamp-2">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{format(new Date(tip.publish_date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{tip.excerpt}</p>
                      {(commentCounts[tip.id] || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" /> {commentCounts[tip.id]}
                        </span>
                      )}
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

      <footer className="border-t py-8" role="contentinfo">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-4" aria-label="Footer navigation">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <a href="/history" className="hover:text-foreground transition-colors">This Day in History</a>
            <a href="/giveaway" className="text-primary font-semibold hover:text-primary/80 transition-colors">🎁 Giveaway</a>
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
