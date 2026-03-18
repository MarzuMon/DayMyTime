import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { TrendingUp, BookOpen } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  publish_date: string;
  likes_count: number;
}

interface RelatedPostsProps {
  currentPostId?: string;
  type: 'history' | 'tips';
  keywords?: string | null;
}

export default function RelatedPosts({ currentPostId, type, keywords }: RelatedPostsProps) {
  const navigate = useNavigate();
  const [related, setRelated] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);

  const table = type === 'history' ? 'history_posts' : 'daily_tips';
  const basePath = type === 'history' ? '/history' : '/todaytip';

  useEffect(() => {
    fetchRelated();
    fetchTrending();
  }, [currentPostId]);

  const fetchRelated = async () => {
    const { data } = await supabase
      .from(table)
      .select('id, title, slug, excerpt, featured_image, publish_date, likes_count')
      .eq('status', 'published')
      .neq('id', currentPostId || '')
      .order('publish_date', { ascending: false })
      .limit(3);
    if (data) setRelated(data as Post[]);
  };

  const fetchTrending = async () => {
    const { data } = await supabase
      .from(table)
      .select('id, title, slug, excerpt, featured_image, publish_date, likes_count')
      .eq('status', 'published')
      .neq('id', currentPostId || '')
      .order('likes_count', { ascending: false })
      .limit(4);
    if (data) setTrending(data as Post[]);
  };

  const PostCard = ({ post }: { post: Post }) => (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
        onClick={() => { navigate(`${basePath}/${post.slug}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        {post.featured_image && (
          <img src={post.featured_image} alt={post.title} className="w-full h-32 object-cover" loading="lazy" />
        )}
        <CardContent className="pt-3 pb-3">
          <h4 className="font-display font-bold text-sm mb-1 line-clamp-2">{post.title}</h4>
          <p className="text-xs text-muted-foreground">{format(new Date(post.publish_date), 'MMM d, yyyy')}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (related.length === 0 && trending.length === 0) return null;

  return (
    <div className="space-y-10">
      {/* Related Posts */}
      {related.length > 0 && (
        <section>
          <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Recommended Reading
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        </section>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <section>
          <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" /> Trending Articles
          </h3>
          <div className="space-y-3">
            {trending.map((post, i) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => { navigate(`${basePath}/${post.slug}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <span className="font-display text-2xl font-bold text-muted-foreground/30 w-8 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-1">{post.title}</h4>
                  <p className="text-xs text-muted-foreground">{post.likes_count} likes • {format(new Date(post.publish_date), 'MMM d')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cross-linking */}
      <section className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <h3 className="font-display font-bold text-sm mb-2">📚 Explore More on DayMyTime</h3>
        <div className="flex flex-wrap gap-2">
          <a href="/todaytip" className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-medium">Productivity Tips</a>
          <a href="/history" className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">History Facts</a>
          <a href="/about" className="text-xs px-3 py-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors font-medium">About Us</a>
          <a href="/auth" className="text-xs px-3 py-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors font-medium">Start Scheduling</a>
        </div>
      </section>
    </div>
  );
}
