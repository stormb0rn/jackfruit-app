-- Extend cached_generations table to support both admin cache and user generations

-- Add new columns
ALTER TABLE public.cached_generations
  ADD COLUMN IF NOT EXISTS is_admin_cache BOOLEAN DEFAULT false;

ALTER TABLE public.cached_generations
  ADD COLUMN IF NOT EXISTS generation_source TEXT DEFAULT 'admin' CHECK (generation_source IN ('admin', 'edit_look', 'template'));

-- Remove the old unique constraint that only allows one entry per (test_image_id, prompt_type, prompt_id)
-- This was preventing users from generating multiple times with the same prompt
ALTER TABLE public.cached_generations
  DROP CONSTRAINT IF EXISTS cached_generations_test_image_id_prompt_type_prompt_id_key;

-- Create a partial unique index for admin caches only
-- This ensures admin pre-generated caches are unique, but allows multiple user generations
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_admin_cache
  ON public.cached_generations(test_image_id, prompt_type, prompt_id)
  WHERE is_admin_cache = true;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cached_generations_is_admin_cache
  ON public.cached_generations(is_admin_cache);

CREATE INDEX IF NOT EXISTS idx_cached_generations_generation_source
  ON public.cached_generations(generation_source);

-- Create index for user generation queries (ordered by creation time for recent generations)
CREATE INDEX IF NOT EXISTS idx_cached_generations_user_recent
  ON public.cached_generations(is_admin_cache, created_at DESC)
  WHERE is_admin_cache = false;

-- Update existing admin cached data to have is_admin_cache = true
UPDATE public.cached_generations
  SET is_admin_cache = true, generation_source = 'admin'
  WHERE is_admin_cache IS NULL OR is_admin_cache = false;

-- Add comment to explain the new columns
COMMENT ON COLUMN public.cached_generations.is_admin_cache IS 'Flag to distinguish admin pre-generated cache (true) from user generations (false)';
COMMENT ON COLUMN public.cached_generations.generation_source IS 'Source of generation: admin (pre-generated cache), edit_look (from EditLook page), or template (from Templates page)';
