import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Crown, Trash2, Search, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  member_count?: number;
  owner_name?: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  display_name: string;
  avatar_url: string | null;
}

export default function TeamManagementTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete-team' | 'remove-member'; id: string; name: string } | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    const { data: allTeams } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
    if (!allTeams) { setTeams([]); setLoading(false); return; }

    // Get member counts
    const { data: memberCounts } = await supabase.from('team_members').select('team_id');
    const countMap = new Map<string, number>();
    memberCounts?.forEach(m => countMap.set(m.team_id, (countMap.get(m.team_id) || 0) + 1));

    // Get owner names
    const ownerIds = [...new Set(allTeams.map(t => t.owner_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', ownerIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

    setTeams(allTeams.map(t => ({
      ...t,
      member_count: countMap.get(t.id) || 0,
      owner_name: profileMap.get(t.owner_id) || 'Unknown',
    })));
    setLoading(false);
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

  const handleDeleteTeam = async (teamId: string) => {
    await supabase.from('team_members').delete().eq('team_id', teamId);
    await supabase.from('teams').delete().eq('id', teamId);
    if (selectedTeam?.id === teamId) { setSelectedTeam(null); setMembers([]); }
    toast.success('Team deleted');
    loadTeams();
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from('team_members').delete().eq('id', memberId);
    toast.success('Member removed');
    if (selectedTeam) loadMembers(selectedTeam);
    loadTeams();
  };

  const executeConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete-team') handleDeleteTeam(confirmAction.id);
    else handleRemoveMember(confirmAction.id);
    setConfirmAction(null);
  };

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading teams...</div>;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams or owners..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-secondary">
          <p className="text-sm text-muted-foreground">Total Teams</p>
          <p className="text-xl font-bold">{teams.length}</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary">
          <p className="text-sm text-muted-foreground">Total Members</p>
          <p className="text-xl font-bold">{teams.reduce((s, t) => s + (t.member_count || 0), 0)}</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary">
          <p className="text-sm text-muted-foreground">Avg Members/Team</p>
          <p className="text-xl font-bold">
            {teams.length > 0 ? (teams.reduce((s, t) => s + (t.member_count || 0), 0) / teams.length).toFixed(1) : 0}
          </p>
        </div>
      </div>

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> All Teams ({filtered.length})</CardTitle>
          <CardDescription>Click a team to view its members</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No teams found</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(team => (
                <div
                  key={team.id}
                  onClick={() => loadMembers(team)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-secondary/50 ${
                    selectedTeam?.id === team.id ? 'border-primary bg-secondary/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Owner: {team.owner_name} · {team.member_count} member{team.member_count !== 1 ? 's' : ''} · {new Date(team.created_at).toLocaleDateString()}
                      </p>
                      {team.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{team.description}</p>}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive flex-shrink-0"
                      onClick={e => { e.stopPropagation(); setConfirmAction({ type: 'delete-team', id: team.id, name: team.name }); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members Panel */}
      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> {selectedTeam.name} — Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No members</p>
            ) : (
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
                    {m.role !== 'owner' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setConfirmAction({ type: 'remove-member', id: m.id, name: m.display_name })}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={open => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'delete-team' ? 'Delete Team' : 'Remove Member'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'delete-team'
                ? `Are you sure you want to delete "${confirmAction?.name}"? All members will be removed.`
                : `Remove "${confirmAction?.name}" from this team?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {confirmAction?.type === 'delete-team' ? 'Delete' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
