import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gift, Upload, Phone, Mail, ArrowLeft, Moon, Sun, Trophy, Users,
  CheckCircle2, X, Heart, MessageSquare, Send, Share2, Award, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { z } from "zod";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";

const formSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(15, "Phone is too long").regex(/^[+\d\s-]+$/, "Invalid phone number"),
});

interface Winner { id: string; image_url: string | null; video_url: string | null; name: string; created_at: string; }
interface GiveawayComment { id: string; userEmail: string; commentText: string; createdAt: string; }
interface GiveawayConfig { start_count: number; active_image_url: string | null; expiry_date: string | null; is_finished: boolean; }

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
};

export default function Giveaway() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [comments, setComments] = useState<GiveawayComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<GiveawayConfig>({ start_count: 0, active_image_url: null, expiry_date: null, is_finished: false });
  const [randomLink, setRandomLink] = useState("");

  useEffect(() => {
    fetchConfig();
    fetchCount();
    fetchWinners();
    fetchComments();
    fetchRandomLink();
    checkSubscriber();
    checkLiked();
  }, [user]);

  const fetchConfig = async () => {
    const { data } = await supabase.from("giveaway_config").select("*").limit(1).maybeSingle();
    if (data) setConfig(data as unknown as GiveawayConfig);
  };

  const fetchCount = async () => {
    const { data, error } = await supabase.rpc("get_giveaway_count");
    if (!error && data !== null) setParticipantCount(data);
  };

  const fetchWinners = async () => {
    const { data } = await supabase.from("giveaway_winners").select("*").order("created_at", { ascending: false });
    if (data) setWinners(data as unknown as Winner[]);
  };

  const fetchComments = async () => {
    const { data } = await supabase.from("post_comments").select("*").eq("post_type", "giveaway").eq("post_id", "00000000-0000-0000-0000-000000000000").order("created_at", { ascending: false });
    if (data) setComments(data.map(c => ({ id: c.id, userEmail: c.user_name, commentText: c.content, createdAt: c.created_at })));
  };

  const fetchRandomLink = async () => {
    try {
      const usesTips = Math.random() > 0.5;
      const table = usesTips ? "daily_tips" : "history_posts";
      const { data } = await supabase.from(table).select("slug").eq("status", "published").order("publish_date", { ascending: false }).limit(10);
      if (data && data.length > 0) {
        const item = data[Math.floor(Math.random() * data.length)];
        const prefix = usesTips ? "todaytip" : "history";
        setRandomLink(`https://daymytime.com/${prefix}/${item.slug}`);
      }
    } catch { /* silent */ }
  };

  const checkSubscriber = async () => {
    if (!user?.email) return;
    const { data } = await supabase.from("newsletter_followers").select("id").eq("email", user.email).maybeSingle();
    setIsSubscriber(!!data);
  };

  const checkLiked = async () => {
    if (!user) return;
    const { data } = await supabase.from("post_likes").select("id").eq("post_type", "giveaway").eq("post_id", "00000000-0000-0000-0000-000000000000").eq("user_id", user.id).maybeSingle();
    setLiked(!!data);
    const { count } = await supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_type", "giveaway").eq("post_id", "00000000-0000-0000-0000-000000000000");
    setLikeCount(count || 0);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1920, useWebWorker: true });
      setImage(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch { toast.error("Failed to compress image"); }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const isExpired = config.expiry_date ? new Date(config.expiry_date) < new Date() : false;
  const isFinished = config.is_finished || isExpired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (isFinished) { toast.error("This giveaway has ended"); return; }
    const result = formSchema.safeParse({ email, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => { fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    if (!image) { toast.error("Please upload a WhatsApp status screenshot"); return; }

    setSubmitting(true);
    try {
      const fileName = `giveaway/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${image.type.split("/")[1] || "jpg"}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from("images").upload(fileName, image, { contentType: image.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(uploadData.path);

      const { error: insertError } = await supabase.from("giveaway_contributions").insert({
        email: result.data.email,
        phone: result.data.phone,
        image_url: urlData.publicUrl,
      });
      if (insertError) throw insertError;

      setSubmitted(true);
      setEmail(""); setPhone(""); removeImage();
      fetchCount();
      toast.success("🎉 Entry submitted successfully!");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Submission failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  const toggleLike = async () => {
    if (!user) { toast.error("Please sign in to like"); return; }
    if (!isSubscriber) { toast.error("Subscribe to the newsletter to like"); return; }
    const postId = "00000000-0000-0000-0000-000000000000";
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_type", "giveaway").eq("post_id", postId).eq("user_id", user.id);
      setLiked(false); setLikeCount(c => c - 1);
    } else {
      await supabase.from("post_likes").insert({ post_type: "giveaway", post_id: postId, user_id: user.id });
      setLiked(true); setLikeCount(c => c + 1);
    }
  };

  const addComment = async () => {
    if (!user) { toast.error("Please sign in to comment"); return; }
    if (!isSubscriber) { toast.error("Subscribe to the newsletter to comment"); return; }
    if (!commentText.trim()) return;
    const { error } = await supabase.from("post_comments").insert({
      post_type: "giveaway",
      post_id: "00000000-0000-0000-0000-000000000000",
      user_id: user.id,
      user_name: user.email || "Anonymous",
      content: commentText.trim(),
    });
    if (error) { toast.error("Failed to add comment"); return; }
    setCommentText("");
    fetchComments();
    toast.success("Comment added!");
  };

  const shareOnWhatsApp = () => {
    const msg = `🔥 DayMyTime Giveaway!\n₹500 Amazon Voucher നേടാനുള്ള അവസരം! 🎁\n\nഞാൻ ഇതിനകം പങ്കെടുത്തു 😍\nനിങ്ങളും ഉടൻ join ചെയ്യൂ 👇\n\n👉 https://daymytime.com/giveaway\n\nഇന്ന് ഒരു സ്പെഷ്യൽ ടിപ്പ് കൂടി നോക്കൂ:\n👉 ${randomLink || "https://daymytime.com/todaytip"}\n\nവേഗം join ചെയ്യൂ! 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title="Giveaway – DayMyTime | Win Exciting Prizes" description="Participate in the DayMyTime giveaway. Upload your WhatsApp status screenshot to enter and win exciting prizes!" canonical="https://daymytime.com/giveaway" image={config.active_image_url || undefined} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => navigate("/")}><ArrowLeft className="h-4 w-4 mr-1" /> Home</Button>
            <img src="/images/logo-icon.webp" alt="DayMyTime" className="h-7 w-7 rounded-lg" width="28" height="28" />
            <span className="font-display font-bold text-sm">DayMyTime</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate("/todaytip")} className="text-xs">Tips</Button>
            <Button size="sm" variant="ghost" onClick={() => navigate("/history")} className="text-xs">History</Button>
            <Button size="icon" variant="ghost" onClick={toggleTheme} className="h-8 w-8">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        {/* 1. Active Giveaway Banner */}
        {config.active_image_url && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex justify-center bg-background">
            <img src={config.active_image_url} alt="Active Giveaway" className="w-full max-w-4xl h-auto max-h-[50vh] object-contain" loading="eager" fetchPriority="high" />
            {isFinished && (
              <div className="bg-destructive/90 text-destructive-foreground text-center py-2 text-sm font-semibold">
                🏁 This giveaway has ended. Stay tuned for the next one!
              </div>
            )}
          </motion.section>
        )}

        {/* 2. WhatsApp Share + Participant Count */}
        <section className="max-w-4xl mx-auto px-4 py-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <span className="font-display text-2xl font-bold">{formatCount(participantCount)}</span>
                <span className="text-sm text-muted-foreground ml-2">Participants</span>
              </div>
            </div>
            <Button onClick={shareOnWhatsApp} className="bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-xl gap-2 px-6">
              <Share2 className="h-4 w-4" /> Share on WhatsApp
            </Button>
          </motion.div>
        </section>

        <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12">
          {/* 3. Submit Your Entry */}
          {!isFinished && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-primary/20 overflow-hidden">
                <div className="h-1 w-full gradient-primary" />
                <CardContent className="pt-6">
                  {submitted ? (
                    <div className="text-center py-12 space-y-4">
                      <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                      <h2 className="font-display text-2xl font-bold">Entry Submitted! 🎉</h2>
                      <p className="text-muted-foreground">Thank you for participating. Winners will be announced soon!</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl">Submit Another Entry</Button>
                        <Button onClick={shareOnWhatsApp} className="bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-xl gap-2">
                          <Share2 className="h-4 w-4" /> Share & Earn More Chances
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <h2 className="font-display text-xl font-bold flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" /> Submit Your Entry
                      </h2>
                      <p className="text-sm text-muted-foreground">Share DayMyTime on your WhatsApp Status, take a screenshot, and submit it below.</p>

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

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="pl-10 rounded-xl" />
                        </div>
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Mobile Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className="pl-10 rounded-xl" />
                        </div>
                        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                      </div>

                      <Button type="submit" disabled={submitting || !image} className="w-full h-12 rounded-xl gradient-primary border-0 text-primary-foreground font-semibold">
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Submitting...
                          </span>
                        ) : "Submit 🎯"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 4. Recently Won Prizes */}
          {winners.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2 mb-6">
                <Trophy className="h-6 w-6 text-yellow-500" /> Recently Won Prizes
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {winners.map(w => (
                  <Card key={w.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      {w.video_url ? (
                        <video src={w.video_url} controls className="w-full aspect-video object-cover" preload="metadata" />
                      ) : w.image_url ? (
                        <img src={w.image_url} alt={w.name || "Winner"} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : null}
                      {w.name && (
                        <div className="p-3 flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <p className="text-sm font-medium">{w.name}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          )}


          {/* Like */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={toggleLike} className={`rounded-xl gap-2 ${liked ? "text-destructive" : ""}`}>
              <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} /> {likeCount}
            </Button>
          </div>

          {/* Comments */}
          <section>
            <h2 className="font-display text-xl font-bold flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" /> Comments ({comments.length})
            </h2>
            {isSubscriber && user ? (
              <div className="flex gap-2 mb-4">
                <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..." rows={2} className="rounded-xl flex-1" />
                <Button onClick={addComment} className="rounded-xl gradient-primary border-0 text-primary-foreground px-4 self-end">
                  <Send className="h-4 w-4 mr-1" /> Send
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4 p-3 rounded-xl bg-muted/50">
                {user ? "Subscribe to the newsletter to comment." : "Sign in and subscribe to comment."}
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
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4 text-sm">
              <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="/todaytip" className="text-muted-foreground hover:text-foreground transition-colors">Tips</a>
              <a href="/history" className="text-muted-foreground hover:text-foreground transition-colors">History</a>
              <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DayMyTime. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
