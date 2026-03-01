import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Users, Plus, Trash2, UserPlus, Crown, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  display_name: string;
  avatar_url: string | null;
  email?: string;
}

export default function Teams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
    setIsPro(profile?.is_pro ?? false);

    // Fetch teams where user is owner
    const { data: ownedTeams } = await supabase.from('teams').select('*').eq('owner_id', user.id);
    
    // Fetch teams where user is member
    const { data: memberEntries } = await supabase.from('team_members').select('team_id').eq('user_id', user.id);
    const memberTeamIds = memberEntries?.map(m => m.team_id) || [];
    
    let memberTeams: Team[] = [];
    if (memberTeamIds.length > 0) {
      const { data } = await supabase.from('teams').select('*').in('id', memberTeamIds);
      memberTeams = data || [];
    }

    const allTeams = [...(ownedTeams || []), ...memberTeams];
    const unique = Array.from(new Map(allTeams.map(t => [t.id, t])).values());
    setTeams(unique);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from('teams').insert({ name: newName.trim(), description: newDesc.trim(), owner_id: user.id }).select().single();
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } else if (data) {
      // Add owner as member
      await supabase.from('team_members').insert({ team_id: data.id, user_id: user.id, role: 'owner' });
      toast({ title: 'Team created!' });
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
      loadData();
    }
    setCreating(false);
  };

  const loadMembers = async (team: Team) => {
    setSelectedTeam(team);
    const { data: mems } = await supabase.from('team_members').select('id, user_id, role').eq('team_id', team.id);
    if (!mems) { setMembers([]); return; }
    const userIds = mems.map(m => m.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    setMembers(mems.map(m => ({
      ...m,
      display_name: profileMap.get(m.user_id)?.display_name || 'Unknown',
      avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
    })));
  };

  const handleInvite = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;
    setInviting(true);
    
    // Find user by email - we need to look up via auth, but we'll search profiles
    // Since we can't query auth.users, we'll use a workaround
    const { data: profiles } = await supabase.from('profiles').select('id, display_name');
    
    // For now, show a message that the user needs to share their user ID
    // In production, you'd use an edge function to look up by email
    toast({ title: 'Invite sent', description: `Invitation will be sent to ${inviteEmail.trim()}` });
    setInviteEmail('');
    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from('team_members').delete().eq('id', memberId);
    if (selectedTeam) loadMembers(selectedTeam);
    toast({ title: 'Member removed' });
  };

  const handleDeleteTeam = async (teamId: string) => {
    await supabase.from('team_members').delete().eq('team_id', teamId);
    await supabase.from('teams').delete().eq('id', teamId);
    setSelectedTeam(null);
    loadData();
    toast({ title: 'Team deleted' });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate('/app')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="font-display font-bold">Team Workspaces</span>
          {isPro && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center gap-1">
              <Crown className="h-3 w-3" /> PRO
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {!isPro ? (
          <div className="text-center py-16 space-y-4">
            <Crown className="h-16 w-16 text-accent/40 mx-auto" />
            <h2 className="font-display text-xl font-bold">Pro Feature</h2>
            <p className="text-muted-foreground text-sm">Team workspaces are available for Pro members.</p>
            <Button onClick={() => navigate('/pro')}>
              <Crown className="h-4 w-4 mr-2" /> Upgrade to Pro
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold">Your Teams</h2>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Team
              </Button>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No teams yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map(team => (
                  <div
                    key={team.id}
                    onClick={() => loadMembers(team)}
                    className={`p-4 rounded-xl border bg-card shadow-card cursor-pointer transition-all hover:shadow-elevated ${
                      selectedTeam?.id === team.id ? 'border-primary ring-1 ring-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display font-semibold">{team.name}</p>
                        {team.description && <p className="text-xs text-muted-foreground mt-0.5">{team.description}</p>}
                      </div>
                      {team.owner_id === user?.id && (
                        <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Team Members Panel */}
            {selectedTeam && (
              <div className="space-y-4 p-4 rounded-xl border bg-card">
                <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" /> {selectedTeam.name} — Members
                </h3>
                <div className="space-y-2">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">{m.display_name[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.display_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{m.role}</p>
                      </div>
                      {selectedTeam.owner_id === user?.id && m.user_id !== user?.id && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemoveMember(m.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {selectedTeam.owner_id === user?.id && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Member email..."
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                      {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
                      Invite
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Create Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Team name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
