import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminSetting } from '@/hooks/use-admin-settings';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface GlobalTemplate {
  id: string;
  name: string;
  category: string;
  duration: number;
  description: string;
}

const CATEGORIES = ['meeting', 'class', 'work', 'personal', 'exam', 'other'];

export default function TemplateManagementTab() {
  const { value: templates, save, loading } = useAdminSetting<GlobalTemplate[]>('global_templates', []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<GlobalTemplate | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Omit<GlobalTemplate, 'id'>>({
    name: '',
    category: 'other',
    duration: 30,
    description: '',
  });

  const addTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    const created: GlobalTemplate = { ...newTemplate, id: crypto.randomUUID() };
    save([...templates, created]);
    setNewTemplate({ name: '', category: 'other', duration: 30, description: '' });
    setShowAdd(false);
    toast.success('Template created');
  };

  const deleteTemplate = (id: string) => {
    save(templates.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const startEdit = (t: GlobalTemplate) => {
    setEditingId(t.id);
    setEditForm({ ...t });
  };

  const saveEdit = () => {
    if (!editForm) return;
    save(templates.map(t => t.id === editForm.id ? editForm : t));
    setEditingId(null);
    setEditForm(null);
    toast.success('Template updated');
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Global Templates</CardTitle>
            <CardDescription>Schedule templates available to all users ({templates.length})</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add Form */}
        {showAdd && (
          <div className="p-4 rounded-lg border border-dashed space-y-3">
            <Input
              placeholder="Template name"
              value={newTemplate.name}
              onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newTemplate.category} onValueChange={v => setNewTemplate(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Duration (min)"
                value={newTemplate.duration}
                onChange={e => setNewTemplate(p => ({ ...p, duration: Number(e.target.value) }))}
              />
            </div>
            <Input
              placeholder="Description"
              value={newTemplate.description}
              onChange={e => setNewTemplate(p => ({ ...p, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addTemplate}>Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Template List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {templates.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              {editingId === t.id && editForm ? (
                <div className="flex-1 space-y-2 mr-3">
                  <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={editForm.category} onValueChange={v => setEditForm({ ...editForm, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" value={editForm.duration} onChange={e => setEditForm({ ...editForm, duration: Number(e.target.value) })} />
                  </div>
                  <Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
              ) : (
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {t.category} · {t.duration} min
                    {t.description && ` · ${t.description}`}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-1">
                {editingId === t.id ? (
                  <>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(null); setEditForm(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(t)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteTemplate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {templates.length === 0 && !showAdd && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No global templates yet. Click "Add" to create one.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
