-- Create cached_generations table for storing pre-generated AI results
CREATE TABLE IF NOT EXISTS public.cached_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_image_id TEXT NOT NULL,
  test_image_url TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('looking', 'templates')),
  prompt_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  generated_image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_image_id, prompt_type, prompt_id)
);

-- Add index for faster lookups
CREATE INDEX idx_cached_generations_test_image ON public.cached_generations(test_image_id);
CREATE INDEX idx_cached_generations_prompt ON public.cached_generations(prompt_type, prompt_id);

-- Enable RLS
ALTER TABLE public.cached_generations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (for cache mode)
CREATE POLICY "Allow anonymous read access" ON public.cached_generations
  FOR SELECT
  USING (true);

-- Allow anonymous insert access (for generating cache)
CREATE POLICY "Allow anonymous insert access" ON public.cached_generations
  FOR INSERT
  WITH CHECK (true);

-- Allow anonymous update access (for regenerating cache)
CREATE POLICY "Allow anonymous update access" ON public.cached_generations
  FOR UPDATE
  USING (true);

-- Allow anonymous delete access (for cleanup)
CREATE POLICY "Allow anonymous delete access" ON public.cached_generations
  FOR DELETE
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cached_generations_updated_at
  BEFORE UPDATE ON public.cached_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
