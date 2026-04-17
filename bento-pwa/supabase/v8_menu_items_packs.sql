-- v8_menu_items_packs.sql
-- Evolution of menu_items to support packs and multiple prices per recipe/ingredient

-- 1. Add new columns to menu_items
ALTER TABLE public.menu_items 
  ADD COLUMN IF NOT EXISTS recipe_id uuid REFERENCES public.recipes(id),
  ADD COLUMN IF NOT EXISTS ingredient_id uuid REFERENCES public.ingredients(id),
  ADD COLUMN IF NOT EXISTS quantity_multiplier numeric DEFAULT 1;

-- 2. Handle ID migration (Switching from shared ID to unique ID)
-- First, ensure gen_random_uuid is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a temporary backup of old IDs (which are currently the recipe/ingredient IDs)
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS legacy_base_id text;
UPDATE public.menu_items SET legacy_base_id = id::text;

-- Attempt to populate recipe_id/ingredient_id from existing IDs
-- We do this before changing the ID to a random one
UPDATE public.menu_items mi
SET recipe_id = mi.id::uuid
FROM public.recipes r
WHERE mi.id::uuid = r.id;

UPDATE public.menu_items mi
SET ingredient_id = mi.id::uuid
FROM public.ingredients i
WHERE mi.id::uuid = i.id;

-- 3. Transition to unique UUIDs for PRIMARY KEY
-- This is tricky if other tables reference menu_items.id.
-- We set REPLICA IDENTITY FULL to allow updates during the transition (Supabase characteristic)
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;

-- Drop PK and assign new unique IDs
ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS menu_items_pkey CASCADE;
UPDATE public.menu_items SET id = gen_random_uuid();
ALTER TABLE public.menu_items ADD PRIMARY KEY (id);

-- Reset REPLICA IDENTITY to DEFAULT once PK is back
ALTER TABLE public.menu_items REPLICA IDENTITY DEFAULT;

-- 4. Enable RLS and other settings if they were lost / ensure they are set
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
