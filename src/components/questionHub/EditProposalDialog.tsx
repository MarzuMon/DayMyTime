import { useState } from "react";
import { Loader2, PencilLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DOMAINS, type Domain, autoCorrect, normalizeText, questionSchema } from "@/lib/questionHub";

interface Props {
  questionId: string;
  initial: { question: string; domain: string; module: string | null };
}

export default function EditProposalDialog({ questionId, initial }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial.question);
  const [domain, setDomain] = useState<Domain>((initial.domain as Domain) || "OTHERS");
  const [module, setModule] = useState(initial.module ?? "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const corrected = autoCorrect(text);
    const parsed = questionSchema.safeParse({
      question: corrected, domain, module: module.trim(), screenshot_url: null,
    });
    if (!parsed.success) {
      toast({ title: "Invalid edit", description: parsed.error.issues[0]?.message ?? "", variant: "destructive" });
      return;
    }
    const normalized = normalizeText(corrected);
    if (
      corrected === initial.question &&
      domain === (initial.domain as Domain) &&
      module.trim() === (initial.module ?? "")
    ) {
      toast({ title: "No changes", description: "Modify something before submitting.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("question_edit_proposals").insert({
        question_id: questionId,
        proposed_question: corrected,
        proposed_normalized_text: normalized,
        proposed_domain: domain,
        proposed_module: module.trim(),
        reason: reason.trim().slice(0, 500),
        submitted_by: user?.id ?? null,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "Edit submitted", description: "An admin will review your proposal." });
      setOpen(false); setReason("");
    } catch (e) {
      toast({ title: "Submission failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><PencilLine className="h-4 w-4" /> Suggest edit</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Suggest an Edit</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Domain</label>
              <Select value={domain} onValueChange={(v) => setDomain(v as Domain)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Module / Week</label>
              <Input value={module} onChange={(e) => setModule(e.target.value)} maxLength={120} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Question</label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} maxLength={5000} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reason (optional)</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Typo, clearer wording, wrong domain..." maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !text.trim()}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
