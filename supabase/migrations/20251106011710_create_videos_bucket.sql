-- Create videos bucket for storing video assets (landing page background, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
);

-- Allow public read access to all videos
CREATE POLICY "Public Access to Videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Optional: Allow authenticated users to upload videos (can be removed if not needed)
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated'
);
