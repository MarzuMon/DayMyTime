
-- Referral codes table
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Referral signups tracking
CREATE TABLE public.referral_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id),
  referred_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;

-- Policies for referral_codes
CREATE POLICY "Users can read own referral codes" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral codes" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for referral_signups
CREATE POLICY "Anyone can insert referral signups" ON public.referral_signups
  FOR INSERT WITH CHECK (auth.uid() = referred_user_id);

CREATE POLICY "Code owners can read their referral signups" ON public.referral_signups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.referral_codes rc
      WHERE rc.id = referral_code_id AND rc.user_id = auth.uid()
    )
  );

-- Function to check and auto-upgrade referrers
CREATE OR REPLACE FUNCTION public.check_referral_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _code_owner_id uuid;
  _signup_count integer;
BEGIN
  -- Get the code owner
  SELECT user_id INTO _code_owner_id
  FROM referral_codes WHERE id = NEW.referral_code_id;

  -- Count total signups for this code
  SELECT COUNT(*) INTO _signup_count
  FROM referral_signups WHERE referral_code_id = NEW.referral_code_id;

  -- If 20 or more, upgrade to pro for 1 month
  IF _signup_count >= 20 THEN
    UPDATE profiles SET is_pro = true WHERE id = _code_owner_id;
    
    INSERT INTO subscriptions (user_id, plan, amount, status, started_at, expires_at)
    VALUES (
      _code_owner_id,
      'referral',
      0,
      'active',
      now(),
      now() + interval '1 month'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_referral_signup
  AFTER INSERT ON public.referral_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_upgrade();
