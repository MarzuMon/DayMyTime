import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export function useAdminSetting<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from('admin_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value != null) setValue(data.value as unknown as T);
        setLoading(false);
      });
  }, [key]);

  const save = useCallback(async (newValue: T) => {
    setValue(newValue);
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key, value: newValue as unknown as Json, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: `${key} settings updated.` });
    }
  }, [key, toast]);

  return { value, setValue, save, loading };
}
