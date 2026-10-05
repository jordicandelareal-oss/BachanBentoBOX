-- ==============================================================================
-- MIGRATION: ADD SORT_ORDER TO MENU_ITEMS (TPV PRODUCT REORDERING)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase.
-- Añade la columna 'sort_order' a la tabla 'menu_items' para guardar permanentemente
-- el orden y posición de los productos y platos en la cuadrícula del TPV.

-- 1. Añadir la columna sort_order si no existe
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Asegurar que no hay bloqueos de RLS
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;

-- 3. Conceder permisos de lectura y escritura a todos los roles
GRANT ALL ON TABLE public.menu_items TO anon, authenticated, service_role;

-- 4. Notificación de éxito
COMMENT ON COLUMN public.menu_items.sort_order IS 'Posición de ordenación en la cuadrícula del TPV';
