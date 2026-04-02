import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Users, Plus, Trash2, UserPlus, Loader2, Mail, Palette, Copy, Check, Eye, Pencil, Link2 } from 'lucide-react';
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
  brand_color: string;
  logo_url: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  display_name: string;
  avatar_url: string | null;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
  token: string;
}

export default function Teams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [creating, setCreating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState(false);
  const [brandColor, setBrandColor] = useState('#6366f1');
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: ownedTeams } = await supabase.from('teams').select('*').eq('owner_id', user.id);
    const { data: memberEntries } = await supabase.from('team_members').select('team_id').eq('user_id', user.id);
    const memberTeamIds = memberEntries?.map(m => m.team_id) || [];

    let memberTeams: Team[] = [];
    if (memberTeamIds.length > 0) {
      const { data } = await supabase.from('teams').select('*').in('id', memberTeamIds);
      memberTeams = (data || []) as Team[];
    }

    const allTeams = [...((ownedTeams || []) as Team[]), ...memberTeams];
    const unique = Array.from(new Map(allTeams.map(t => [t.id, t])).values());
    setTeams(unique);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from('teams').insert({
      name: newName.trim(),
      description: newDesc.trim(),
      owner_id: user.id,
      brand_color: newColor,
    }).select().single();
    if (error) {
      console.error('Create team error:', error);
      toast({ title: 'Failed', description: 'Could not create team. Please try again.', variant: 'destructive' });
    } else if (data) {
      await supabase.from('team_members').insert({ team_id: data.id, user_id: user.id, role: 'owner' });
      toast({ title: 'Team created!' });
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
      setNewColor('#6366f1');
      loadData();
    }
    setCreating(false);
  };

  const loadMembers = async (team: Team) => {
    setSelectedTeam(team);
    setBrandColor(team.brand_color || '#6366f1');
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

    // Load invitations
    const { data: invites } = await supabase.from('team_invitations').select('id, email, status, created_at, token').eq('team_id', team.id).order('created_at', { ascending: false });
    setInvitations((invites || []) as Invitation[]);
  };

  const handleInvite = async () => {
    if (!selectedTeam || !inviteEmail.trim() || !user) return;
    setInviting(true);

    const { data, error } = await supabase.functions.invoke('send-team-invite', {
      body: { teamId: selectedTeam.id, email: inviteEmail.trim(), invitedBy: user.id },
    });

    if (error || data?.error) {
      console.error('Invite error:', error || data?.error);
      toast({ title: 'Failed', description: 'Could not send invitation. Please try again.', variant: 'destructive' });
    } else {
      const inviteUrl = `${window.location.origin}/accept-invite?token=${data.invitation.token}`;
      toast({ title: 'Invitation created!', description: `Share the invite link with ${inviteEmail}` });
      
      // Copy link to clipboard
      try {
        await navigator.clipboard.writeText(inviteUrl);
        toast({ title: 'Link copied!', description: 'Invite link copied to clipboard' });
      } catch {}

      setInviteEmail('');
      loadMembers(selectedTeam);
    }
    setInviting(false);
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/accept-invite?token=${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(token);
    toast({ title: 'Link copied to clipboard!' });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleGenerateLink = async () => {
    if (!selectedTeam || !user) return;
    setGeneratingLink(true);
    const { data, error } = await supabase.functions.invoke('generate-invite-link', {
      body: { teamId: selectedTeam.id },
    });
    if (error || data?.error) {
      toast({ title: 'Failed', description: data?.error || error?.message, variant: 'destructive' });
    } else {
      const inviteUrl = `${window.location.origin}/accept-invite?token=${data.token}`;
      try {
        await navigator.clipboard.writeText(inviteUrl);
        toast({ title: 'Invite link generated & copied!', description: 'Share this link with anyone to join your team.' });
      } catch {
        toast({ title: 'Invite link generated!', description: inviteUrl });
      }
      loadMembers(selectedTeam);
    }
    setGeneratingLink(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from('team_members').delete().eq('id', memberId);
    if (selectedTeam) loadMembers(selectedTeam);
    toast({ title: 'Member removed' });
  };

  const handleToggleMemberRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'editor' ? 'viewer' : 'editor';
    await supabase.from('team_members').update({ role: newRole }).eq('id', memberId);
    if (selectedTeam) loadMembers(selectedTeam);
    toast({ title: `Member set to ${newRole}` });
  };

  const handleDeleteTeam = async (teamId: string) => {
    await supabase.from('team_members').delete().eq('team_id', teamId);
    await supabase.from('team_invitations').delete().eq('team_id', teamId);
    await supabase.from('teams').delete().eq('id', teamId);
    setSelectedTeam(null);
    loadData();
    toast({ title: 'Team deleted' });
  };

  const handleSaveBrand = async () => {
    if (!selectedTeam) return;
    await supabase.from('teams').update({ brand_color: brandColor }).eq('id', selectedTeam.id);
    setSelectedTeam({ ...selectedTeam, brand_color: brandColor });
    setEditingBrand(false);
    toast({ title: 'Team branding updated!' });
    loadData();
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
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
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
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: team.brand_color || '#6366f1' }}
                        >
                          {team.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-display font-semibold">{team.name}</p>
                          {team.description && <p className="text-xs text-muted-foreground mt-0.5">{team.description}</p>}
                        </div>
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

            {/* Team Members & Details Panel */}
            {selectedTeam && (
              <div className="space-y-4 p-4 rounded-xl border bg-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" /> {selectedTeam.name} — Members
                  </h3>
                  {selectedTeam.owner_id === user?.id && (
                    <Button size="sm" variant="ghost" onClick={() => setEditingBrand(!editingBrand)}>
                      <Palette className="h-3.5 w-3.5 mr-1" /> Brand
                    </Button>
                  )}
                </div>

                {/* Brand Editor */}
                {editingBrand && selectedTeam.owner_id === user?.id && (
                  <div className="p-3 rounded-lg bg-secondary/50 space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium">Team Color</label>
                      <input
                        type="color"
                        value={brandColor}
                        onChange={e => setBrandColor(e.target.value)}
                        className="h-8 w-12 rounded cursor-pointer border-0"
                      />
                      <span className="text-xs text-muted-foreground font-mono">{brandColor}</span>
                    </div>
                    <Button size="sm" onClick={handleSaveBrand}>Save Branding</Button>
                  </div>
                )}

                {/* Members List */}
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
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleToggleMemberRole(m.id, m.role)}
                            title={m.role === 'editor' ? 'Switch to view-only' : 'Allow editing'}
                          >
                            {m.role === 'editor' ? (
                              <><Pencil className="h-3 w-3 mr-1" /> Editor</>
                            ) : (
                              <><Eye className="h-3 w-3 mr-1" /> Viewer</>
                            )}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemoveMember(m.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pending Invitations */}
                {invitations.filter(i => i.status === 'pending').length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Invitations</p>
                    {invitations.filter(i => i.status === 'pending').map(inv => (
                      <div key={inv.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm flex-1 truncate">{inv.email}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleCopyLink(inv.token)}
                        >
                          {copiedLink === inv.token ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Invite Controls */}
                {selectedTeam.owner_id === user?.id && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Member email..."
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                        {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
                        Invite
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={handleGenerateLink}
                      disabled={generatingLink}
                    >
                      {generatingLink ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
                      Generate Invite Link (No Email Required)
                    </Button>
                  </div>
                )}
              </div>
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
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Brand Color</label>
              <input
                type="color"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0"
              />
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: newColor }}
              >
                {newName[0]?.toUpperCase() || 'T'}
              </div>
            </div>
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
