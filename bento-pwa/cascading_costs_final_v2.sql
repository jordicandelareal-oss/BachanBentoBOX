-- ============================================================
-- SCRIPT DE CASCADA DE COSTES RECURSIVA v2.0 (FINAL BEYOND RLS)
-- Propósito: Garantizar la propagación de costes en toda la jerarquía
-- sin bloqueos de permisos para usuarios anónimos.
-- ============================================================

-- 1. FUNCIÓN DE CÁLCULO TOTAL (CON SECURITY DEFINER)
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
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Elevamos privilegios

-- 2. FUNCIÓN PARA ACTUALIZAR COSTES UNITARIOS (CON SECURITY DEFINER)
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
        v_unit_cost := (v_total_sum / NULLIF(v_net_yield, 0)) * 1000;
    ELSE
        v_unit_cost := v_total_sum / NULLIF(v_portions, 0);
    END IF;

    UPDATE public.recipes 
    SET cost_per_portion = COALESCE(v_unit_cost, 0)
    WHERE id = p_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Elevamos privilegios

-- 3. DISPARADOR DE CASCADA ENTRE RECETAS (REPETIDOR)
CREATE OR REPLACE FUNCTION public.trg_on_recipe_cost_change()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_id UUID;
BEGIN
    -- Evitamos bucle infinito: solo actuar si el coste cambió de verdad
    IF (OLD.cost_per_portion IS DISTINCT FROM NEW.cost_per_portion) THEN
        FOR v_parent_id IN
            SELECT DISTINCT recipe_id FROM public.recipe_ingredients WHERE child_recipe_id = NEW.id
        LOOP
            PERFORM public.update_recipe_unit_cost(v_parent_id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Elevamos privilegios

-- 4. DISPARADOR DE INGREDIENTES A RECETAS (Nivel 1)
CREATE OR REPLACE FUNCTION public.trg_on_ingredient_price_change()
RETURNS TRIGGER AS $$
DECLARE
    v_recipe_id UUID;
BEGIN
    IF (OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit) THEN
        FOR v_recipe_id IN
            SELECT DISTINCT recipe_id FROM public.recipe_ingredients WHERE ingredient_id = NEW.id
        LOOP
            PERFORM public.update_recipe_unit_cost(v_recipe_id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Elevamos privilegios

-- 5. RE-INSTALACIÓN DE TRIGGERS
DROP TRIGGER IF EXISTS trigger_recipe_cost_cascade ON public.recipes;
CREATE TRIGGER trigger_recipe_cost_cascade
AFTER UPDATE OF cost_per_portion ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.trg_on_recipe_cost_change();

DROP TRIGGER IF EXISTS trigger_ingredient_price_to_recipe ON public.ingredients;
CREATE TRIGGER trigger_ingredient_price_to_recipe
AFTER UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION public.trg_on_ingredient_price_change();

-- 6. SINCRONIZACIÓN INICIAL (Triple pasada para asegurar jerarquía)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR i IN 1..3 LOOP
        FOR r IN SELECT id FROM public.recipes LOOP
            PERFORM public.update_recipe_unit_cost(r.id);
        END LOOP;
    END LOOP;
END $$;
