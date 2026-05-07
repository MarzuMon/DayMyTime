import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Props {
  targetType: 'post' | 'comment';
  targetId: string;
  size?: 'sm' | 'icon';
}

export default function ReportDialog({ targetType, targetId, size = 'sm' }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('post_reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim().slice(0, 500),
    });
    setSubmitting(false);
    if (error) {
      toast.error('Report failed');
      return;
    }
    toast.success('Report submitted — thank you');
    setReason('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size === 'icon' ? 'icon' : 'sm'} variant="ghost" className={size === 'icon' ? 'h-8 w-8' : ''} aria-label="Report">
          <Flag className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-1 text-xs">Report</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
          <DialogDescription>Tell us what's wrong. Our admins will review.</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)" rows={4} maxLength={500} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>Submit report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
