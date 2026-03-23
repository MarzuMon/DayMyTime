import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, getDoc, setDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Copy, Trash2, Users, Trophy, Upload, Eye, RotateCcw, Image as ImageIcon, CalendarX, Flag, Send, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { sendPushNotification } from '@/lib/onesignal';

interface Contribution {
  id: string; email: string; phone: string; imageURL: string; createdAt: string;
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

  // Active giveaway image
  const [activeImageFile, setActiveImageFile] = useState<File | null>(null);
  const [activeImageURL, setActiveImageURL] = useState('');
  const [uploadingActive, setUploadingActive] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  // Push notification
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushUrl, setPushUrl] = useState('');
  const [sendingPush, setSendingPush] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'contributions'), orderBy('createdAt', 'desc')));
      setContributions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contribution)));

      const metaRef = doc(db, 'giveaway_meta', 'config');
      const metaSnap = await getDoc(metaRef);
      if (metaSnap.exists()) {
        const data = metaSnap.data();
        setStartCount(data.startCount || 0);
        setActiveImageURL(data.activeImageURL || '');
        setExpiryDate(data.expiryDate || '');
        setIsFinished(data.isFinished || false);
      }
    } catch { toast.error('Failed to load giveaway data'); }
    finally { setLoading(false); }
  };

  const copyEmails = () => {
    const emails = contributions.map(c => c.email).join('\n');
    navigator.clipboard.writeText(emails);
    toast.success(`${contributions.length} emails copied!`);
  };

  const clearAll = async () => {
    try {
      for (const c of contributions) await deleteDoc(doc(db, 'contributions', c.id));
      setContributions([]);
      toast.success('All submissions cleared');
    } catch { toast.error('Failed to clear'); }
    setClearConfirm(false);
  };

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
      const storageRef = ref(storage, path);
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

  const toggleFinished = async () => {
    const newVal = !isFinished;
    await setDoc(doc(db, 'giveaway_meta', 'config'), { isFinished: newVal }, { merge: true });
    setIsFinished(newVal);
    toast.success(newVal ? 'Giveaway marked as finished' : 'Giveaway reactivated');
  };

  const uploadWinner = async () => {
    if (!winnerFile) return;
    setUploadingWinner(true);
    try {
      const isVideo = winnerFile.type.startsWith('video/');
      const path = `winners/${Date.now()}_${winnerFile.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, winnerFile);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'winners'), {
        ...(isVideo ? { videoURL: url, imageURL: '' } : { imageURL: url }),
        name: winnerName || '', createdAt: new Date().toISOString(),
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
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-6 w-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{startCount + contributions.length}</p>
          <p className="text-xs text-muted-foreground">Total Participants</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{contributions.length}</p>
          <p className="text-xs text-muted-foreground">Actual Submissions</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{startCount}</p>
          <p className="text-xs text-muted-foreground">Start Count</p>
        </CardContent></Card>
      </div>

      {/* Active Giveaway Image */}
      <Card>
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

      {/* Expiry & Finish */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2"><CalendarX className="h-4 w-4" /> Giveaway Controls</h4>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Expiry Date</label>
              <Input type="datetime-local" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
            <Button size="sm" onClick={updateExpiry}>Set</Button>
          </div>
          <Button size="sm" variant={isFinished ? "default" : "destructive"} onClick={toggleFinished} className="gap-1.5">
            <Flag className="h-4 w-4" /> {isFinished ? 'Reactivate Giveaway' : 'Finish Giveaway'}
          </Button>
        </CardContent>
      </Card>

      {/* Count Controls */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h4 className="text-sm font-semibold">Participant Count Controls</h4>
          <div className="flex gap-2">
            <Input type="number" value={newStartCount} onChange={e => setNewStartCount(e.target.value)} placeholder="Set start count" className="flex-1" />
            <Button size="sm" onClick={updateStartCount}>Set</Button>
            <Button size="sm" variant="outline" onClick={resetCount}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Winner Upload */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Upload Winner</h4>
          <div className="flex gap-2">
            <Input value={winnerName} onChange={e => setWinnerName(e.target.value)} placeholder="Winner name" className="flex-1" />
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" asChild><span><Upload className="h-4 w-4 mr-1" /> {winnerFile ? winnerFile.name.slice(0, 15) : 'File'}</span></Button>
              <input type="file" accept="image/*,video/*" onChange={e => setWinnerFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
            <Button size="sm" onClick={uploadWinner} disabled={!winnerFile || uploadingWinner}>
              {uploadingWinner ? '...' : 'Upload'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Push Notification */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Send Push Notification</h4>
          <Input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="Notification title" />
          <Textarea value={pushMessage} onChange={e => setPushMessage(e.target.value)} placeholder="Notification message" rows={2} />
          <Input value={pushUrl} onChange={e => setPushUrl(e.target.value)} placeholder="URL to open (optional)" />
          <Button size="sm" onClick={handleSendPush} disabled={sendingPush} className="gap-1.5">
            <Send className="h-4 w-4" /> {sendingPush ? 'Sending...' : 'Send to All Users'}
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={copyEmails} disabled={contributions.length === 0}>
          <Copy className="h-4 w-4 mr-1" /> Copy All Emails ({contributions.length})
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setClearConfirm(true)} disabled={contributions.length === 0}>
          <Trash2 className="h-4 w-4 mr-1" /> Clear All
        </Button>
      </div>

      {/* Submissions */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Submissions ({contributions.length})</h4>
        {contributions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No submissions yet.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {contributions.map(c => (
              <Card key={c.id}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <button onClick={() => setPreviewImg(c.imageURL)} className="flex-shrink-0">
                    <img src={c.imageURL} alt="" className="h-12 w-12 rounded-lg object-cover border" loading="lazy" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.email}</p>
                    <p className="text-xs text-muted-foreground">{c.phone} · {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview */}
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Submission Image</DialogTitle></DialogHeader>
          {previewImg && <img src={previewImg} alt="Submission" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Clear Confirm */}
      <AlertDialog open={clearConfirm} onOpenChange={setClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all submissions?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete all giveaway entries.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAll}>Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
