-- ============================================================
-- SCRIPT: FIX WASTE LOGIC AND COST CALCULATION v1.0
-- Propósito: Automatizar el cálculo de cost_per_unit en ingredients.
-- Incluye la lógica de Merma (Negativo) e Hidratación (Positivo).
-- ============================================================

-- 1. Función de cálculo de coste por unidad para ingredientes
CREATE OR REPLACE FUNCTION public.calculate_ingredient_cost_per_unit(
    p_purchase_price NUMERIC,
    p_purchase_format NUMERIC,
    p_waste_percentage NUMERIC,
    p_unit_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    v_unit_name TEXT;
    v_is_weight BOOLEAN;
    v_gross_cost NUMERIC;
    v_net_cost NUMERIC;
    v_yield_factor NUMERIC;
BEGIN
    -- Obtener el nombre de la unidad para saber si es peso/volumen
    SELECT name INTO v_unit_name FROM public.units WHERE id = p_unit_id;
    
    v_is_weight := (lower(v_unit_name) LIKE '%peso%' OR lower(v_unit_name) LIKE '%kg%' OR lower(v_unit_name) LIKE '%l%');

    -- Evitar división por cero en el formato
    IF COALESCE(p_purchase_format, 0) = 0 THEN
        RETURN 0;
    END IF;

    -- Coste Bruto (sin merma)
    IF v_is_weight THEN
        v_gross_cost := (p_purchase_price / p_purchase_format) * 1000; -- Precio por KG/L
    ELSE
        v_gross_cost := (p_purchase_price / p_purchase_format); -- Precio por Unidad
    END IF;

    -- Factor de Rendimiento (Yield Factor)
    -- Lógica del sistema: Positivo = Hidratación/Ganancia, Negativo = Merma/Pérdida
    -- Fórmula: yield = 1 + (waste_percentage / 100)
    v_yield_factor := 1 + (COALESCE(p_waste_percentage, 0) / 100.0);
    
    -- Evitar división por cero si el factor de rendimiento es 0 (improbable pero posible)
    IF v_yield_factor <= 0 THEN
        v_net_cost := v_gross_cost; -- Fallback al bruto
    ELSE
        v_net_cost := v_gross_cost / v_yield_factor;
    END IF;

    -- Redondear a 4 decimales para cálculos internos (la UI mostrará 2)
    RETURN ROUND(v_net_cost, 4);
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Trigger para actualizar cost_per_unit automáticamente
CREATE OR REPLACE FUNCTION public.trg_on_ingredient_change_recalc_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular coste si cambian los campos clave
    IF (TG_OP = 'INSERT') OR 
       (OLD.purchase_price IS DISTINCT FROM NEW.purchase_price) OR
       (OLD.purchase_format IS DISTINCT FROM NEW.purchase_format) OR
       (OLD.waste_percentage IS DISTINCT FROM NEW.waste_percentage) OR
       (OLD.unit_id IS DISTINCT FROM NEW.unit_id) OR
       (OLD.calculation_type IS DISTINCT FROM NEW.calculation_type)
    THEN
        NEW.cost_per_unit := public.calculate_ingredient_cost_per_unit(
            NEW.purchase_price,
            NEW.purchase_format,
            NEW.waste_percentage,
            NEW.unit_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_ingredient_cost ON public.ingredients;
CREATE TRIGGER trigger_recalculate_ingredient_cost
BEFORE INSERT OR UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION public.trg_on_ingredient_change_recalc_cost();

-- 3. Sincronizar datos existentes
UPDATE public.ingredients
SET cost_per_unit = public.calculate_ingredient_cost_per_unit(
    purchase_price,
    purchase_format,
    waste_percentage,
    unit_id
)
WHERE purchase_format > 0;

-- 4. Notificar a las recetas que dependen de estos ingredientes (esto lo hace el trigger existente en fix_unit_costs_v2.sql)
-- Pero por si acaso, forzamos una actualización de las recetas.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.recipes LOOP
        -- La función update_recipe_unit_cost existe según scripts anteriores
        PERFORM public.update_recipe_unit_cost(r.id);
    END LOOP;
END $$;
