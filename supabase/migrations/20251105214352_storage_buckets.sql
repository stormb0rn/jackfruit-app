-- Create storage buckets for identity photos and transformations

-- Identity photos bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'identity-photos',
    'identity-photos',
    false,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Transformations bucket (private by default, can be made public per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'transformations',
    'transformations',
    false,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for identity-photos bucket
CREATE POLICY "Users can upload their own identity photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'identity-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own identity photos"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'identity-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own identity photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'identity-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for transformations bucket
CREATE POLICY "Users can upload their own transformations"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'transformations' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own transformations"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'transformations' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view public transformations"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'transformations' AND
        (storage.foldername(name))[2] = 'public'
    );
