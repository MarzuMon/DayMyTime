
DO $$
DECLARE _jid bigint;
BEGIN
  SELECT jobid INTO _jid FROM cron.job WHERE jobname = 'check-subscription-expiry-daily';
  IF _jid IS NOT NULL THEN PERFORM cron.unschedule(_jid); END IF;
END $$;

DROP FUNCTION IF EXISTS public.check_subscription_expiry() CASCADE;
DROP FUNCTION IF EXISTS public.check_referral_upgrade() CASCADE;
DROP FUNCTION IF EXISTS public.set_admin_pro() CASCADE;
DROP FUNCTION IF EXISTS public.get_giveaway_count() CASCADE;

DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.giveaway_contributions CASCADE;
DROP TABLE IF EXISTS public.giveaway_winners CASCADE;
DROP TABLE IF EXISTS public.giveaway_config CASCADE;
DROP TABLE IF EXISTS public.referral_signups CASCADE;
DROP TABLE IF EXISTS public.referral_codes CASCADE;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_pro;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
