import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/use-theme';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft, Sun, Moon, Calendar, Heart, Share2, MessageSquare,
  ChevronLeft, ChevronRight, Twitter, Facebook, Linkedin, Send, Clock, User,
  Instagram, Copy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface HistoryPost {
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
  created_at: string;
}

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default function History() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<HistoryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<HistoryPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [email, setEmail] = useState('');
  const PAGE_SIZE = 9;

  // Load specific post by slug
  useEffect(() => {
    if (slug) {
      fetchBySlug(slug);
    } else {
      fetchPosts();
    }
  }, [slug, page]);

  useEffect(() => {
    if (selectedPost) {
      trackView(selectedPost.id);
      if (user) {
        checkLiked();
        fetchComments();
      } else {
        fetchComments();
      }
    }
  }, [selectedPost, user]);

  const fetchBySlug = async (s: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('history_posts')
      .select('*')
      .eq('slug', s)
      .eq('status', 'published')
      .maybeSingle();
    if (data) {
      setSelectedPost(data as unknown as HistoryPost);
    }
    // Also fetch list
    const { data: listData } = await supabase
      .from('history_posts')
      .select('*')
      .eq('status', 'published')
      .order('publish_date', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (listData) {
      setPosts(listData as unknown as HistoryPost[]);
      setHasMore(listData.length === PAGE_SIZE);
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('history_posts')
      .select('*')
      .eq('status', 'published')
      .order('publish_date', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (!error && data) {
      setPosts(data as unknown as HistoryPost[]);
      setHasMore(data.length === PAGE_SIZE);
      if (!selectedPost && data.length > 0) setSelectedPost(data[0] as unknown as HistoryPost);
    }
    setLoading(false);
  };

  const trackView = async (postId: string) => {
    await supabase.from('page_views').insert({
      page_path: `/history/${slug || ''}`,
      post_id: postId,
    } as any);
  };

  const checkLiked = async () => {
    if (!user || !selectedPost) return;
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', selectedPost.id)
      .eq('post_type', 'history')
      .eq('user_id', user.id)
      .maybeSingle();
    setLiked(!!data);
  };

  const fetchComments = async () => {
    if (!selectedPost) return;
    const { data } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', selectedPost.id)
      .eq('post_type', 'history')
      .order('created_at', { ascending: true });
    if (data) setComments(data as unknown as Comment[]);
  };

  const toggleLike = async () => {
    if (!user) { toast.error('Please sign in to like'); return; }
    if (!selectedPost) return;
    if (liked) {
      await supabase.from('post_likes').delete()
        .eq('post_id', selectedPost.id).eq('post_type', 'history').eq('user_id', user.id);
      setLiked(false);
      setSelectedPost(p => p ? { ...p, likes_count: p.likes_count - 1 } : p);
    } else {
      await supabase.from('post_likes').insert({ post_id: selectedPost.id, post_type: 'history', user_id: user.id });
      setLiked(true);
      setSelectedPost(p => p ? { ...p, likes_count: p.likes_count + 1 } : p);
    }
  };

  const addComment = async () => {
    if (!user) { toast.error('Please sign in to comment'); return; }
    if (!selectedPost || !newComment.trim()) return;
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
    const { error } = await supabase.from('post_comments').insert({
      post_id: selectedPost.id, post_type: 'history', user_id: user.id,
      user_name: profile?.display_name || 'Anonymous', content: newComment.trim()
    });
    if (!error) {
      setNewComment('');
      fetchComments();
      toast.success('Comment posted!');
    }
  };

  const subscribe = async () => {
    if (!email.trim()) return;
    const { error } = await supabase.from('newsletter_followers').insert({ email: email.trim() });
    if (error?.code === '23505') toast.info('Already subscribed!');
    else if (error) toast.error('Failed to subscribe');
    else { toast.success('Subscribed!'); setEmail(''); }
  };

  const getShareUrl = () => {
    if (!selectedPost) return '';
    return `https://daymytime.com/history/${selectedPost.slug}`;
  };

  const share = (platform: string) => {
    if (!selectedPost) return;
    const url = getShareUrl();
    const text = selectedPost.title;
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

  const todayPost = selectedPost;
  const jsonLd = todayPost ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: todayPost.seo_title || todayPost.title,
    description: todayPost.meta_description || todayPost.excerpt,
    image: todayPost.featured_image,
    author: { '@type': 'Person', name: todayPost.author_name },
    datePublished: todayPost.publish_date,
    publisher: { '@type': 'Organization', name: 'DayMyTime' },
  } : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={todayPost?.seo_title || "This Day in History – Daily Historical Events & Facts | DayMyTime"}
        description={todayPost?.meta_description || "Discover what happened on this day in history. Daily historical events, stories, and fascinating facts curated by DayMyTime for history enthusiasts."}
        canonical={`https://daymytime.com/history${todayPost ? `/${todayPost.slug}` : ''}`}
        type={todayPost ? 'article' : 'website'}
        image={todayPost?.featured_image || undefined}
        article={todayPost ? { publishedTime: todayPost.publish_date, author: todayPost.author_name, section: 'History' } : undefined}
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
            <Button size="sm" variant="ghost" onClick={() => navigate('/todaytip')} className="text-xs">Today's Tip</Button>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-primary/20 text-xs font-semibold text-primary mb-4">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(), 'MMMM d, yyyy')}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
              This Day in <span className="text-gradient">History</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Discover fascinating events that shaped our world on this day.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-20">
        {loading && !todayPost ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : todayPost ? (
          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            {(todayPost.featured_image || todayPost.featured_image_2) && (
              <div className={`flex gap-3 mb-6 ${todayPost.image_align === 'center' ? 'justify-center' : todayPost.image_align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {todayPost.featured_image && (
                  <img src={todayPost.featured_image} alt={todayPost.title} className={`${todayPost.featured_image_2 ? 'w-1/2' : 'w-full'} h-64 sm:h-80 object-cover rounded-2xl`} loading="lazy" />
                )}
                {todayPost.featured_image_2 && (
                  <img src={todayPost.featured_image_2} alt={`${todayPost.title} - 2`} className={`${todayPost.featured_image ? 'w-1/2' : 'w-full'} h-64 sm:h-80 object-cover rounded-2xl`} loading="lazy" />
                )}
              </div>
            )}
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">{todayPost.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{todayPost.author_name}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(todayPost.publish_date), 'MMM d, yyyy')}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{Math.ceil(todayPost.content.split(' ').length / 200)} min read</span>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: todayPost.content.replace(/\n/g, '<br/>') }} />

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 border-t border-b border-border py-4 mb-8">
              <Button size="sm" variant={liked ? "default" : "outline"} onClick={toggleLike} className="gap-1.5">
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {todayPost.likes_count}
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
              <Button size="sm" variant="outline" onClick={() => share('instagram')} className="gap-1.5">
                <Instagram className="h-4 w-4" /> Instagram
              </Button>
              <Button size="sm" variant="outline" onClick={() => share('copy')} className="gap-1.5">
                <Copy className="h-4 w-4" /> Copy Link
              </Button>
            </div>

            {/* Comments */}
            <div className="mb-8">
              <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Comments ({comments.length})
              </h3>
              {user ? (
                <div className="flex gap-2 mb-4">
                  <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 min-h-[60px]" />
                  <Button size="sm" onClick={addComment} disabled={!newComment.trim()}><Send className="h-4 w-4" /></Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  <Button variant="link" onClick={() => navigate('/auth')} className="p-0 h-auto">Sign in</Button> to comment.
                </p>
              )}
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{c.user_name}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm">{c.content}</p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>}
              </div>
            </div>

            {/* Newsletter */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-display font-bold mb-2">📬 Get daily history updates</h3>
                <p className="text-sm text-muted-foreground mb-3">Subscribe to receive articles directly in your inbox.</p>
                <div className="flex gap-2">
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1" />
                  <Button onClick={subscribe}>Subscribe</Button>
                </div>
              </CardContent>
            </Card>
          </motion.article>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No history posts published yet. Check back soon!</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        )}

        {/* Previous Posts Grid */}
        {posts.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold mb-6">Previous Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {posts.map(post => (
                <motion.div key={post.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full" onClick={() => { setSelectedPost(post); navigate(`/history/${post.slug}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
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

      {/* Footer */}
      <footer className="border-t py-8" role="contentinfo">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-4" aria-label="Footer navigation">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <a href="/todaytip" className="hover:text-foreground transition-colors">Productivity Tips</a>
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
