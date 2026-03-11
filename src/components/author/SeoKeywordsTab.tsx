import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Search, Upload, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface SeoKeyword {
  id: string;
  keyword: string;
  created_at: string;
}

export default function SeoKeywordsTab() {
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchKeywords = async () => {
    const { data, error } = await supabase
      .from('seo_keywords')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setKeywords(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchKeywords(); }, []);

  const addKeyword = async () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    if (keywords.some(k => k.keyword.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Keyword already exists');
      return;
    }
    const { error } = await supabase.from('seo_keywords').insert({ keyword: trimmed });
    if (error) { toast.error('Failed to add keyword'); return; }
    toast.success('Keyword added');
    setNewKeyword('');
    fetchKeywords();
  };

  const bulkImport = async () => {
    const lines = bulkInput
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (lines.length === 0) {
      toast.error('No keywords to import');
      return;
    }

    const existingSet = new Set(keywords.map(k => k.keyword.toLowerCase()));
    const newOnes = lines.filter(l => !existingSet.has(l.toLowerCase()));
    const duplicateCount = lines.length - newOnes.length;

    if (newOnes.length === 0) {
      toast.error('All keywords already exist');
      return;
    }

    const { error } = await supabase
      .from('seo_keywords')
      .insert(newOnes.map(keyword => ({ keyword })));

    if (error) { toast.error('Failed to import keywords'); return; }

    toast.success(`Imported ${newOnes.length} keyword${newOnes.length > 1 ? 's' : ''}${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ''}`);
    setBulkInput('');
    setShowBulk(false);
    fetchKeywords();
  };

  const exportKeywords = () => {
    if (keywords.length === 0) {
      toast.error('No keywords to export');
      return;
    }
    const text = keywords.map(k => k.keyword).join(', ');
    navigator.clipboard.writeText(text);
    toast.success(`${keywords.length} keywords copied to clipboard`);
  };

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase.from('seo_keywords').delete().eq('id', id);
    if (error) { toast.error('Failed to delete keyword'); return; }
    toast.success('Keyword deleted');
    fetchKeywords();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> SEO Trending Keywords
          </CardTitle>
          <CardDescription>
            Manage keywords that populate the site's meta keywords tag dynamically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add single keyword */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter a keyword..."
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              className="flex-1"
            />
            <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          {/* Bulk actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulk(!showBulk)}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Bulk Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportKeywords} disabled={keywords.length === 0}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Export All
            </Button>
          </div>

          {/* Bulk import textarea */}
          {showBulk && (
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Paste multiple keywords separated by commas or new lines:
              </p>
              <Textarea
                placeholder="keyword1, keyword2&#10;keyword3&#10;keyword4, keyword5"
                value={bulkInput}
                onChange={e => setBulkInput(e.target.value)}
                rows={4}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={bulkImport} disabled={!bulkInput.trim()}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Import
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowBulk(false); setBulkInput(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Keyword list */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
            </div>
          ) : keywords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No keywords added yet.</p>
          ) : (
            <div className="space-y-1.5">
              {keywords.map(k => (
                <div key={k.id} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium">{k.keyword}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteKeyword(k.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          {keywords.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Meta Tag Preview:</p>
              <code className="text-xs text-foreground break-all">
                {`<meta name="keywords" content="${keywords.map(k => k.keyword).join(', ')}" />`}
              </code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
