import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/use-theme';
import SEOHead from '@/components/SEOHead';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sun, Moon, TrendingUp, Heart, MessageSquare, Eye, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface TrendingPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  author_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  score: number;
}

export default function CommunityTrending() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Look at last 30 days for trending
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('user_posts')
        .select('id,title,slug,excerpt,featured_image,category,author_name,created_at,likes_count,comments_count,views_count')
        .eq('status', 'published')
        .gte('created_at', since)
        .limit(100);
      const scored = (data || [])
        .map((p: any) => ({
          ...p,
          score: (p.likes_count || 0) * 2 + (p.comments_count || 0) * 1.5 + (p.views_count || 0) * 0.1,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 30);
      setPosts(scored as TrendingPost[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Trending Community Posts | DayMyTime"
        description="The most popular posts from the DayMyTime community right now."
        canonical="https://daymytime.com/community/trending"
      />

      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={() => navigate('/community')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Community
          </Button>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-display font-bold text-sm">Trending</span>
          </div>
          <Button size="icon" variant="ghost" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </nav>

      <section className="pt-20 pb-6">
        <div className="max-w-4xl mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Community', href: '/community' },
            { label: 'Trending' },
          ]} />
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="h-7 w-7 text-orange-500" />
            <span className="text-gradient">Trending Now</span>
          </h1>
          <p className="text-sm text-muted-foreground">Top community posts by likes, comments and views (last 30 days).</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No trending posts yet — be the first to spark a conversation.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/community/${p.slug}`)}>
                  <CardContent className="flex gap-4 p-4">
                    <div className="flex flex-col items-center justify-center w-10 shrink-0">
                      <span className="text-2xl font-bold text-muted-foreground">#{i + 1}</span>
                    </div>
                    {p.featured_image && (
                      <img src={p.featured_image} alt={p.title}
                        className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-lg shrink-0" loading="lazy" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="mb-1 text-[10px] capitalize">{p.category}</Badge>
                      <h3 className="font-display font-bold text-sm sm:text-base line-clamp-2">{p.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{p.excerpt}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{p.author_name} · {format(new Date(p.created_at), 'MMM d')}</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p.likes_count}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{p.comments_count}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{p.views_count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
