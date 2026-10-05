-- ============================================================================
-- FIX MENU_CATEGORIES RLS & SORT ORDER
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard/project/qicwnfswitplggwtmmsp/sql)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sort_order INT DEFAULT 1,
    icon_name TEXT DEFAULT 'BookOpen',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS y permitir lectura/escritura pública y autenticada
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for menu_categories" ON public.menu_categories;
CREATE POLICY "Allow all for menu_categories" ON public.menu_categories FOR ALL USING (true) WITH CHECK (true);

-- Insertar categorías iniciales si no existen
INSERT INTO public.menu_categories (name, sort_order, icon_name, is_active)
SELECT 'Bentos', 1, 'Utensils', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE name ILIKE 'Bentos');

INSERT INTO public.menu_categories (name, sort_order, icon_name, is_active)
SELECT 'Extras', 2, 'Sparkles', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE name ILIKE 'Extras');

INSERT INTO public.menu_categories (name, sort_order, icon_name, is_active)
SELECT 'Bebidas', 3, 'Coffee', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE name ILIKE 'Bebidas');

INSERT INTO public.menu_categories (name, sort_order, icon_name, is_active)
SELECT 'Sushi', 4, 'Utensils', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE name ILIKE 'Sushi');

INSERT INTO public.menu_categories (name, sort_order, icon_name, is_active)
SELECT 'E-Bentos', 5, 'ShoppingBag', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE name ILIKE 'E-Bentos');

INSERT INTO public.menu_categories (name, sort_order, icon_name, is_active)
SELECT 'Arroz', 6, 'Utensils', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE name ILIKE 'Arroz');
