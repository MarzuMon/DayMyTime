import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Search, Crown } from 'lucide-react';

interface UserItem {
  id: string;
  display_name: string;
  is_pro: boolean;
  created_at: string;
}

interface UserManagementTabProps {
  users: UserItem[];
  onTogglePro: (userId: string, currentStatus: boolean) => void;
}

export default function UserManagementTab({ users, onTogglePro }: UserManagementTabProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pro' | 'free'>('all');

  const filtered = users.filter(u => {
    const matchesSearch = !search || 
      (u.display_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'all' || 
      (filterType === 'pro' && u.is_pro) || 
      (filterType === 'free' && !u.is_pro);
    return matchesSearch && matchesFilter;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          {filtered.length} of {users.length} users — toggle Pro status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            {(['all', 'pro', 'free'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  filterType === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-muted'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div className="flex items-center gap-2">
                {u.is_pro && <Crown className="h-3.5 w-3.5 text-primary" />}
                <div>
                  <p className="font-medium text-sm">{u.display_name || 'No name'}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  u.is_pro ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {u.is_pro ? 'Pro' : 'Free'}
                </span>
                <Switch
                  checked={u.is_pro}
                  onCheckedChange={() => onTogglePro(u.id, u.is_pro)}
                />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? 'No users match your search' : 'No users yet'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
