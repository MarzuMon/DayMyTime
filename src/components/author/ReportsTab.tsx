import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2, Check, X } from 'lucide-react';

interface Report {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_id: string;
}

export default function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('post_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setReports((data as Report[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const setStatus = async (id: string, status: 'resolved' | 'dismissed') => {
    const { error } = await supabase.from('post_reports').update({ status }).eq('id', id);
    if (error) return toast.error('Failed');
    toast.success(`Marked ${status}`);
    fetchReports();
  };

  const deleteTarget = async (r: Report) => {
    const table = r.target_type === 'post' ? 'user_posts' : 'post_comments';
    const { error } = await supabase.from(table as any).delete().eq('id', r.target_id);
    if (error) return toast.error('Delete failed: ' + error.message);
    await supabase.from('post_reports').update({ status: 'resolved' }).eq('id', r.id);
    toast.success('Deleted and resolved');
    fetchReports();
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading reports...</div>;
  if (reports.length === 0) return <div className="text-sm text-muted-foreground">No reports yet.</div>;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <Card key={r.id}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={r.status === 'pending' ? 'destructive' : 'secondary'}>{r.status}</Badge>
              <Badge variant="outline" className="capitalize">{r.target_type}</Badge>
              <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'MMM d, HH:mm')}</span>
            </div>
            <p className="text-sm"><strong>Target ID:</strong> <code className="text-xs">{r.target_id}</code></p>
            <p className="text-sm"><strong>Reason:</strong> {r.reason || <em className="text-muted-foreground">none provided</em>}</p>
            {r.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="destructive" onClick={() => deleteTarget(r)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete {r.target_type}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'resolved')}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Resolve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'dismissed')}>
                  <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
