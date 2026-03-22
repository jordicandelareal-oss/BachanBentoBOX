-- BaChan Sales Module v2.0 - Phase 1 & 2
-- Run this as individual commands in Supabase SQL Editor

-- 1. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    total DECIMAL(10,2) DEFAULT 0.00,
    items JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    pickup_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 1b. Add columns to recipes
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category TEXT;



-- 2. Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Recursive Stock Decrement Function
CREATE OR REPLACE FUNCTION public.reduce_stock_recursive(target_recipe_id UUID, multiplier DECIMAL)
RETURNS VOID AS $$
DECLARE
    ri RECORD;
    final_stock DECIMAL;
BEGIN
    FOR ri IN SELECT * FROM public.recipe_ingredients WHERE recipe_id = target_recipe_id LOOP
        IF ri.ingredient_id IS NOT NULL THEN
            -- Direct Insumo deduction
            UPDATE public.ingredients
            SET stock = stock - (ri.quantity * multiplier)
            WHERE id = ri.ingredient_id
            RETURNING stock INTO final_stock;

            -- Phase 2 validation: Auto-Agotado
            IF final_stock <= 0 THEN
                UPDATE public.menu_items
                SET is_active = false
                WHERE recipe_id = target_recipe_id;
            END IF;

        ELSIF ri.sub_recipe_id IS NOT NULL THEN
            -- Recurse into Elaboración
            PERFORM public.reduce_stock_recursive(ri.sub_recipe_id, ri.quantity * multiplier);
        END IF;
    END FOR;
END;
$$ LANGUAGE plpgsql;


-- 4. RLS Policies
-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- menu_items: Public read
DROP POLICY IF EXISTS "Public read menu_items" ON public.menu_items;
CREATE POLICY "Public read menu_items" ON public.menu_items FOR SELECT TO public USING (is_active = true);

-- orders: Public Insert, Admin Read/Update
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can manage orders" ON public.orders;
CREATE POLICY "Admin can manage orders" ON public.orders FOR ALL TO authenticated USING (true);
