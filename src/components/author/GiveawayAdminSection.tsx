import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, getDoc, setDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Copy, Trash2, Users, Trophy, Upload, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Contribution {
  id: string;
  email: string;
  phone: string;
  imageURL: string;
  createdAt: string;
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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'contributions'), orderBy('createdAt', 'desc')));
      setContributions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contribution)));

      const metaRef = doc(db, 'giveaway_meta', 'config');
      const metaSnap = await getDoc(metaRef);
      if (metaSnap.exists()) setStartCount(metaSnap.data().startCount || 0);
    } catch {
      toast.error('Failed to load giveaway data');
    } finally {
      setLoading(false);
    }
  };

  const copyEmails = () => {
    const emails = contributions.map(c => c.email).join('\n');
    navigator.clipboard.writeText(emails);
    toast.success(`${contributions.length} emails copied!`);
  };

  const clearAll = async () => {
    try {
      for (const c of contributions) {
        await deleteDoc(doc(db, 'contributions', c.id));
      }
      setContributions([]);
      toast.success('All submissions cleared');
    } catch {
      toast.error('Failed to clear');
    }
    setClearConfirm(false);
  };

  const updateStartCount = async () => {
    const val = parseInt(newStartCount);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid number'); return; }
    await setDoc(doc(db, 'giveaway_meta', 'config'), { startCount: val }, { merge: true });
    setStartCount(val);
    setNewStartCount('');
    toast.success(`Start count set to ${val}`);
  };

  const resetCount = async () => {
    await setDoc(doc(db, 'giveaway_meta', 'config'), { startCount: 0 }, { merge: true });
    setStartCount(0);
    toast.success('Count reset to 0');
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
        name: winnerName || '',
        createdAt: new Date().toISOString(),
      });

      setWinnerFile(null);
      setWinnerName('');
      toast.success('Winner uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingWinner(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading giveaway data...</div>;

  return (
    <div className="space-y-6">
      {/* Stats & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{startCount + contributions.length}</p>
            <p className="text-xs text-muted-foreground">Total Participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{contributions.length}</p>
            <p className="text-xs text-muted-foreground">Actual Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{startCount}</p>
            <p className="text-xs text-muted-foreground">Start Count</p>
          </CardContent>
        </Card>
      </div>

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
          <h4 className="text-sm font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /> Upload Winner</h4>
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

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={copyEmails} disabled={contributions.length === 0}>
          <Copy className="h-4 w-4 mr-1" /> Copy All Emails ({contributions.length})
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setClearConfirm(true)} disabled={contributions.length === 0}>
          <Trash2 className="h-4 w-4 mr-1" /> Clear All
        </Button>
      </div>

      {/* Submissions Table */}
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

      {/* Image Preview Dialog */}
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
