
-- Allow users to insert themselves as team members when they have a valid pending invitation
CREATE POLICY "Users can join via invitation"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE team_invitations.team_id = team_members.team_id
    AND team_invitations.status = 'pending'
    AND team_invitations.expires_at > now()
  )
);
