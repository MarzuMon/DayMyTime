import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSetting } from '@/hooks/use-admin-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Plus, Edit, Trash2, Eye, Sparkles, Loader2, Calendar, FileText, Lightbulb, Send,
  Upload, Image, AlignLeft, AlignCenter, AlignRight, Clock, Timer,
  Twitter, Facebook, Linkedin, Instagram, Copy, ExternalLink, BarChart3, Heart
} from 'lucide-react';
import { format } from 'date-fns';

interface Post {
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
  status: string;
  likes_count: number;
  created_at: string;
}

const emptyPost = {
  title: '', content: '', excerpt: '', featured_image: '', featured_image_2: '',
  image_align: 'center',
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

function getPostUrl(post: Post, type: 'history' | 'tips'): string {
  const base = type === 'history' ? '/history' : '/todaytip';
  return `https://daymytime.com${base}/${post.slug}`;
}

function getPreviewUrl(post: Post, type: 'history' | 'tips'): string {
  const base = type === 'history' ? '/history' : '/todaytip';
  return `${base}/${post.slug}`;
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
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const [imageMode1, setImageMode1] = useState<'url' | 'upload'>('url');
  const [imageMode2, setImageMode2] = useState<'url' | 'upload'>('url');
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);

  // Analytics
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [totalViews, setTotalViews] = useState(0);

  // Auto-publish settings
  const { value: autoPublish, save: saveAutoPublish, loading: autoLoading } = useAdminSetting<{
    enabled: boolean;
    time: string;
    history: boolean;
    tips: boolean;
  }>('auto_publish_content', { enabled: false, time: '06:00', history: true, tips: true });

  // Manual scheduling
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduleTime, setScheduleTime] = useState('06:00');
  const [scheduleType, setScheduleType] = useState<'history' | 'tips' | 'both'>('both');
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => { fetchAll(); fetchAnalytics(); }, []);

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

  const fetchAnalytics = async () => {
    const { data } = await supabase.from('page_views').select('post_id');
    if (data) {
      setTotalViews(data.length);
      const counts: Record<string, number> = {};
      data.forEach(v => {
        if (v.post_id) counts[v.post_id] = (counts[v.post_id] || 0) + 1;
      });
      setViewCounts(counts);
    }
  };

  const table = activeTab === 'history' ? 'history_posts' : 'daily_tips';

  const uploadImage = async (file: File, slot: 1 | 2) => {
    const setter = slot === 1 ? setUploading1 : setUploading2;
    setter(true);
    const ext = file.name.split('.').pop();
    const path = `${activeTab}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('content-images').upload(path, file);
    if (error) {
      toast.error('Upload failed: ' + error.message);
      setter(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('content-images').getPublicUrl(path);
    const field = slot === 1 ? 'featured_image' : 'featured_image_2';
    setForm(f => ({ ...f, [field]: urlData.publicUrl }));
    toast.success('Image uploaded!');
    setter(false);
  };

  const openNew = () => {
    setEditingPost(null);
    setForm({ ...emptyPost });
    setImageMode1('url');
    setImageMode2('url');
    setDialogOpen(true);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setForm({
      title: post.title, content: post.content, excerpt: post.excerpt,
      featured_image: post.featured_image || '', featured_image_2: post.featured_image_2 || '',
      image_align: post.image_align || 'center',
      author_name: post.author_name,
      publish_date: post.publish_date, seo_title: post.seo_title || '',
      meta_description: post.meta_description || '', keywords: post.keywords || '',
      status: post.status
    });
    setImageMode1(post.featured_image ? 'url' : 'url');
    setImageMode2(post.featured_image_2 ? 'url' : 'url');
    setDialogOpen(true);
  };

  const savePost = async (overrideStatus?: string) => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    const status = overrideStatus || form.status;
    const slug = generateSlug(form.title, form.publish_date);
    const payload = {
      title: form.title, slug, content: form.content, excerpt: form.excerpt || form.content.slice(0, 160),
      featured_image: form.featured_image || null,
      featured_image_2: form.featured_image_2 || null,
      image_align: form.image_align,
      author_name: form.author_name,
      publish_date: form.publish_date, seo_title: form.seo_title || form.title,
      meta_description: form.meta_description || form.excerpt || form.content.slice(0, 160),
      keywords: form.keywords, status,
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
    toast.success(status === 'published' ? 'Published!' : status === 'scheduled' ? 'Scheduled!' : 'Draft saved!');
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

  const scheduleGeneration = async () => {
    setScheduling(true);
    try {
      const { error } = await supabase.functions.invoke('generate-content', {
        body: {
          type: scheduleType === 'both' ? 'both' : scheduleType === 'history' ? 'history' : 'tip',
          schedule: true,
          publish_date: scheduleDate,
          auto_publish: true,
        }
      });
      if (error) throw error;
      toast.success(`Content scheduled for ${scheduleDate}!`);
      setScheduleDialogOpen(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to schedule content');
    }
    setScheduling(false);
  };

  const copyLink = (post: Post) => {
    const url = getPostUrl(post, activeTab as 'history' | 'tips');
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const sharePost = (post: Post, platform: string) => {
    const url = getPostUrl(post, activeTab as 'history' | 'tips');
    const text = post.title;
    if (platform === 'instagram') {
      navigator.clipboard.writeText(url);
      toast.success('Link copied! Paste it on Instagram.');
      return;
    }
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
      return;
    }
    const links: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    window.open(links[platform], '_blank', 'width=600,height=400');
  };

  const previewPost = (post: Post) => {
    const url = getPreviewUrl(post, activeTab as 'history' | 'tips');
    window.open(url, '_blank');
  };

  const posts = activeTab === 'history' ? historyPosts : dailyTips;
  const allPosts = [...historyPosts, ...dailyTips];
  const publishedCount = allPosts.filter(p => p.status === 'published').length;
  const totalLikes = allPosts.reduce((s, p) => s + p.likes_count, 0);

  return (
    <div className="space-y-4">
      {/* Content Analytics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Content Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-secondary text-center">
              <p className="text-xl font-bold">{allPosts.length}</p>
              <p className="text-xs text-muted-foreground">Total Posts</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary text-center">
              <p className="text-xl font-bold">{publishedCount}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary text-center">
              <p className="text-xl font-bold flex items-center justify-center gap-1"><Heart className="h-4 w-4" />{totalLikes}</p>
              <p className="text-xs text-muted-foreground">Total Likes</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary text-center">
              <p className="text-xl font-bold flex items-center justify-center gap-1"><Eye className="h-4 w-4" />{totalViews}</p>
              <p className="text-xs text-muted-foreground">Page Views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Publish Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4" /> Auto-Publish Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-generate & publish daily</p>
              <p className="text-xs text-muted-foreground">AI generates and publishes content at the scheduled time</p>
            </div>
            <Switch
              checked={autoPublish.enabled}
              onCheckedChange={(checked) => saveAutoPublish({ ...autoPublish, enabled: checked })}
            />
          </div>
          {autoPublish.enabled && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t">
              <div>
                <Label className="text-xs">Time</Label>
                <Input
                  type="time"
                  value={autoPublish.time}
                  onChange={e => saveAutoPublish({ ...autoPublish, time: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoPublish.history}
                  onCheckedChange={(checked) => saveAutoPublish({ ...autoPublish, history: checked })}
                />
                <Label className="text-xs">History</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoPublish.tips}
                  onCheckedChange={(checked) => saveAutoPublish({ ...autoPublish, tips: checked })}
                />
                <Label className="text-xs">Tips</Label>
              </div>
              <Button size="sm" variant="outline" onClick={() => setScheduleDialogOpen(true)}>
                <Clock className="h-3.5 w-3.5 mr-1" /> Schedule Manual
              </Button>
            </div>
          )}
          {!autoPublish.enabled && (
            <Button size="sm" variant="outline" onClick={() => setScheduleDialogOpen(true)}>
              <Clock className="h-3.5 w-3.5 mr-1" /> Schedule Manual Generation
            </Button>
          )}
        </CardContent>
      </Card>

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
          <PostList posts={posts} onEdit={openEdit} onDelete={deletePost} onPublish={publishPost}
            onShare={sharePost} onPreview={previewPost} onCopyLink={copyLink}
            viewCounts={viewCounts} loading={loading} />
        </TabsContent>
        <TabsContent value="tips">
          <PostList posts={posts} onEdit={openEdit} onDelete={deletePost} onPublish={publishPost}
            onShare={sharePost} onPreview={previewPost} onCopyLink={copyLink}
            viewCounts={viewCounts} loading={loading} />
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

            {/* Image 1 */}
            <ImageUploadField
              label="Featured Image 1"
              mode={imageMode1}
              onModeChange={setImageMode1}
              value={form.featured_image}
              onValueChange={(v) => setForm(f => ({ ...f, featured_image: v }))}
              uploading={uploading1}
              fileRef={fileRef1}
              onFileSelect={(file) => uploadImage(file, 1)}
            />

            {/* Image 2 */}
            <ImageUploadField
              label="Featured Image 2"
              mode={imageMode2}
              onModeChange={setImageMode2}
              value={form.featured_image_2}
              onValueChange={(v) => setForm(f => ({ ...f, featured_image_2: v }))}
              uploading={uploading2}
              fileRef={fileRef2}
              onFileSelect={(file) => uploadImage(file, 2)}
            />

            {/* Image Alignment */}
            <div>
              <Label className="mb-2 block">Image Alignment</Label>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map(align => (
                  <Button
                    key={align}
                    size="sm"
                    variant={form.image_align === align ? 'default' : 'outline'}
                    onClick={() => setForm(f => ({ ...f, image_align: align }))}
                    className="gap-1"
                  >
                    {align === 'left' && <AlignLeft className="h-4 w-4" />}
                    {align === 'center' && <AlignCenter className="h-4 w-4" />}
                    {align === 'right' && <AlignRight className="h-4 w-4" />}
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Image Preview */}
            {(form.featured_image || form.featured_image_2) && (
              <div className={`flex gap-3 ${form.image_align === 'center' ? 'justify-center' : form.image_align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {form.featured_image && (
                  <img src={form.featured_image} alt="Preview 1" className="h-24 rounded-lg object-cover" />
                )}
                {form.featured_image_2 && (
                  <img src={form.featured_image_2} alt="Preview 2" className="h-24 rounded-lg object-cover" />
                )}
              </div>
            )}

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
            <Button variant="outline" onClick={() => savePost('draft')} disabled={saving}>
              <FileText className="h-4 w-4 mr-1" /> Save Draft
            </Button>
            <Button variant="secondary" onClick={() => savePost('scheduled')} disabled={saving}>
              <Clock className="h-4 w-4 mr-1" /> Schedule
            </Button>
            <Button onClick={() => savePost('published')} disabled={saving}>
              <Send className="h-4 w-4 mr-1" /> Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Content Generation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
            <div>
              <Label>Content Type</Label>
              <Select value={scheduleType} onValueChange={(v: any) => setScheduleType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both History & Tip</SelectItem>
                  <SelectItem value="history">History Only</SelectItem>
                  <SelectItem value="tips">Tip Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={scheduleGeneration} disabled={scheduling}>
              {scheduling ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Generate & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageUploadField({ label, mode, onModeChange, value, onValueChange, uploading, fileRef, onFileSelect }: {
  label: string; mode: 'url' | 'upload'; onModeChange: (m: 'url' | 'upload') => void;
  value: string; onValueChange: (v: string) => void;
  uploading: boolean; fileRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (f: File) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <div className="flex gap-1">
          <Button size="sm" variant={mode === 'url' ? 'default' : 'ghost'} onClick={() => onModeChange('url')} className="h-6 text-xs px-2">
            URL
          </Button>
          <Button size="sm" variant={mode === 'upload' ? 'default' : 'ghost'} onClick={() => onModeChange('upload')} className="h-6 text-xs px-2">
            <Upload className="h-3 w-3 mr-1" /> Upload
          </Button>
        </div>
      </div>
      {mode === 'url' ? (
        <Input value={value} onChange={e => onValueChange(e.target.value)} placeholder="https://..." />
      ) : (
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
          />
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Image className="h-4 w-4 mr-1" />}
            {uploading ? 'Uploading...' : value ? 'Change Image' : 'Choose Image'}
          </Button>
          {value && <span className="text-xs text-muted-foreground self-center truncate max-w-[120px]">✓ uploaded</span>}
        </div>
      )}
    </div>
  );
}

function PostList({ posts, onEdit, onDelete, onPublish, onShare, onPreview, onCopyLink, viewCounts, loading }: {
  posts: Post[]; onEdit: (p: Post) => void; onDelete: (id: string) => void;
  onPublish: (id: string) => void; onShare: (p: Post, platform: string) => void;
  onPreview: (p: Post) => void; onCopyLink: (p: Post) => void;
  viewCounts: Record<string, number>; loading: boolean;
}) {
  if (loading) return <div className="text-center py-10 text-muted-foreground">Loading...</div>;
  if (posts.length === 0) return <div className="text-center py-10 text-muted-foreground">No posts yet. Create one!</div>;
  return (
    <div className="space-y-3">
      {posts.map(post => (
        <Card key={post.id}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {post.featured_image && (
                  <img src={post.featured_image} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{post.title}</h3>
                    <Badge variant={post.status === 'published' ? 'default' : post.status === 'scheduled' ? 'outline' : 'secondary'} className="text-xs shrink-0">
                      {post.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(post.publish_date), 'MMM d, yyyy')} · {post.author_name} · ❤️ {post.likes_count} · 👁 {viewCounts[post.id] || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                {/* Share buttons */}
                <Button size="sm" variant="ghost" onClick={() => onShare(post, 'twitter')} title="Tweet">
                  <Twitter className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onShare(post, 'facebook')} title="Facebook">
                  <Facebook className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onShare(post, 'linkedin')} title="LinkedIn">
                  <Linkedin className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onShare(post, 'instagram')} title="Instagram">
                  <Instagram className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onCopyLink(post)} title="Copy Link">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onPreview(post)} title="Preview">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                {post.status !== 'published' && (
                  <Button size="sm" variant="ghost" onClick={() => onPublish(post.id)} title="Publish">
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
