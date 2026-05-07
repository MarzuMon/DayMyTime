import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/use-theme';
import SEOHead from '@/components/SEOHead';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Sun, Moon, UserPlus, UserMinus, Users } from 'lucide-react';
import { useFollow } from '@/hooks/use-follow';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface UserPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  created_at: string;
  likes_count: number;
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);
  const { following, followerCount, toggle, isSelf, loading: followLoading } = useFollow(id);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: prof }, { data: postsData }, { count: followingC }] = await Promise.all([
        supabase.from('profiles').select('id,display_name,avatar_url').eq('id', id).maybeSingle(),
        supabase.from('user_posts')
          .select('id,title,slug,excerpt,featured_image,category,created_at,likes_count')
          .eq('author_id', id).eq('status', 'published')
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', id),
      ]);
      setProfile(prof as Profile);
      setPosts((postsData as UserPost[]) || []);
      setFollowingCount(followingC || 0);
      setLoading(false);
    })();
  }, [id]);

  const displayName = profile?.display_name || 'DayMyTime member';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={`${displayName} | DayMyTime Community`}
        description={`Posts and activity by ${displayName} on DayMyTime.`}
        canonical={`https://daymytime.com/user/${id}`}
      />

      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
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
            { label: displayName },
          ]} />
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-8 p-6 glass rounded-2xl">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-display text-2xl font-bold">{displayName}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-muted-foreground">
                  <span><strong className="text-foreground">{posts.length}</strong> posts</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />
                    <strong className="text-foreground">{followerCount}</strong> followers</span>
                  <span><strong className="text-foreground">{followingCount}</strong> following</span>
                </div>
              </div>
              {!isSelf && (
                <Button onClick={toggle} disabled={followLoading} variant={following ? 'outline' : 'default'}>
                  {following ? <><UserMinus className="h-4 w-4 mr-1" /> Following</>
                             : <><UserPlus className="h-4 w-4 mr-1" /> Follow</>}
                </Button>
              )}
            </motion.div>

            <h2 className="font-display text-lg font-bold mb-4">Posts</h2>
            {posts.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No posts yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {posts.map((p) => (
                  <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/community/${p.slug}`)}>
                    {p.featured_image && (
                      <img src={p.featured_image} alt={p.title}
                        className="w-full h-36 object-cover rounded-t-lg" loading="lazy" />
                    )}
                    <CardContent className="pt-4">
                      <Badge variant="secondary" className="mb-2 text-[10px] capitalize">{p.category}</Badge>
                      <h3 className="font-display font-bold text-sm mb-1 line-clamp-2">{p.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.excerpt}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(p.created_at), 'MMM d, yyyy')} · {p.likes_count} likes
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
