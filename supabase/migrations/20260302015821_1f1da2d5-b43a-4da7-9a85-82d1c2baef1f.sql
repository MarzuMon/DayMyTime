-- Add explicit admin-only policies for INSERT/UPDATE/DELETE on user_roles
CREATE POLICY "Only admins can assign roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can modify roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can revoke roles"
ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add self-referral prevention to check_referral_upgrade
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

  -- Prevent self-referral
  IF _code_owner_id = NEW.referred_user_id THEN
    RAISE EXCEPTION 'Self-referral is not allowed';
  END IF;

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