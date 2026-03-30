-- Allow authenticated users to check if their own email exists in newsletter_followers
CREATE POLICY "Users can check own subscription"
ON public.newsletter_followers
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));