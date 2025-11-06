-- Modify cached_generations table to support multiple image URLs per template
-- Change generated_image_url from TEXT to JSONB array

-- Step 1: Add new column
ALTER TABLE public.cached_generations
ADD COLUMN generated_image_urls JSONB DEFAULT NULL;

-- Step 2: Migrate existing data - convert single URL string to JSON array
UPDATE public.cached_generations
SET generated_image_urls = jsonb_build_array(generated_image_url)
WHERE generated_image_url IS NOT NULL AND generated_image_url != '';

-- Step 3: Drop the old column and rename the new one
ALTER TABLE public.cached_generations
DROP COLUMN generated_image_url;

ALTER TABLE public.cached_generations
RENAME COLUMN generated_image_urls TO generated_image_url;

-- Step 4: Update column constraints
ALTER TABLE public.cached_generations
ALTER COLUMN generated_image_url SET NOT NULL;

-- Step 5: Add comment explaining the new format
COMMENT ON COLUMN public.cached_generations.generated_image_url IS
'JSON array of generated image URLs. For templates: [url1, url2, url3]. For looking: [url]';
