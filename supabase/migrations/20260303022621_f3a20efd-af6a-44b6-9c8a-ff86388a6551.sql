-- Make custom-tones bucket private to prevent public URL access
UPDATE storage.buckets SET public = false WHERE id = 'custom-tones';