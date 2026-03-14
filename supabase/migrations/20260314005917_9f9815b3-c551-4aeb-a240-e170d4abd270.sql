-- Add image_align and second image columns to both tables
ALTER TABLE public.history_posts 
  ADD COLUMN IF NOT EXISTS image_align text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS featured_image_2 text;

ALTER TABLE public.daily_tips 
  ADD COLUMN IF NOT EXISTS image_align text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS featured_image_2 text;

-- Create storage bucket for content images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read content images
CREATE POLICY "Anyone can read content images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'content-images');

-- Allow admins to upload content images
CREATE POLICY "Admins can upload content images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete content images
CREATE POLICY "Admins can delete content images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'content-images' AND public.has_role(auth.uid(), 'admin'));