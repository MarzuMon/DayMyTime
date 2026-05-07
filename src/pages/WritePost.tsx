import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SEOHead from '@/components/SEOHead';
import RichTextEditor, { type RichTextEditorHandle } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { generateSlug } from '@/seo/slugGenerator';
import { canPostToday, recordPost, looksLikeSpam } from '@/lib/rateLimit';

const schema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
  excerpt: z.string().trim().max(300).optional(),
  content: z.string().min(20, 'Post content must be at least 20 characters'),
  category: z.enum(['productivity', 'history', 'tips', 'general']),
});

type Category = z.infer<typeof schema>['category'];

export default function WritePost() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('productivity');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);

  const featuredInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isEdit || !user) return;
    (async () => {
      const { data } = await supabase.from('user_posts').select('*').eq('id', id!).maybeSingle();
      if (!data) {
        toast.error('Post not found');
        navigate('/community');
        return;
      }
      if (data.author_id !== user.id) {
        toast.error('You can only edit your own posts');
        navigate('/community');
        return;
      }
      setTitle(data.title);
      setExcerpt(data.excerpt || '');
      setContent(data.content || '');
      setCategory((data.category as Category) || 'productivity');
      setFeaturedImage(data.featured_image);
      setOriginalSlug(data.slug);
    })();
  }, [id, isEdit, user, navigate]);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return null;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `community/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('content-images').upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    });
    if (error) {
      toast.error('Upload failed: ' + error.message);
      return null;
    }
    const { data } = supabase.storage.from('content-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) setFeaturedImage(url);
    e.target.value = '';
  };

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) editorRef.current?.insertImage(url);
    e.target.value = '';
  };

  const ensureUniqueSlug = async (base: string): Promise<string> => {
    let candidate = base;
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (isEdit && candidate === originalSlug) return candidate;
      const { data } = await supabase.from('user_posts').select('id').eq('slug', candidate).maybeSingle();
      if (!data) return candidate;
      n += 1;
      candidate = `${base}-${n}`;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ title, excerpt: excerpt || undefined, content, category });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (looksLikeSpam(`${title} ${content}`)) {
      toast.error('Your post was blocked by our spam filter.');
      return;
    }
    if (!isEdit) {
      const { ok, remaining } = canPostToday(user.id, 5);
      if (!ok) {
        toast.error('Daily post limit reached (5/day). Try again tomorrow.');
        return;
      }
      if (remaining <= 2) toast.message(`${remaining} post${remaining === 1 ? '' : 's'} left today`);
    }
    setSaving(true);
    const baseSlug = generateSlug(title) || `post-${Date.now()}`;
    const finalSlug = await ensureUniqueSlug(baseSlug);
    const authorName = (user.user_metadata as any)?.display_name || user.email?.split('@')[0] || 'Anonymous';
    const computedExcerpt = excerpt?.trim() || content.replace(/<[^>]+>/g, '').slice(0, 200);

    if (isEdit) {
      const { error } = await supabase.from('user_posts').update({
        title, slug: finalSlug, content, excerpt: computedExcerpt,
        featured_image: featuredImage, category,
      }).eq('id', id!);
      setSaving(false);
      if (error) { toast.error('Failed: ' + error.message); return; }
      toast.success('Post updated');
      navigate(`/community/${finalSlug}`);
    } else {
      const { error } = await supabase.from('user_posts').insert({
        author_id: user.id, author_name: authorName,
        title, slug: finalSlug, content, excerpt: computedExcerpt,
        featured_image: featuredImage, category, status: 'published',
      });
      setSaving(false);
      if (error) { toast.error('Failed: ' + error.message); return; }
      recordPost(user.id);
      toast.success('Post published!');
      navigate(`/community/${finalSlug}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={isEdit ? 'Edit Post | DayMyTime Community' : 'Write a Post | DayMyTime Community'}
        description="Share your story with the DayMyTime community."
        noindex
      />
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={() => navigate('/community')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Community
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving || uploading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {isEdit ? 'Update' : 'Publish'}
          </Button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 pt-20 pb-20">
        <h1 className="font-display text-2xl font-bold mb-6">
          {isEdit ? 'Edit your post' : 'Write a new post'}
        </h1>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="An eye-catching title…" maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="tips">Tips</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Featured image</Label>
            {featuredImage ? (
              <div className="relative">
                <img src={featuredImage} alt="Featured" className="w-full max-h-72 object-cover rounded-lg" />
                <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => setFeaturedImage(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full h-32 border-dashed"
                onClick={() => featuredInputRef.current?.click()} disabled={uploading}>
                {uploading
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <span className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                      <ImagePlus className="h-5 w-5" /> Click to upload (max 5MB)
                    </span>}
              </Button>
            )}
            <input ref={featuredInputRef} type="file" accept="image/*" hidden onChange={handleFeaturedUpload} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Short description (optional)</Label>
            <Textarea id="excerpt" value={excerpt} onChange={e => setExcerpt(e.target.value)}
              placeholder="A 1-2 sentence summary shown on the listing page" maxLength={300} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              ref={editorRef}
              value={content}
              onChange={setContent}
              onImageUploadRequest={() => inlineInputRef.current?.click()}
            />
            <input ref={inlineInputRef} type="file" accept="image/*" hidden onChange={handleInlineUpload} />
          </div>
        </div>
      </main>
    </div>
  );
}
