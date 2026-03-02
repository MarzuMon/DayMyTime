import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function AdBanner() {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setIsPro(false); return; }
    supabase.from('profiles').select('is_pro').eq('id', user.id).maybeSingle()
      .then(({ data }) => setIsPro(data?.is_pro ?? false));
  }, [user]);

  // Don't show ads for Pro users or while loading
  if (isPro === null || isPro) return null;

  return (
    <div className="w-full flex justify-center py-3">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxWidth: 728, height: 90 }}
        data-ad-client="ca-pub-4393861879798471"
        data-ad-slot="auto"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
