import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface SeoKeyword {
  id: string;
  keyword: string;
  created_at: string;
}

export default function SeoKeywordsTab() {
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
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
          {/* Add keyword */}
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
