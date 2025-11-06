-- Create prompt_config table to store AI prompt configurations
CREATE TABLE IF NOT EXISTS public.prompt_config (
    id TEXT PRIMARY KEY,
    config_type TEXT NOT NULL CHECK (config_type IN ('looking', 'templates')),
    config_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_prompt_config_type ON public.prompt_config(config_type);

-- Enable RLS
ALTER TABLE public.prompt_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read prompt configurations
CREATE POLICY "Anyone can read prompt config"
    ON public.prompt_config FOR SELECT
    USING (true);

-- Allow anyone to insert/update prompt configurations
-- In production, restrict this to authenticated admins only
CREATE POLICY "Anyone can insert prompt config"
    ON public.prompt_config FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update prompt config"
    ON public.prompt_config FOR UPDATE
    USING (true);

-- Insert default configurations from JSON files
-- Looking prompts
INSERT INTO public.prompt_config (id, config_type, config_data)
VALUES ('looking', 'looking', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Template prompts
INSERT INTO public.prompt_config (id, config_type, config_data)
VALUES ('templates', 'templates', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
