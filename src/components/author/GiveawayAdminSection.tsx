import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Copy, Trash2, Users, Trophy, Upload, RotateCcw, Image as ImageIcon, CalendarX, Flag, Send, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { sendPushNotification } from '@/lib/onesignal';
import imageCompression from 'browser-image-compression';

interface Contribution {
  id: string; email: string; phone: string; image_url: string; created_at: string;
}

export default function GiveawayAdminSection() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [startCount, setStartCount] = useState(0);
  const [newStartCount, setNewStartCount] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [winnerFile, setWinnerFile] = useState<File | null>(null);
  const [winnerName, setWinnerName] = useState('');
  const [uploadingWinner, setUploadingWinner] = useState(false);
  const [activeImageFile, setActiveImageFile] = useState<File | null>(null);
  const [activeImageURL, setActiveImageURL] = useState('');
  const [uploadingActive, setUploadingActive] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushUrl, setPushUrl] = useState('');
  const [sendingPush, setSendingPush] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: contribs } = await supabase.from('giveaway_contributions').select('*').order('created_at', { ascending: false });
      if (contribs) setContributions(contribs as unknown as Contribution[]);

      const { data: cfg } = await supabase.from('giveaway_config').select('*').limit(1).maybeSingle();
      if (cfg) {
        const c = cfg as any;
        setConfigId(c.id);
        setStartCount(c.start_count || 0);
        setActiveImageURL(c.active_image_url || '');
        setExpiryDate(c.expiry_date ? new Date(c.expiry_date).toISOString().slice(0, 16) : '');
        setIsFinished(c.is_finished || false);
      }
    } catch (err) {
      console.error('Giveaway admin fetch failed:', err);
      toast.error('Failed to load giveaway data');
    } finally { setLoading(false); }
  };

  const updateConfig = async (updates: Record<string, unknown>) => {
    if (!configId) return;
    await supabase.from('giveaway_config').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', configId);
  };

  const copyEmails = () => {
    const emails = contributions.map(c => c.email).join('\n');
    navigator.clipboard.writeText(emails);
    toast.success(`${contributions.length} emails copied!`);
  };

  const clearAll = async () => {
    for (const c of contributions) await supabase.from('giveaway_contributions').delete().eq('id', c.id);
    setContributions([]);
    toast.success('All submissions cleared');
    setClearConfirm(false);
  };

  const updateStartCount = async () => {
    const val = parseInt(newStartCount);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid number'); return; }
    await updateConfig({ start_count: val });
    setStartCount(val); setNewStartCount('');
    toast.success(`Start count set to ${val}`);
  };

  const resetCount = async () => {
    await updateConfig({ start_count: 0 });
    setStartCount(0);
    toast.success('Count reset to 0');
  };

  const uploadActiveImage = async () => {
    if (!activeImageFile) return;
    setUploadingActive(true);
    try {
      const compressed = await imageCompression(activeImageFile, { maxSizeMB: 0.3, maxWidthOrHeight: 1920, useWebWorker: true });
      const fileName = `giveaway/banner-${Date.now()}.${compressed.type.split('/')[1] || 'jpg'}`;
      const { data, error } = await supabase.storage.from('images').upload(fileName, compressed, { contentType: compressed.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);
      await updateConfig({ active_image_url: urlData.publicUrl });
      setActiveImageURL(urlData.publicUrl); setActiveImageFile(null);
      toast.success('Active giveaway image updated!');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingActive(false); }
  };

  const updateExpiry = async () => {
    await updateConfig({ expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null });
    toast.success('Expiry date updated');
  };

  const toggleFinished = async () => {
    const newVal = !isFinished;
    await updateConfig({ is_finished: newVal });
    setIsFinished(newVal);
    toast.success(newVal ? 'Giveaway marked as finished' : 'Giveaway reactivated');
  };

  const uploadWinner = async () => {
    if (!winnerFile) return;
    setUploadingWinner(true);
    try {
      const isVideo = winnerFile.type.startsWith('video/');
      const fileName = `winners/${Date.now()}_${winnerFile.name}`;
      const { data, error } = await supabase.storage.from('images').upload(fileName, winnerFile, { contentType: winnerFile.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);
      await supabase.from('giveaway_winners').insert({
        name: winnerName || '',
        ...(isVideo ? { video_url: urlData.publicUrl } : { image_url: urlData.publicUrl }),
      });
      setWinnerFile(null); setWinnerName('');
      toast.success('Winner uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingWinner(false); }
  };

  const handleSendPush = async () => {
    if (!pushTitle.trim() || !pushMessage.trim()) { toast.error('Title and message are required'); return; }
    setSendingPush(true);
    try {
      await sendPushNotification(pushTitle, pushMessage, pushUrl || undefined);
      toast.success('Push notification sent!');
      setPushTitle(''); setPushMessage(''); setPushUrl('');
    } catch { toast.error('Failed to send notification'); }
    finally { setSendingPush(false); }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading giveaway data...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="h-6 w-6 text-primary mx-auto mb-1" /><p className="text-2xl font-bold">{startCount + contributions.length}</p><p className="text-xs text-muted-foreground">Total Participants</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{contributions.length}</p><p className="text-xs text-muted-foreground">Actual Submissions</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{startCount}</p><p className="text-xs text-muted-foreground">Start Count</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Active Giveaway Image</h4>
        {activeImageURL && <img src={activeImageURL} alt="Active giveaway" className="w-full max-h-40 object-cover rounded-lg border" />}
        <div className="flex gap-2">
          <label className="cursor-pointer flex-1">
            <Button size="sm" variant="outline" asChild className="w-full"><span><Upload className="h-4 w-4 mr-1" /> {activeImageFile ? activeImageFile.name.slice(0, 20) : 'Choose Image'}</span></Button>
            <input type="file" accept="image/*" onChange={e => setActiveImageFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
          <Button size="sm" onClick={uploadActiveImage} disabled={!activeImageFile || uploadingActive}>{uploadingActive ? '...' : 'Upload'}</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2"><CalendarX className="h-4 w-4" /> Giveaway Controls</h4>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><label className="text-xs text-muted-foreground">Expiry Date</label><Input type="datetime-local" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} /></div>
          <Button size="sm" onClick={updateExpiry}>Set</Button>
        </div>
        <Button size="sm" variant={isFinished ? "default" : "destructive"} onClick={toggleFinished} className="gap-1.5"><Flag className="h-4 w-4" /> {isFinished ? 'Reactivate Giveaway' : 'Finish Giveaway'}</Button>
      </CardContent></Card>

      <Card><CardContent className="pt-4 space-y-3">
        <h4 className="text-sm font-semibold">Participant Count Controls</h4>
        <div className="flex gap-2">
          <Input type="number" value={newStartCount} onChange={e => setNewStartCount(e.target.value)} placeholder="Set start count" className="flex-1" />
          <Button size="sm" onClick={updateStartCount}>Set</Button>
          <Button size="sm" variant="outline" onClick={resetCount}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Upload Winner</h4>
        <div className="flex gap-2">
          <Input value={winnerName} onChange={e => setWinnerName(e.target.value)} placeholder="Winner name" className="flex-1" />
          <label className="cursor-pointer">
            <Button size="sm" variant="outline" asChild><span><Upload className="h-4 w-4 mr-1" /> {winnerFile ? winnerFile.name.slice(0, 15) : 'File'}</span></Button>
            <input type="file" accept="image/*,video/*" onChange={e => setWinnerFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
          <Button size="sm" onClick={uploadWinner} disabled={!winnerFile || uploadingWinner}>{uploadingWinner ? '...' : 'Upload'}</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Send Push Notification</h4>
        <Input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="Notification title" />
        <Textarea value={pushMessage} onChange={e => setPushMessage(e.target.value)} placeholder="Notification message" rows={2} />
        <Input value={pushUrl} onChange={e => setPushUrl(e.target.value)} placeholder="URL to open (optional)" />
        <Button size="sm" onClick={handleSendPush} disabled={sendingPush} className="gap-1.5"><Send className="h-4 w-4" /> {sendingPush ? 'Sending...' : 'Send to All Users'}</Button>
      </CardContent></Card>

      <div className="flex gap-2">
        <Button size="sm" onClick={copyEmails} disabled={contributions.length === 0}><Copy className="h-4 w-4 mr-1" /> Copy All Emails ({contributions.length})</Button>
        <Button size="sm" variant="destructive" onClick={() => setClearConfirm(true)} disabled={contributions.length === 0}><Trash2 className="h-4 w-4 mr-1" /> Clear All</Button>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Submissions ({contributions.length})</h4>
        {contributions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No submissions yet.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {contributions.map(c => (
              <Card key={c.id}><CardContent className="py-3 px-4 flex items-center gap-3">
                <button onClick={() => setPreviewImg(c.image_url)} className="flex-shrink-0">
                  <img src={c.image_url} alt="" className="h-12 w-12 rounded-lg object-cover border" loading="lazy" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.email}</p>
                  <p className="text-xs text-muted-foreground">{c.phone} · {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Submission Image</DialogTitle></DialogHeader>
          {previewImg && <img src={previewImg} alt="Submission" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={clearConfirm} onOpenChange={setClearConfirm}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Clear all submissions?</AlertDialogTitle><AlertDialogDescription>This will permanently delete all giveaway entries.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={clearAll}>Delete All</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
