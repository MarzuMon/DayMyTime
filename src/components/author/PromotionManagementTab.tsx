import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { db, storage as firebaseStorage } from '@/lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Megaphone, Gift, Upload, CheckCircle, ImageIcon, Users, RotateCcw, CalendarX, Flag } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

interface Promotion {
  id: string;
  title: string;
  description: string;
  type: string;
  target_signups: number;
  reward_days: number;
  is_active: boolean;
  is_finished: boolean;
  image_url: string | null;
  created_at: string;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'referral',
  target_signups: 20,
  reward_days: 30,
  is_active: true,
  is_finished: false,
  image_url: null as string | null,
};

export default function PromotionManagementTab() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Giveaway controls state
  const [startCount, setStartCount] = useState(0);
  const [actualCount, setActualCount] = useState(0);
  const [newStartCount, setNewStartCount] = useState('');
  const [activeImageURL, setActiveImageURL] = useState('');
  const [activeImageFile, setActiveImageFile] = useState<File | null>(null);
  const [uploadingActive, setUploadingActive] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [isGiveawayFinished, setIsGiveawayFinished] = useState(false);

  useEffect(() => { fetchPromotions(); fetchGiveawayData(); }, []);

  const fetchPromotions = async () => {
    const { data } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });
    setPromotions((data as unknown as Promotion[]) || []);
    setLoading(false);
  };

  const fetchGiveawayData = async () => {
    try {
      const metaRef = doc(db, 'giveaway_meta', 'config');
      const metaSnap = await getDoc(metaRef);
      if (metaSnap.exists()) {
        const data = metaSnap.data();
        setStartCount(data.startCount || 0);
        setActiveImageURL(data.activeImageURL || '');
        setExpiryDate(data.expiryDate || '');
        setIsGiveawayFinished(data.isFinished || false);
      }
      const snap = await getDocs(collection(db, 'contributions'));
      setActualCount(snap.size);
    } catch (err) {
      console.warn('Firebase giveaway data fetch failed:', (err as Error).message);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true); };

  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      title: p.title, description: p.description, type: p.type,
      target_signups: p.target_signups, reward_days: p.reward_days,
      is_active: p.is_active, is_finished: p.is_finished, image_url: p.image_url,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true });
      const fileName = `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${compressed.type.split('/')[1] || 'jpg'}`;
      const { data, error } = await supabase.storage.from('images').upload(`promotions/${fileName}`, compressed, { contentType: compressed.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);
      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success('Image uploaded');
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const payload = {
      title: form.title, description: form.description, type: form.type,
      target_signups: form.target_signups, reward_days: form.reward_days,
      is_active: form.is_active, is_finished: form.is_finished,
      image_url: form.image_url, updated_at: new Date().toISOString(),
    };
    if (editingId) {
      const { error } = await supabase.from('promotions').update(payload).eq('id', editingId);
      if (error) { toast.error('Failed to update'); return; }
      toast.success('Promotion updated');
    } else {
      const { error } = await supabase.from('promotions').insert(payload);
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

  const toggleFinished = async (id: string, current: boolean) => {
    const updates: Record<string, unknown> = { is_finished: !current, updated_at: new Date().toISOString() };
    if (!current) updates.is_active = false;
    await supabase.from('promotions').update(updates).eq('id', id);
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_finished: !current, ...((!current) ? { is_active: false } : {}) } : p));
    toast.success(!current ? 'Promotion finished' : 'Promotion reopened');
  };

  // Giveaway controls
  const updateStartCount = async () => {
    const val = parseInt(newStartCount);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid number'); return; }
    await setDoc(doc(db, 'giveaway_meta', 'config'), { startCount: val }, { merge: true });
    setStartCount(val); setNewStartCount('');
    toast.success(`Start count set to ${val}`);
  };

  const resetCount = async () => {
    await setDoc(doc(db, 'giveaway_meta', 'config'), { startCount: 0 }, { merge: true });
    setStartCount(0);
    toast.success('Count reset to 0');
  };

  const uploadActiveImage = async () => {
    if (!activeImageFile) return;
    setUploadingActive(true);
    try {
      const path = `giveaway/${Date.now()}_${activeImageFile.name}`;
      const storageRef = ref(firebaseStorage, path);
      await uploadBytes(storageRef, activeImageFile);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'giveaway_meta', 'config'), { activeImageURL: url }, { merge: true });
      setActiveImageURL(url); setActiveImageFile(null);
      toast.success('Active giveaway image updated!');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingActive(false); }
  };

  const updateExpiry = async () => {
    await setDoc(doc(db, 'giveaway_meta', 'config'), { expiryDate }, { merge: true });
    toast.success('Expiry date updated');
  };

  const toggleGiveawayFinished = async () => {
    const newVal = !isGiveawayFinished;
    await setDoc(doc(db, 'giveaway_meta', 'config'), { isFinished: newVal }, { merge: true });
    setIsGiveawayFinished(newVal);
    toast.success(newVal ? 'Giveaway marked as finished' : 'Giveaway reactivated');
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Promotions Section */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><Megaphone className="h-4 w-4" /> Promotions</h3>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Promotion</Button>
      </div>

      {promotions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No promotions yet. Create one to get started.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {promotions.map(p => (
            <Card key={p.id} className={p.is_finished ? 'opacity-60' : ''}>
              <CardContent className="flex items-start gap-4 pt-6">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="h-16 w-16 rounded-lg object-cover flex-shrink-0 border border-border" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{p.title}</p>
                    {p.is_finished && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Finished
                      </span>
                    )}
                    {!p.is_finished && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-secondary text-muted-foreground'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.description || 'No description'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: <strong className="capitalize">{p.type}</strong> · Target: <strong>{p.target_signups} signups</strong> · Reward: <strong>{p.reward_days} days Pro</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!p.is_finished && <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />}
                  <Button size="sm" variant={p.is_finished ? 'outline' : 'secondary'} onClick={() => toggleFinished(p.id, p.is_finished)} className="text-xs">
                    {p.is_finished ? 'Reopen' : 'Finish'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Giveaway Controls Section */}
      <div className="border-t pt-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Gift className="h-4 w-4 text-primary" /> Giveaway Controls</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <Card><CardContent className="pt-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{startCount + actualCount}</p>
            <p className="text-xs text-muted-foreground">Total Participants</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-xl font-bold">{actualCount}</p>
            <p className="text-xs text-muted-foreground">Actual Submissions</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-xl font-bold">{startCount}</p>
            <p className="text-xs text-muted-foreground">Start Count</p>
          </CardContent></Card>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <h4 className="text-sm font-semibold">Participant Count Controls</h4>
            <div className="flex gap-2">
              <Input type="number" value={newStartCount} onChange={e => setNewStartCount(e.target.value)} placeholder="Set start count" className="flex-1" />
              <Button size="sm" onClick={updateStartCount}>Set</Button>
              <Button size="sm" variant="outline" onClick={resetCount}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Active Giveaway Image</h4>
            {activeImageURL && (
              <img src={activeImageURL} alt="Active giveaway" className="w-full max-h-40 object-cover rounded-lg border" />
            )}
            <div className="flex gap-2">
              <label className="cursor-pointer flex-1">
                <Button size="sm" variant="outline" asChild className="w-full"><span><Upload className="h-4 w-4 mr-1" /> {activeImageFile ? activeImageFile.name.slice(0, 20) : 'Choose Image'}</span></Button>
                <input type="file" accept="image/*" onChange={e => setActiveImageFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
              <Button size="sm" onClick={uploadActiveImage} disabled={!activeImageFile || uploadingActive}>
                {uploadingActive ? '...' : 'Upload'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><CalendarX className="h-4 w-4" /> Giveaway Lifecycle</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Expiry Date</label>
                <Input type="datetime-local" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </div>
              <Button size="sm" onClick={updateExpiry}>Set</Button>
            </div>
            <Button size="sm" variant={isGiveawayFinished ? "default" : "destructive"} onClick={toggleGiveawayFinished} className="gap-1.5">
              <Flag className="h-4 w-4" /> {isGiveawayFinished ? 'Reactivate Giveaway' : 'Finish Giveaway'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Promotion Image</label>
              <div className="mt-1">
                {form.image_url ? (
                  <div className="relative">
                    <img src={form.image_url} alt="Promo" className="w-full h-40 object-cover rounded-lg border border-border" />
                    <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setForm(prev => ({ ...prev, image_url: null }))}>Remove</Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>
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