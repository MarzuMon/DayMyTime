
-- 1. SUBSCRIPTIONS: Remove insecure INSERT and UPDATE policies
DROP POLICY IF EXISTS "Service can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service can update subscriptions" ON subscriptions;

-- Keep only SELECT for users
-- "Users can read own subscriptions" already exists with (auth.uid() = user_id)

-- 2. CONTACT MESSAGES: Fix INSERT policy that uses TRUE
DROP POLICY IF EXISTS "Authenticated users can insert contact messages" ON contact_messages;
CREATE POLICY "Authenticated users can insert contact messages"
ON contact_messages FOR INSERT TO authenticated
WITH CHECK (true);

-- 3. PROMOTIONS: Restrict reads to authenticated users only
DROP POLICY IF EXISTS "Anyone can read active promotions" ON promotions;
CREATE POLICY "Authenticated users can read active promotions"
ON promotions FOR SELECT TO authenticated
USING (is_active = true);

-- 4. STORAGE: Add RLS policies for avatars bucket objects
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
