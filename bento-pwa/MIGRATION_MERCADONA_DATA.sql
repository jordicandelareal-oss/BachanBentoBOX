-- ============================================================
-- MIGRACIÓN: CONFIGURACIÓN MERCADONA PoC
-- ============================================================

-- 1. Asegurar que existe el proveedor Mercadona
INSERT INTO public.providers (name, contact_person, email)
VALUES ('Mercadona', 'Automatización', 'jordicocinab@gmail.com')
ON CONFLICT (name) DO NOTHING;

-- 2. Vincular Aceite de Oliva al proveedor Mercadona y asignar SKU 4241
-- Buscamos por nombre (insensible a mayúsculas/minúsculas)
UPDATE public.ingredients
SET 
  provider_id = (SELECT id FROM public.providers WHERE name = 'Mercadona' LIMIT 1),
  provider_product_code = '4241',
  brand = 'Hacendado'
WHERE name ILIKE '%Aceite de Oliva%'
  AND (name ILIKE '%Virgen%' OR name ILIKE '%Refinado%' OR name = 'Aceite de Oliva');

-- 3. Verificación
DO $$
BEGIN
    RAISE NOTICE 'Configuración de Mercadona completada para el Aceite de Oliva.';
END $$;
