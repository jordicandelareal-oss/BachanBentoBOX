-- v11_fix_menu_items_rls.sql
-- Desactivación TOTAL de RLS para menu_items según solicitud del usuario

-- 1. Desactivar Row Level Security para eliminar cualquier bloqueo de permisos
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas previas para evitar conflictos si se reactiva en el futuro
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.menu_items;
DROP POLICY IF EXISTS "Enable read access for all" ON public.menu_items;

-- NOTA: Con RLS desactivado, cualquier cliente con la anon key o service role puede realizar 
-- operaciones CRUD en esta tabla. Esto asegura el funcionamiento inmediato para la creación de packs.
