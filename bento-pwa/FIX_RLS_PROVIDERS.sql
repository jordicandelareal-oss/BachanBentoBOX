-- ============================================================
-- SCRIPT DE CORRECCIÓN DE SEGURIDAD (RLS) PARA PROVEEDORES
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Habilitar RLS en la tabla
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas si existen para evitar conflictos
DROP POLICY IF EXISTS "Allow public select" ON public.providers;
DROP POLICY IF EXISTS "Allow public insert" ON public.providers;
DROP POLICY IF EXISTS "Allow public update" ON public.providers;
DROP POLICY IF EXISTS "Allow public delete" ON public.providers;

-- 3. Crear nuevas políticas (Acceso Público para consistencia con la App)
-- Si prefieres restringir a usuarios autenticados, cambia 'true' por 'auth.role() = 'authenticated''
CREATE POLICY "Allow public select" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.providers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.providers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.providers FOR DELETE USING (true);

-- 4. Asegurar que la tabla ingredients también tenga acceso para las relaciones
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all" ON public.ingredients;
CREATE POLICY "Allow public all" ON public.ingredients FOR ALL USING (true);

-- NOTA: Una vez ejecutado este script, el error 'RLS policy violation' desaparecerá.
