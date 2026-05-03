import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, BookmarkCheck, ImageIcon, Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import SEOHead from "@/components/SEOHead";
import EditProposalDialog from "@/components/questionHub/EditProposalDialog";
import EditProposalsAdmin from "@/components/questionHub/EditProposalsAdmin";
import {
  DOMAINS,
  type Domain,
  autoCorrect,
  detectDomain,
  normalizeText,
  questionSchema,
} from "@/lib/questionHub";

interface QuestionRow {
  id: string;
  question: string;
  domain: string;
  module: string | null;
  screenshot_url: string | null;
  status: string;
  source: string;
  created_at: string;
}

const BOOKMARK_KEY = "dmt_qh_bookmarks";

function loadBookmarks(): string[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]"); } catch { return []; }
}

export default function QuestionHub() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [items, setItems] = useState<QuestionRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState<"ALL" | Domain>("ALL");
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);
  const [open, setOpen] = useState(false);

  async function fetchQuestions() {
    const { data, error } = await supabase
      .from("questions")
      .select("id,question,domain,module,screenshot_url,status,source,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Failed to load questions", description: error.message, variant: "destructive" });
      return;
    }
    setItems((data as QuestionRow[]) ?? []);
  }

  useEffect(() => { fetchQuestions(); }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (filterDomain !== "ALL" && it.domain !== filterDomain) return false;
      if (q && !it.question.toLowerCase().includes(q) && !(it.module || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, filterDomain]);

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleAdminDelete(id: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Question deleted" });
    setItems((prev) => prev?.filter((q) => q.id !== id) ?? null);
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Student Question Hub – Community Programming Q&A | DayMyTime"
        description="Upload, browse, and verify student programming questions across HTML, JavaScript, ML, OS, Cyber Security and more. OCR-powered uploads."
        canonical="https://daymytime.com/question-hub"
      />
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <UploadDialog open={open} setOpen={setOpen} onCreated={fetchQuestions} userId={user?.id ?? null} />
        </div>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Student Question Hub</h1>
          <p className="mt-2 text-muted-foreground">
            Community-powered programming questions. Upload screenshots, extract text with OCR, and browse the newest first.
          </p>
        </header>

        {isAdmin && (
          <section className="mb-8 rounded-lg border border-border/60 bg-card/50 p-4">
            <h2 className="mb-3 text-lg font-semibold">Edit Proposals (Admin)</h2>
            <EditProposalsAdmin />
          </section>
        )}

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="pl-9"
            />
          </div>
          <Select value={filterDomain} onValueChange={(v) => setFilterDomain(v as "ALL" | Domain)}>
            <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Domains</SelectItem>
              {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setOpen(true)} className="md:hidden">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {!filtered ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            No questions yet. Be the first to add one!
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((q) => (
              <Card key={q.id} className="border-border/60 transition hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{q.domain}</Badge>
                    {q.module && <Badge variant="outline">{q.module}</Badge>}
                    {q.status === "needs_review" && <Badge variant="destructive">Needs Review</Badge>}
                    {q.source === "ocr" && <Badge variant="outline" className="gap-1"><ImageIcon className="h-3 w-3" /> OCR</Badge>}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{q.question}</p>
                  {q.screenshot_url && (
                    <a href={q.screenshot_url} target="_blank" rel="noreferrer" className="mt-3 block">
                      <img src={q.screenshot_url} alt="Question screenshot" loading="lazy" className="max-h-48 rounded-md border border-border/60 object-contain" />
                    </a>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => toggleBookmark(q.id)}>
                      {bookmarks.includes(q.id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      {bookmarks.includes(q.id) ? "Saved" : "Save"}
                    </Button>
                    <EditProposalDialog
                      questionId={q.id}
                      initial={{ question: q.question, domain: q.domain, module: q.module }}
                    />
                    {isAdmin && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleAdminDelete(q.id)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Upload Dialog ---------------- */

function UploadDialog({
  open, setOpen, onCreated, userId,
}: { open: boolean; setOpen: (v: boolean) => void; onCreated: () => void; userId: string | null }) {
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState<Domain | "">("");
  const [module, setModule] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<Domain | null>(null);

  function reset() {
    setQuestion(""); setDomain(""); setModule("");
    setFile(null); setPreviewUrl(null); setSuggestion(null);
  }

  async function runOCR(f: File) {
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setOcrLoading(true);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(f, "eng");
      const cleaned = autoCorrect(data.text || "");
      if (cleaned) {
        setQuestion((prev) => (prev ? prev + "\n" + cleaned : cleaned));
        toast({ title: "Text extracted", description: "Edit before submitting." });
      } else {
        toast({ title: "No text detected", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "OCR failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setOcrLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    runOCR(f);
  }

  // Auto detect on blur if no domain selected
  function handleBlurDetect() {
    if (domain || !question.trim()) return;
    const detected = detectDomain(question);
    setSuggestion(detected);
  }

  async function handleSubmit() {
    const corrected = autoCorrect(question);
    let finalDomain: Domain = (domain || suggestion || "OTHERS") as Domain;
    let status: "approved" | "needs_review" = "approved";
    if (!domain && !suggestion) status = "needs_review";

    const parsed = questionSchema.safeParse({
      question: corrected,
      domain: finalDomain,
      module: module.trim(),
      screenshot_url: null,
    });
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message ?? "Check your inputs",
        variant: "destructive",
      });
      return;
    }

    const normalized = normalizeText(corrected);
    setSubmitting(true);
    try {
      // Duplicate check (case-insensitive via normalized_text unique index)
      const { data: dup } = await supabase
        .from("questions").select("id").eq("normalized_text", normalized).maybeSingle();
      if (dup) {
        toast({ title: "Duplicate", description: "This question already exists.", variant: "destructive" });
        return;
      }

      let screenshot_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `q/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("question-images").upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        screenshot_url = supabase.storage.from("question-images").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from("questions").insert({
        question: corrected,
        normalized_text: normalized,
        domain: finalDomain,
        module: module.trim(),
        screenshot_url,
        source: file ? "ocr" : "manual",
        status,
        submitted_by: userId,
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Duplicate", description: "This question already exists.", variant: "destructive" });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: "Question submitted!", description: status === "needs_review" ? "Marked as Needs Review." : undefined });
      reset(); setOpen(false); onCreated();
    } catch (e) {
      toast({ title: "Submission failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="hidden md:inline-flex"><Plus className="h-4 w-4" /> Add Question</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a Question</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Domain</label>
              <Select value={domain} onValueChange={(v) => { setDomain(v as Domain); setSuggestion(null); }}>
                <SelectTrigger><SelectValue placeholder="Select or auto-detect" /></SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Module / Week</label>
              <Input value={module} onChange={(e) => setModule(e.target.value)} placeholder="e.g. Week 3" maxLength={120} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Screenshot (optional)</label>
            <Input type="file" accept="image/*" onChange={handleFileChange} disabled={ocrLoading} />
            {ocrLoading && (
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Extracting text via OCR...
              </p>
            )}
            {previewUrl && (
              <img src={previewUrl} alt="preview" className="mt-2 max-h-40 rounded-md border border-border/60 object-contain" />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Question</label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onBlur={handleBlurDetect}
              placeholder="Paste or type the question..."
              rows={6}
              maxLength={5000}
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">{question.length}/5000</div>
          </div>

          {!domain && suggestion && (
            <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>We detected this as <strong>{suggestion}</strong>.</span>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setDomain(suggestion); setSuggestion(null); }}>
                Confirm
              </Button>
            </div>
          )}
          {!domain && !suggestion && question.trim().length > 10 && (
            <p className="text-xs text-muted-foreground">
              Tip: Leave domain blank to auto-detect, or it will be marked as "Needs Review".
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || ocrLoading || !question.trim()}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
