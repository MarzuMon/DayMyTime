
-- Fix function search_path: check_referral_upgrade
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
  SELECT user_id INTO _code_owner_id
  FROM referral_codes WHERE id = NEW.referral_code_id;

  IF _code_owner_id = NEW.referred_user_id THEN
    RAISE EXCEPTION 'Self-referral is not allowed';
  END IF;

  SELECT COUNT(*) INTO _signup_count
  FROM referral_signups WHERE referral_code_id = NEW.referral_code_id;

  IF _signup_count >= 20 THEN
    UPDATE profiles SET is_pro = true WHERE id = _code_owner_id;
    INSERT INTO subscriptions (user_id, plan, amount, status, started_at, expires_at)
    VALUES (_code_owner_id, 'referral', 0, 'active', now(), now() + interval '1 month');
  END IF;

  RETURN NEW;
END;
$$;

-- Fix function search_path: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$;

-- Fix function search_path: check_subscription_expiry
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE subscriptions SET status = 'expired'
  WHERE status = 'active' AND expires_at < now();
  
  UPDATE profiles SET is_pro = false
  WHERE is_pro = true
    AND id NOT IN (SELECT user_id FROM subscriptions WHERE status = 'active')
    AND id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin');
END;
$$;

-- Fix function search_path: set_admin_pro
CREATE OR REPLACE FUNCTION public.set_admin_pro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    UPDATE public.profiles SET is_pro = true WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix function search_path: move_to_dlq
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Fix function search_path: read_email_batch
CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

-- Fix function search_path: delete_email
CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

-- Fix function search_path: enqueue_email
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

-- Strengthen referral_signups INSERT policy to verify referral_code exists
DROP POLICY IF EXISTS "Users can insert own referral signups" ON public.referral_signups;
CREATE POLICY "Users can insert own referral signups"
ON public.referral_signups
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = referred_user_id)
  AND (EXISTS (SELECT 1 FROM referral_codes rc WHERE rc.id = referral_signups.referral_code_id))
  AND (NOT EXISTS (SELECT 1 FROM referral_codes rc WHERE rc.id = referral_signups.referral_code_id AND rc.user_id = auth.uid()))
);
