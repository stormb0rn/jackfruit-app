-- Allow anonymous users to delete files from anonymous folder
CREATE POLICY "Anyone can delete from anonymous folder"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'identity-photos' AND
        (storage.foldername(name))[1] = 'anonymous'
    );
