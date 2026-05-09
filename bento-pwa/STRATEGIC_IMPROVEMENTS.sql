-- ============================================================
-- SCRIPT DE MEJORAS ESTRATÉGICAS v1.0
-- 1. Normalización de Proveedores
-- 2. Histórico de Precios
-- 3. Clasificación de Mermas
-- ============================================================

-- 1. TABLA DE PROVEEDORES
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    contact_info TEXT,
    min_order NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACTUALIZACIÓN DE TABLA INGREDIENTS
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id);
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS waste_type TEXT;

-- 3. MIGRACIÓN DE DATOS DE PROVEEDORES EXISTENTES
-- Insertar proveedores únicos desde la columna actual de texto
INSERT INTO public.providers (name)
SELECT DISTINCT provider FROM public.ingredients 
WHERE provider IS NOT NULL AND provider <> ''
ON CONFLICT (name) DO NOTHING;

-- Asociar los ingredientes con sus nuevos IDs de proveedor
UPDATE public.ingredients i
SET provider_id = p.id
FROM public.providers p
WHERE i.provider = p.name;

-- 4. TABLA DE HISTÓRICO DE PRECIOS
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRIGGER PARA REGISTRO AUTOMÁTICO DE PRECIOS
CREATE OR REPLACE FUNCTION public.trg_record_price_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el precio ha cambiado y no es nulo
    IF (OLD.purchase_price IS DISTINCT FROM NEW.purchase_price) AND NEW.purchase_price IS NOT NULL THEN
        INSERT INTO public.price_history (ingredient_id, price)
        VALUES (NEW.id, NEW.purchase_price);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_price_history ON public.ingredients;
CREATE TRIGGER trigger_price_history
AFTER UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION public.trg_record_price_history();

-- 6. INSERTAR PRECIO INICIAL EN EL HISTORIAL PARA TODOS LOS INGREDIENTES
-- Solo para los que no tengan historial aún
INSERT INTO public.price_history (ingredient_id, price)
SELECT id, purchase_price FROM public.ingredients
WHERE purchase_price IS NOT NULL
AND id NOT IN (SELECT DISTINCT ingredient_id FROM public.price_history);
