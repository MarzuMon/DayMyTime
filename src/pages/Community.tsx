import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import SEOHead from '@/components/SEOHead';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Sun, Moon, PenSquare, User, Calendar, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface UserPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  author_id: string;
  author_name: string;
  status: string;
  created_at: string;
}

const PAGE_SIZE = 12;

export default function Community() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [selected, setSelected] = useState<UserPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchOne(slug);
    } else {
      setSelected(null);
      fetchList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, page]);

  const fetchList = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (data) {
      setPosts(data as unknown as UserPost[]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  };

  const fetchOne = async (s: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('user_posts')
      .select('*')
      .eq('slug', s)
      .maybeSingle();
    if (data) setSelected(data as unknown as UserPost);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('user_posts').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete post');
      return;
    }
    toast.success('Post deleted');
    navigate('/community');
  };

  const isOwner = (post: UserPost) => user?.id === post.author_id;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={selected ? `${selected.title} | DayMyTime Community` : 'Community Blog – Stories from DayMyTime Users'}
        description={selected?.excerpt || 'Read posts written by the DayMyTime community on productivity, time management, and history.'}
        canonical={`https://daymytime.com/community${selected ? `/${selected.slug}` : ''}`}
        type={selected ? 'article' : 'website'}
        image={selected?.featured_image || undefined}
        article={selected ? { publishedTime: selected.created_at, author: selected.author_name } : undefined}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Button>
            <img src="/images/logo-icon.webp" alt="DayMyTime" className="h-7 w-7 rounded-lg" />
            <span className="font-display font-bold text-sm">Community</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate(user ? '/write' : '/auth')} className="gap-1.5">
              <PenSquare className="h-4 w-4" /> Write
            </Button>
            <Button size="icon" variant="ghost" onClick={toggleTheme} className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Community', href: '/community' },
            ...(selected ? [{ label: selected.title }] : []),
          ]} />
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : selected ? (
          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {selected.featured_image && (
              <img src={selected.featured_image} alt={selected.title}
                className="w-full max-h-96 object-cover rounded-2xl mb-6" loading="lazy" />
            )}
            <Badge variant="secondary" className="mb-3 capitalize">{selected.category}</Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">{selected.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{selected.author_name || 'Anonymous'}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(selected.created_at), 'MMM d, yyyy')}</span>
              {isOwner(selected) && (
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/write/${selected.id}`)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(selected.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selected.content }} />
            <div className="mt-10 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => navigate('/community')}>
                ← Back to Community
              </Button>
            </div>
          </motion.article>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                Community <span className="text-gradient">Blog</span>
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                Stories, tips, and perspectives from the DayMyTime community.
              </p>
              <Button size="lg" onClick={() => navigate(user ? '/write' : '/auth')} className="gap-2">
                <PenSquare className="h-4 w-4" /> Write a Post
              </Button>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No posts yet. Be the first to share!
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {posts.map(post => (
                    <motion.div key={post.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                      <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
                        onClick={() => navigate(`/community/${post.slug}`)}>
                        {post.featured_image && (
                          <img src={post.featured_image} alt={post.title}
                            className="w-full h-40 object-cover" loading="lazy" />
                        )}
                        <CardContent className="pt-4">
                          <Badge variant="secondary" className="mb-2 text-[10px] capitalize">{post.category}</Badge>
                          <h3 className="font-display font-bold text-sm mb-1 line-clamp-2">{post.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.excerpt}</p>
                          <p className="text-xs text-muted-foreground">
                            {post.author_name || 'Anonymous'} · {format(new Date(post.created_at), 'MMM d')}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-center gap-3">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
