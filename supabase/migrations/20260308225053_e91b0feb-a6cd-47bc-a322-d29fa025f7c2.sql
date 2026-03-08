
-- Fix 1: Drop overly permissive SELECT policy on team_invitations
DROP POLICY IF EXISTS "Users can read own invitations" ON public.team_invitations;

-- Create restrictive SELECT policy
-- Team owners can manage invitations, authenticated users can see their own
-- For token-based lookups (accept-invite page), we use a security definer function
CREATE POLICY "Team owners can read invitations" ON public.team_invitations
FOR SELECT TO authenticated USING (
  is_team_owner(auth.uid(), team_id)
  OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow anonymous/public reads by token only via a security definer function
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invite_token uuid)
RETURNS SETOF public.team_invitations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.team_invitations
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now();
$$;

-- Fix 2: Drop the overly permissive join policy on team_members
DROP POLICY IF EXISTS "Users can join via invitation" ON public.team_members;

-- Create restrictive INSERT policy: must match invitation email or be a link invite
CREATE POLICY "Users can join via verified invitation" ON public.team_members
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE team_id = team_members.team_id
      AND status = 'pending'
      AND expires_at > now()
      AND (
        email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
        OR email LIKE 'invite-link-%@link.daymytime.com'
      )
  )
);
