CREATE POLICY "Admins can delete subscribers"
ON public.newsletter_followers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));