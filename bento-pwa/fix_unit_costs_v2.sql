-- ============================================================
-- SCRIPT DE UNIFICACIÓN DE COSTES v6.0 (AGENTE AUDITORÍA)
-- Propósito: Garantizar que cost_per_portion siempre sea unitario (€/kg o €/ud).
-- Corrige regresión donde se guardaba el total.
-- ============================================================

-- 1. FUNCIÓN DE CÁLCULO DE SUMA TOTAL (Voz de la verdad)
CREATE OR REPLACE FUNCTION public.calculate_recipe_total_cost(p_recipe_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_total_sum NUMERIC := 0;
    v_item RECORD;
BEGIN
    FOR v_item IN
        SELECT
            ri.quantity,
            i.cost_per_unit              AS ing_cost,
            u.name                       AS ing_unit_name,
            cr.cost_per_portion          AS child_unit_cost,
            cr.yield_scenario            AS child_scenario
        FROM public.recipe_ingredients ri
        LEFT JOIN public.ingredients  i  ON ri.ingredient_id    = i.id
        LEFT JOIN public.units        u  ON i.unit_id           = u.id
        LEFT JOIN public.recipes      cr ON ri.child_recipe_id  = cr.id
        WHERE ri.recipe_id = p_recipe_id
    LOOP
        -- CASO 1: Ingrediente Base
        IF v_item.ing_cost IS NOT NULL THEN
            -- Si es KG/L (basado en nombre de la unidad), dividimos por 1000
            IF lower(v_item.ing_unit_name) LIKE '%peso%' OR lower(v_item.ing_unit_name) LIKE '%kg%' OR lower(v_item.ing_unit_name) LIKE '%l%' THEN
                v_total_sum := v_total_sum + ((v_item.quantity / 1000.0) * v_item.ing_cost);
            ELSE
                v_total_sum := v_total_sum + (v_item.quantity * v_item.ing_cost);
            END IF;

        -- CASO 2: Elaboración (Sub-receta)
        ELSIF v_item.child_unit_cost IS NOT NULL THEN
            IF v_item.child_scenario = 'weight' THEN
                v_total_sum := v_total_sum + ((v_item.quantity / 1000.0) * v_item.child_unit_cost);
            ELSE
                v_total_sum := v_total_sum + (v_item.quantity * v_item.child_unit_cost);
            END IF;
        END IF;
    END LOOP;

    RETURN COALESCE(v_total_sum, 0);
END;
$$ LANGUAGE plpgsql;

-- 2. FUNCIÓN PARA ACTUALIZAR COSTES UNITARIOS
CREATE OR REPLACE FUNCTION public.update_recipe_unit_cost(p_recipe_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_sum NUMERIC;
    v_scenario TEXT;
    v_portions NUMERIC;
    v_net_yield NUMERIC;
    v_unit_cost NUMERIC;
BEGIN
    SELECT yield_scenario, portions, net_yield 
    INTO v_scenario, v_portions, v_net_yield
    FROM public.recipes WHERE id = p_recipe_id;

    v_total_sum := public.calculate_recipe_total_cost(p_recipe_id);

    IF v_scenario = 'weight' THEN
        -- €/kg = (Total / gramos) * 1000
        v_unit_cost := (v_total_sum / NULLIF(v_net_yield, 0)) * 1000;
    ELSE
        -- €/ud = Total / unidades
        v_unit_cost := v_total_sum / NULLIF(v_portions, 0);
    END IF;

    UPDATE public.recipes 
    SET cost_per_portion = COALESCE(v_unit_cost, 0)
    WHERE id = p_recipe_id;
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER: Automatizar actualización al cambiar ingredientes o cantidades
CREATE OR REPLACE FUNCTION public.trg_on_recipe_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.update_recipe_unit_cost(OLD.recipe_id);
        RETURN OLD;
    ELSE
        PERFORM public.update_recipe_unit_cost(NEW.recipe_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_recipe_cost ON public.recipe_ingredients;
CREATE TRIGGER trigger_recalculate_recipe_cost
AFTER INSERT OR UPDATE OR DELETE ON public.recipe_ingredients
FOR EACH ROW EXECUTE FUNCTION public.trg_on_recipe_change();

-- 4. TRIGGER: Actualizar recetas cuando cambia el precio de un ingrediente base
CREATE OR REPLACE FUNCTION public.trg_on_ingredient_price_change()
RETURNS TRIGGER AS $$
DECLARE
    v_recipe_id UUID;
BEGIN
    -- Solo si el coste por unidad ha cambiado significativamente
    IF (OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit) THEN
        FOR v_recipe_id IN
            SELECT DISTINCT recipe_id FROM public.recipe_ingredients WHERE ingredient_id = NEW.id
        LOOP
            PERFORM public.update_recipe_unit_cost(v_recipe_id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ingredient_price_to_recipe ON public.ingredients;
CREATE TRIGGER trigger_ingredient_price_to_recipe
AFTER UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION public.trg_on_ingredient_price_change();

-- 5. SINCRO FINAL (CORRECCIÓN DE DATOS EXISTENTES)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Doble pasada por herencia
    FOR i IN 1..2 LOOP
        FOR r IN SELECT id FROM public.recipes LOOP
            PERFORM public.update_recipe_unit_cost(r.id);
        END LOOP;
    END LOOP;
END $$;
