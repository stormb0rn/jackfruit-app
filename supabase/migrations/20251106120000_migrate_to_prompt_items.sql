-- Migrate from prompt_config to prompt_items table
-- This migration creates the new prompt_items table with individual records for each item

-- 1. Create new prompt_items table
CREATE TABLE IF NOT EXISTS public.prompt_items (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('looking', 'templates')),
    name TEXT NOT NULL,
    prompts JSONB NOT NULL,
    image_path TEXT,
    enabled BOOLEAN DEFAULT true,
    display_order INTEGER NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_prompt_items_category ON public.prompt_items(category, deleted_at);
CREATE INDEX IF NOT EXISTS idx_prompt_items_order ON public.prompt_items(category, display_order, deleted_at);

-- 3. Enable RLS
ALTER TABLE public.prompt_items ENABLE ROW LEVEL SECURITY;

-- 4. Allow anyone to read prompt items
CREATE POLICY "Anyone can read prompt items"
    ON public.prompt_items FOR SELECT
    USING (true);

-- 5. Allow anyone to insert/update/delete prompt items
-- In production, restrict this to authenticated admins only
CREATE POLICY "Anyone can insert prompt items"
    ON public.prompt_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update prompt items"
    ON public.prompt_items FOR UPDATE
    USING (true);

CREATE POLICY "Anyone can delete prompt items"
    ON public.prompt_items FOR DELETE
    USING (true);

-- 6. Drop old prompt_config table
DROP TABLE IF EXISTS public.prompt_config CASCADE;
