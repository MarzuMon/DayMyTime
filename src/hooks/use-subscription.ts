import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useSubscription() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setIsSubscribed(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('newsletter_followers')
        .select('id')
        .eq('email', user.email!)
        .maybeSingle();
      setIsSubscribed(!!data);
      setLoading(false);
    };

    check();
  }, [user]);

  return { isSubscribed, loading, user };
}
