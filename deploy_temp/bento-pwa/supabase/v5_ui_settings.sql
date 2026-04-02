-- BaChan TPV Interface v2.0 - UI Settings Sync
-- Run this in Supabase SQL Editor

-- 1. Add sort_order to recipes
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Update existing recipes if needed (they default to 0)
-- No action needed, but can be manually adjusted later.
