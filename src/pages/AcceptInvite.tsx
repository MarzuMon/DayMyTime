import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AcceptInvite() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<any>(null);
  const [teamName, setTeamName] = useState('');
  const [inviterName, setInviterName] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepted' | 'error' | 'expired'>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token!)
      .eq('status', 'pending')
      .maybeSingle();

    if (error || !data) {
      setStatus('error');
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setStatus('expired');
      return;
    }

    setInvitation(data);

    // Get team name and inviter
    const [teamRes, inviterRes] = await Promise.all([
      supabase.from('teams').select('name').eq('id', data.team_id).single(),
      supabase.from('profiles').select('display_name').eq('id', data.invited_by).single(),
    ]);

    setTeamName(teamRes.data?.name || 'Unknown Team');
    setInviterName(inviterRes.data?.display_name || 'Someone');
    setStatus('ready');
  };

  const handleAccept = async () => {
    if (!user || !invitation) return;
    setProcessing(true);

    // Add user as team member
    const { error: memberError } = await supabase.from('team_members').insert({
      team_id: invitation.team_id,
      user_id: user.id,
      role: 'member',
    });

    if (memberError) {
      toast({ title: 'Failed', description: memberError.message, variant: 'destructive' });
      setProcessing(false);
      return;
    }

    // Update invitation status  
    await supabase.from('team_invitations').update({ status: 'accepted' }).eq('id', invitation.id);

    setStatus('accepted');
    toast({ title: 'Welcome!', description: `You've joined ${teamName}` });
    setProcessing(false);
  };

  const handleDecline = async () => {
    if (!invitation) return;
    await supabase.from('team_invitations').update({ status: 'declined' }).eq('id', invitation.id);
    toast({ title: 'Invitation declined' });
    navigate('/app');
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CalendarDays className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle>Sign in to accept invitation</CardTitle>
            <CardDescription>You need an account to join a team.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate(`/auth?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`)}>
              Sign In / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'accepted' ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle>You're in!</CardTitle>
              <CardDescription>You've successfully joined {teamName}.</CardDescription>
            </>
          ) : status === 'error' ? (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <CardTitle>Invalid Invitation</CardTitle>
              <CardDescription>This invitation link is invalid or has already been used.</CardDescription>
            </>
          ) : status === 'expired' ? (
            <>
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <CardTitle>Invitation Expired</CardTitle>
              <CardDescription>This invitation has expired. Ask the team owner to send a new one.</CardDescription>
            </>
          ) : (
            <>
              <CalendarDays className="h-10 w-10 text-primary mx-auto mb-2" />
              <CardTitle>Team Invitation</CardTitle>
              <CardDescription>
                <strong>{inviterName}</strong> invited you to join <strong>{teamName}</strong>
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {status === 'ready' && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleDecline}>
                Decline
              </Button>
              <Button className="flex-1" onClick={handleAccept} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept & Join'}
              </Button>
            </div>
          )}
          {(status === 'accepted' || status === 'error' || status === 'expired') && (
            <Button className="w-full" onClick={() => navigate('/app')}>
              Go to App
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
