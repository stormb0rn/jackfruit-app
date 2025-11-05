-- Allow anonymous users to upload identity photos to the anonymous folder

CREATE POLICY "Anyone can upload to anonymous folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'identity-photos' AND
        (storage.foldername(name))[1] = 'anonymous'
    );

CREATE POLICY "Anyone can read from anonymous folder"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'identity-photos' AND
        (storage.foldername(name))[1] = 'anonymous'
    );

-- Make the identity-photos bucket public so anonymous uploads can be accessed
UPDATE storage.buckets
SET public = true
WHERE id = 'identity-photos';
