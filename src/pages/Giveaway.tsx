import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Upload, Phone, Mail, ArrowLeft, Moon, Sun, Trophy, Users, CheckCircle2, Image as ImageIcon, X, Heart, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, where, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { z } from 'zod';
import SEOHead from '@/components/SEOHead';

const formSchema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255),
  phone: z.string().trim().min(10, 'Phone must be at least 10 digits').max(15, 'Phone is too long').regex(/^[+\d\s-]+$/, 'Invalid phone number'),
});

interface Winner {
  id: string;
  imageURL: string;
  videoURL?: string;
  name?: string;
  createdAt: string;
}

interface GiveawayComment {
  id: string;
  userEmail: string;
  commentText: string;
  createdAt: string;
}

export default function Giveaway() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [comments, setComments] = useState<GiveawayComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCount();
    fetchWinners();
    fetchComments();
    checkSubscriber();
    checkLiked();
  }, [user]);

  const fetchCount = async () => {
    try {
      const metaRef = doc(db, 'giveaway_meta', 'config');
      const metaSnap = await getDoc(metaRef);
      const startCount = metaSnap.exists() ? (metaSnap.data().startCount || 0) : 0;

      const snap = await getDocs(collection(db, 'contributions'));
      setParticipantCount(startCount + snap.size);
    } catch {
      setParticipantCount(0);
    }
  };

  const fetchWinners = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'winners'), orderBy('createdAt', 'desc')));
      setWinners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Winner)));
    } catch {
      /* silent */
    }
  };

  const fetchComments = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'comments'), where('pageId', '==', 'giveaway'), orderBy('createdAt', 'desc')));
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as GiveawayComment)));
    } catch {
      /* silent */
    }
  };

  const checkSubscriber = async () => {
    if (!user?.email) return;
    const { data } = await supabase.from('newsletter_followers').select('id').eq('email', user.email).maybeSingle();
    setIsSubscriber(!!data);
  };

  const checkLiked = async () => {
    if (!user) return;
    try {
      const likeRef = doc(db, 'likes', `giveaway_${user.id}`);
      const snap = await getDoc(likeRef);
      setLiked(snap.exists());
    } catch {/* */}

    try {
      const snap = await getDocs(query(collection(db, 'likes'), where('pageId', '==', 'giveaway')));
      setLikeCount(snap.size);
    } catch {/* */}
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      setImage(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch {
      toast.error('Failed to compress image');
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse({ email, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => { fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      return;
    }

    if (!image) {
      toast.error('Please upload a WhatsApp status screenshot');
      return;
    }

    setSubmitting(true);
    try {
      // Upload image to Firebase Storage
      const fileName = `contributions/${Date.now()}_${image.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, image);
      const imageURL = await getDownloadURL(storageRef);

      // Save to Firestore
      await addDoc(collection(db, 'contributions'), {
        email: result.data.email,
        phone: result.data.phone,
        imageURL,
        createdAt: new Date().toISOString(),
      });

      setSubmitted(true);
      setEmail('');
      setPhone('');
      removeImage();
      fetchCount();
      toast.success('🎉 Entry submitted successfully!');
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async () => {
    if (!user) { toast.error('Please sign in to like'); return; }
    if (!isSubscriber) { toast.error('Subscribe to the newsletter to like'); return; }

    try {
      const likeRef = doc(db, 'likes', `giveaway_${user.id}`);
      if (liked) {
        await deleteDoc(likeRef);
        setLiked(false);
        setLikeCount(c => c - 1);
      } else {
        await setDoc(likeRef, { pageId: 'giveaway', userId: user.id, userEmail: user.email, liked: true, createdAt: new Date().toISOString() });
        setLiked(true);
        setLikeCount(c => c + 1);
      }
    } catch {
      toast.error('Failed to update like');
    }
  };

  const addComment = async () => {
    if (!user) { toast.error('Please sign in to comment'); return; }
    if (!isSubscriber) { toast.error('Subscribe to the newsletter to comment'); return; }
    if (!commentText.trim()) return;

    try {
      await addDoc(collection(db, 'comments'), {
        pageId: 'giveaway',
        userEmail: user.email || 'Anonymous',
        commentText: commentText.trim(),
        createdAt: new Date().toISOString(),
      });
      setCommentText('');
      fetchComments();
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Giveaway – DayMyTime | Win Exciting Prizes"
        description="Participate in the DayMyTime giveaway. Upload your WhatsApp status screenshot to enter and win exciting prizes!"
        canonical="https://daymytime.com/giveaway"
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => navigate('/')} className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <img src="/images/logo-icon.webp" alt="DayMyTime" className="h-8 w-8 rounded-lg" width="32" height="32" />
              <span className="font-display font-bold">DayMyTime</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} className="rounded-xl">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/auth')} className="rounded-xl">Sign In</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-xs font-semibold text-primary mb-6">
            <Gift className="h-3.5 w-3.5" /> Active Giveaway
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Win Exciting <span className="text-gradient">Prizes!</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-6">
            Share DayMyTime on your WhatsApp Status, take a screenshot, and submit it here to enter the giveaway.
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-xl">{participantCount}</span>
              <span className="text-muted-foreground">Participants</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12">
        {/* Submission Form */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                <h2 className="font-display text-2xl font-bold">Entry Submitted! 🎉</h2>
                <p className="text-muted-foreground">Thank you for participating. Winners will be announced soon!</p>
                <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl">Submit Another Entry</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" /> Submit Your Entry
                </h2>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">WhatsApp Status Screenshot *</label>
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl border" />
                      <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                      <span className="text-xs text-muted-foreground mt-1">Auto-compressed to &lt;200KB</span>
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="pl-10 rounded-xl" />
                  </div>
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className="pl-10 rounded-xl" />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl gradient-primary border-0 text-primary-foreground">
                  {submitting ? 'Submitting...' : 'Submit Entry 🎯'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Like */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={toggleLike} className={`rounded-xl gap-2 ${liked ? 'text-destructive' : ''}`}>
            <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} /> {likeCount}
          </Button>
        </div>

        {/* Winners Section */}
        {winners.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2 mb-6">
              <Trophy className="h-6 w-6 text-warning" /> Winners
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {winners.map(w => (
                <Card key={w.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {w.videoURL ? (
                      <video src={w.videoURL} controls className="w-full aspect-video object-cover" preload="metadata" />
                    ) : (
                      <img src={w.imageURL} alt={w.name || 'Winner'} className="w-full aspect-square object-cover" loading="lazy" />
                    )}
                    {w.name && <p className="text-sm font-medium p-3">{w.name}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Comments Section */}
        <section>
          <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-primary" /> Comments ({comments.length})
          </h2>

          {isSubscriber && user ? (
            <div className="flex gap-2 mb-4">
              <Textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                className="rounded-xl"
              />
              <Button onClick={addComment} size="icon" className="h-auto rounded-xl gradient-primary border-0 text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4 p-3 rounded-xl bg-muted/50">
              {user ? 'Subscribe to the newsletter to comment.' : 'Sign in and subscribe to comment.'}
            </p>
          )}

          <div className="space-y-3">
            {comments.map(c => (
              <Card key={c.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{c.userEmail}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm">{c.commentText}</p>
                </CardContent>
              </Card>
            ))}
            {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-4 text-sm">
            <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="/todaytip" className="text-muted-foreground hover:text-foreground transition-colors">Tips</a>
            <a href="/history" className="text-muted-foreground hover:text-foreground transition-colors">History</a>
            <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DayMyTime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
