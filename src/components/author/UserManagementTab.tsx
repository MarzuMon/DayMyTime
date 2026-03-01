import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Search, Crown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface UserItem {
  id: string;
  display_name: string;
  is_pro: boolean;
  created_at: string;
}

interface UserManagementTabProps {
  users: UserItem[];
  onTogglePro: (userId: string, currentStatus: boolean) => void;
  onBulkToggle?: (userIds: string[], setToPro: boolean) => void;
}

export default function UserManagementTab({ users, onTogglePro, onBulkToggle }: UserManagementTabProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pro' | 'free'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = users.filter(u => {
    const matchesSearch = !search || 
      (u.display_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'all' || 
      (filterType === 'pro' && u.is_pro) || 
      (filterType === 'free' && !u.is_pro);
    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(u => u.id)));
    }
  };

  const handleBulk = (setToPro: boolean) => {
    if (onBulkToggle) {
      onBulkToggle(Array.from(selected), setToPro);
    }
    setSelected(new Set());
  };

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

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

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => handleBulk(true)}>
              <ArrowUpCircle className="h-4 w-4 mr-1" /> Upgrade to Pro
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulk(false)}>
              <ArrowDownCircle className="h-4 w-4 mr-1" /> Downgrade to Free
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        )}

        {/* Select All */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">
              Select all
            </label>
          </div>
        )}

        {/* User List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map(u => (
            <div
              key={u.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                selected.has(u.id) ? 'bg-primary/10 border border-primary/30' : 'bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selected.has(u.id)}
                  onCheckedChange={() => toggleSelect(u.id)}
                />
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
