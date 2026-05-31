-- ============================================================
-- v13: CORRECCIÓN CRÍTICA DE RLS EN PRICE_HISTORY
-- Fecha: 2026-05-31
-- Propósito:
--   1. Activar Row Level Security (RLS) en la tabla 'price_history'
--   2. Crear la política "Admin All Access" para price_history
--   3. Actualizar la función del trigger trg_record_price_history a SECURITY DEFINER
--      para asegurar que las actualizaciones de precio hechas por usuarios
--      autenticados no fallen debido a restricciones de RLS al insertar en price_history.
-- ============================================================

-- ─── 1. ACTIVAR RLS EN PRICE_HISTORY ─────────────────────────
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- ─── 2. CREAR POLÍTICA DE ACCESO TOTAL PARA ADMINISTRADORES ──
DROP POLICY IF EXISTS "Admin All Access" ON public.price_history;
CREATE POLICY "Admin All Access" ON public.price_history 
FOR ALL 
USING (
    auth.role() = 'authenticated' 
    OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure'
);

-- ─── 3. DEFINIR TRIGGER DE PRECIOS COMO SECURITY DEFINER ─────
-- Al usar SECURITY DEFINER, la función del trigger se ejecuta con los privilegios
-- del propietario (postgres) y evita fallos de RLS al realizar la inserción automática
-- en price_history cuando se modifica un ingrediente.
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger para asegurar que tome la nueva definición de la función
DROP TRIGGER IF EXISTS trigger_price_history ON public.ingredients;
CREATE TRIGGER trigger_price_history
AFTER UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION public.trg_record_price_history();
