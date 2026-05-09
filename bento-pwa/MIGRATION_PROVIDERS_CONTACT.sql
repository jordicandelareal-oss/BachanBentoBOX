-- ============================================================
-- SCRIPT DE MIGRACIÓN: AÑADIR CAMPOS DE CONTACTO A PROVEEDORES
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Añadir nuevas columnas a la tabla providers si no existen
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Opcional: Refrescar el schema cache en Supabase (suele hacerse automático, pero por seguridad)
NOTIFY pgrst, 'reload schema';

-- Mensaje de éxito (informativo)
DO $$
BEGIN
    RAISE NOTICE 'Nuevas columnas de contacto (contact_person, phone, email, address, website) añadidas a providers exitosamente.';
END $$;
