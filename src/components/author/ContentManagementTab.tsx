import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus, Edit, Trash2, Eye, Sparkles, Loader2, Calendar, FileText, Lightbulb, Send
} from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  author_name: string;
  publish_date: string;
  seo_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  status: string;
  likes_count: number;
  created_at: string;
}

const emptyPost = {
  title: '', content: '', excerpt: '', featured_image: '',
  author_name: 'DayMyTime Team', publish_date: format(new Date(), 'yyyy-MM-dd'),
  seo_title: '', meta_description: '', keywords: '', status: 'draft'
};

function generateSlug(title: string, date: string): string {
  const d = new Date(date);
  const month = d.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const day = d.getDate();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${month}-${day}-${slug}`;
}

export default function ContentManagementTab() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('history');
  const [historyPosts, setHistoryPosts] = useState<Post[]>([]);
  const [dailyTips, setDailyTips] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [h, t] = await Promise.all([
      supabase.from('history_posts').select('*').order('publish_date', { ascending: false }).limit(50),
      supabase.from('daily_tips').select('*').order('publish_date', { ascending: false }).limit(50),
    ]);
    if (h.data) setHistoryPosts(h.data as unknown as Post[]);
    if (t.data) setDailyTips(t.data as unknown as Post[]);
    setLoading(false);
  };

  const table = activeTab === 'history' ? 'history_posts' : 'daily_tips';

  const openNew = () => {
    setEditingPost(null);
    setForm({ ...emptyPost });
    setDialogOpen(true);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setForm({
      title: post.title, content: post.content, excerpt: post.excerpt,
      featured_image: post.featured_image || '', author_name: post.author_name,
      publish_date: post.publish_date, seo_title: post.seo_title || '',
      meta_description: post.meta_description || '', keywords: post.keywords || '',
      status: post.status
    });
    setDialogOpen(true);
  };

  const savePost = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    const slug = generateSlug(form.title, form.publish_date);
    const payload = {
      title: form.title, slug, content: form.content, excerpt: form.excerpt || form.content.slice(0, 160),
      featured_image: form.featured_image || null, author_name: form.author_name,
      publish_date: form.publish_date, seo_title: form.seo_title || form.title,
      meta_description: form.meta_description || form.excerpt || form.content.slice(0, 160),
      keywords: form.keywords, status: form.status,
      ...(editingPost ? {} : { created_by: user?.id }),
    };

    let error;
    if (editingPost?.id) {
      ({ error } = await supabase.from(table).update(payload as any).eq('id', editingPost.id));
    } else {
      ({ error } = await supabase.from(table).insert(payload as any));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingPost ? 'Post updated!' : 'Post created!');
    setDialogOpen(false);
    fetchAll();
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Post deleted'); fetchAll(); }
  };

  const publishPost = async (id: string) => {
    const { error } = await supabase.from(table).update({ status: 'published' } as any).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Published!'); fetchAll(); }
  };

  const generateContent = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: activeTab === 'history' ? 'history' : 'tip' }
      });
      if (error) throw error;
      if (data) {
        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          content: data.content || prev.content,
          excerpt: data.excerpt || prev.excerpt,
          seo_title: data.seo_title || prev.seo_title,
          meta_description: data.meta_description || prev.meta_description,
          keywords: data.keywords || prev.keywords,
        }));
        toast.success('Content generated! Review and publish.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate content');
    }
    setGenerating(false);
  };

  const posts = activeTab === 'history' ? historyPosts : dailyTips;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="history" className="gap-1.5"><Calendar className="h-4 w-4" /> History Posts</TabsTrigger>
            <TabsTrigger value="tips" className="gap-1.5"><Lightbulb className="h-4 w-4" /> Daily Tips</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { openNew(); generateContent(); }} disabled={generating}>
              <Sparkles className="h-4 w-4 mr-1" /> {generating ? 'Generating...' : "Generate Today's Content"}
            </Button>
            <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Post</Button>
          </div>
        </div>

        <TabsContent value="history">
          <PostList posts={posts} onEdit={openEdit} onDelete={deletePost} onPublish={publishPost} loading={loading} />
        </TabsContent>
        <TabsContent value="tips">
          <PostList posts={posts} onEdit={openEdit} onDelete={deletePost} onPublish={publishPost} loading={loading} />
        </TabsContent>
      </Tabs>

      {/* Post Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'New Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Content</Label>
              <Button size="sm" variant="ghost" onClick={generateContent} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                AI Generate
              </Button>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Post title" />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} placeholder="Write your article..." />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} placeholder="Short summary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Author</Label>
                <Input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} />
              </div>
              <div>
                <Label>Publish Date</Label>
                <Input type="date" value={form.publish_date} onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Featured Image URL</Label>
              <Input value={form.featured_image} onChange={e => setForm(f => ({ ...f, featured_image: e.target.value }))} placeholder="https://..." />
            </div>
            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer font-medium text-sm">SEO Settings</summary>
              <div className="space-y-3 mt-3">
                <div>
                  <Label>SEO Title</Label>
                  <Input value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} placeholder="SEO optimized title" />
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} rows={2} placeholder="Meta description (160 chars)" />
                </div>
                <div>
                  <Label>Keywords</Label>
                  <Input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="keyword1, keyword2" />
                </div>
              </div>
            </details>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setForm(f => ({ ...f, status: 'draft' })); savePost(); }} disabled={saving}>
              <FileText className="h-4 w-4 mr-1" /> Save Draft
            </Button>
            <Button onClick={() => { setForm(f => ({ ...f, status: 'published' })); setTimeout(savePost, 0); }} disabled={saving}>
              <Send className="h-4 w-4 mr-1" /> Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostList({ posts, onEdit, onDelete, onPublish, loading }: {
  posts: Post[]; onEdit: (p: Post) => void; onDelete: (id: string) => void;
  onPublish: (id: string) => void; loading: boolean;
}) {
  if (loading) return <div className="text-center py-10 text-muted-foreground">Loading...</div>;
  if (posts.length === 0) return <div className="text-center py-10 text-muted-foreground">No posts yet. Create one!</div>;
  return (
    <div className="space-y-3">
      {posts.map(post => (
        <Card key={post.id}>
          <CardContent className="flex items-center justify-between gap-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{post.title}</h3>
                <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="text-xs shrink-0">
                  {post.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(post.publish_date), 'MMM d, yyyy')} · {post.author_name} · ❤️ {post.likes_count}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {post.status === 'draft' && (
                <Button size="sm" variant="ghost" onClick={() => onPublish(post.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => onEdit(post)}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete post?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(post.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
