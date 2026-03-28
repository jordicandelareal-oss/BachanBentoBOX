-- v7_menu_categories.sql
-- Create menu categories table for dynamic POS tabs

CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  sort_order int DEFAULT 0,
  icon_name text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Add relation to recipes so the user can choose a category for the final product
ALTER TABLE public.recipes 
  ADD COLUMN IF NOT EXISTS menu_category_id uuid REFERENCES public.menu_categories(id);

-- Add relation to menu_items to filter in the POS
ALTER TABLE public.menu_items 
  ADD COLUMN IF NOT EXISTS menu_category_id uuid REFERENCES public.menu_categories(id);

-- Insert default base categories to match the previous hardcoded ones
INSERT INTO menu_categories (name, sort_order, icon_name) VALUES
('Bentos', 1, 'Utensils'),
('Bebidas', 2, 'Coffee'),
('Extras', 3, 'Sparkles');

-- Auto-migrate existing 'bento' recipes to the 'Bentos' category
DO $$
DECLARE
  v_bentos_id uuid;
  v_bebidas_id uuid;
  v_extras_id uuid;
BEGIN
  SELECT id INTO v_bentos_id FROM menu_categories WHERE name = 'Bentos' LIMIT 1;
  SELECT id INTO v_bebidas_id FROM menu_categories WHERE name = 'Bebidas' LIMIT 1;
  SELECT id INTO v_extras_id FROM menu_categories WHERE name = 'Extras' LIMIT 1;

  -- Migrate recipes
  UPDATE public.recipes SET menu_category_id = v_bentos_id WHERE recipe_type = 'bento' AND menu_category_id IS NULL;
  UPDATE public.recipes SET menu_category_id = v_bebidas_id WHERE recipe_type = 'bebida' AND menu_category_id IS NULL;
  UPDATE public.recipes SET menu_category_id = v_extras_id WHERE recipe_type = 'extra' AND menu_category_id IS NULL;

  -- Migrate menu_items based on their recipe
  UPDATE public.menu_items mi
  SET menu_category_id = r.menu_category_id
  FROM public.recipes r
  WHERE mi.recipe_id = r.id AND mi.menu_category_id IS NULL;
END $$;
