import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface Proposal {
  id: string;
  question_id: string;
  proposed_question: string;
  proposed_domain: string;
  proposed_module: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
}

interface OriginalQ {
  id: string; question: string; domain: string; module: string | null;
}

export default function EditProposalsAdmin() {
  const [items, setItems] = useState<Proposal[] | null>(null);
  const [originals, setOriginals] = useState<Record<string, OriginalQ>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "resolved">("pending");

  async function load() {
    const { data, error } = await supabase
      .from("question_edit_proposals")
      .select("id,question_id,proposed_question,proposed_domain,proposed_module,reason,status,created_at,reviewed_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast({ title: "Failed to load proposals", description: error.message, variant: "destructive" }); return; }
    const list = (data as Proposal[]) ?? [];
    setItems(list);
    const ids = Array.from(new Set(list.map((p) => p.question_id)));
    if (ids.length) {
      const { data: qs } = await supabase
        .from("questions").select("id,question,domain,module").in("id", ids);
      const map: Record<string, OriginalQ> = {};
      (qs as OriginalQ[] | null)?.forEach((q) => { map[q.id] = q; });
      setOriginals(map);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(p: Proposal) {
    setBusy(p.id);
    const { error } = await supabase.rpc("apply_question_edit_proposal", {
      _proposal_id: p.id, _admin_note: "",
    });
    setBusy(null);
    if (error) { toast({ title: "Approve failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Edit approved & applied" });
    load();
  }

  async function reject(p: Proposal) {
    setBusy(p.id);
    const { error } = await supabase.from("question_edit_proposals")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    setBusy(null);
    if (error) { toast({ title: "Reject failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Proposal rejected" });
    load();
  }

  if (!items) {
    return <div className="grid gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  const pending = items.filter((p) => p.status === "pending");
  const resolved = items.filter((p) => p.status !== "pending");
  const list = tab === "pending" ? pending : resolved;

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "resolved")}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolved.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 space-y-3">
          {list.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No {tab} proposals.</CardContent></Card>
          ) : list.map((p) => {
            const orig = originals[p.question_id];
            return (
              <Card key={p.id} className="border-border/60">
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{p.proposed_domain}</Badge>
                    {p.proposed_module && <Badge variant="outline">{p.proposed_module}</Badge>}
                    <Badge variant={p.status === "approved" ? "default" : p.status === "rejected" ? "destructive" : "outline"}>
                      {p.status}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  {orig && (
                    <div className="rounded-md border border-border/50 bg-muted/30 p-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Original ({orig.domain}{orig.module ? ` · ${orig.module}` : ""})</p>
                      <p className="whitespace-pre-wrap text-sm">{orig.question}</p>
                    </div>
                  )}
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                    <p className="mb-1 text-xs font-medium text-primary">Proposed</p>
                    <p className="whitespace-pre-wrap text-sm">{p.proposed_question}</p>
                  </div>
                  {p.reason && <p className="text-xs text-muted-foreground"><strong>Reason:</strong> {p.reason}</p>}
                  {p.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(p)} disabled={busy === p.id}>
                        {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve & apply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reject(p)} disabled={busy === p.id}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
