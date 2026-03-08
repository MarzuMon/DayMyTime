-- Create schedule-images storage bucket (public so images are viewable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('schedule-images', 'schedule-images', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload schedule images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'schedule-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view schedule images (public bucket)
CREATE POLICY "Anyone can view schedule images"
ON storage.objects FOR SELECT
USING (bucket_id = 'schedule-images');

-- Allow users to delete their own schedule images
CREATE POLICY "Users can delete own schedule images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'schedule-images' AND (storage.foldername(name))[1] = auth.uid()::text);