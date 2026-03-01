
-- Trigger function: auto-set is_pro = true when a user gets the admin role
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

-- Trigger on user_roles insert/update
CREATE TRIGGER on_admin_role_set_pro
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_admin_pro();

-- Also allow admins to update any profile's is_pro status
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
