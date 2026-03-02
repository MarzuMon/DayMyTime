import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Megaphone, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface Promotion {
  id: string;
  title: string;
  description: string;
  type: string;
  target_signups: number;
  reward_days: number;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = { title: '', description: '', type: 'referral', target_signups: 20, reward_days: 30, is_active: true };

export default function PromotionManagementTab() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchPromotions(); }, []);

  const fetchPromotions = async () => {
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    setPromotions((data as Promotion[]) || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({ title: p.title, description: p.description, type: p.type, target_signups: p.target_signups, reward_days: p.reward_days, is_active: p.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    
    if (editingId) {
      const { error } = await supabase.from('promotions').update({
        title: form.title, description: form.description, type: form.type,
        target_signups: form.target_signups, reward_days: form.reward_days,
        is_active: form.is_active, updated_at: new Date().toISOString(),
      }).eq('id', editingId);
      if (error) { toast.error('Failed to update'); return; }
      toast.success('Promotion updated');
    } else {
      const { error } = await supabase.from('promotions').insert({
        title: form.title, description: form.description, type: form.type,
        target_signups: form.target_signups, reward_days: form.reward_days,
        is_active: form.is_active,
      });
      if (error) { toast.error('Failed to create'); return; }
      toast.success('Promotion created');
    }
    setDialogOpen(false);
    fetchPromotions();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('promotions').delete().eq('id', deleteId);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Promotion deleted');
    setDeleteId(null);
    fetchPromotions();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('promotions').update({ is_active: !current, updated_at: new Date().toISOString() }).eq('id', id);
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><Megaphone className="h-4 w-4" /> Promotions</h3>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Promotion</Button>
      </div>

      {promotions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No promotions yet. Create one to get started.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {promotions.map(p => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 pt-6">
                <Gift className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{p.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-secondary text-muted-foreground'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.description || 'No description'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: <strong className="capitalize">{p.type}</strong> · Target: <strong>{p.target_signups} signups</strong> · Reward: <strong>{p.reward_days} days Pro</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Refer 20 Friends" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the promotion..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="signup_bonus">Signup Bonus</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Target Signups</label>
                <Input type="number" value={form.target_signups} onChange={e => setForm({ ...form, target_signups: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Reward (Days of Pro)</label>
                <Input type="number" value={form.reward_days} onChange={e => setForm({ ...form, reward_days: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <label className="text-sm">{form.is_active ? 'Active' : 'Inactive'}</label>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">{editingId ? 'Update' : 'Create'} Promotion</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
