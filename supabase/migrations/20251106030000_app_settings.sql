-- Create app_settings table for global application settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    cache_mode_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.app_settings (id, cache_mode_enabled)
VALUES ('global', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Anyone can read app settings"
    ON public.app_settings FOR SELECT
    USING (true);

-- Allow anyone to update settings (for admin functionality)
-- In production, you might want to restrict this to authenticated admins
CREATE POLICY "Anyone can update app settings"
    ON public.app_settings FOR UPDATE
    USING (true);
