-- ============================================================
-- SCRIPT DE MIGRACIÓN: ESQUEMA Y COSTES UNITARIOS v2.0
-- 1. Añade columnas faltantes en 'ingredients'
-- 2. Corrige 'cost_per_portion' en 'recipes' (Unitario vs Total)
-- ============================================================

-- A. ACTUALIZACIÓN DE ESQUEMA (INGREDIENTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'is_published') THEN
        ALTER TABLE public.ingredients ADD COLUMN is_published BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'sale_price') THEN
        ALTER TABLE public.ingredients ADD COLUMN sale_price NUMERIC DEFAULT 0;
    END IF;
END $$;


-- B. DEFINICIÓN DE FUNCIONES DE CÁLCULO (RECIPES)
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
            IF lower(v_item.ing_unit_name) LIKE '%peso%' OR lower(v_item.ing_unit_name) LIKE '%kg%' THEN
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

-- C. FUNCIÓN PARA ACTUALIZAR UNA RECETA ESPECÍFICA (UNITARIO)
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

-- D. EJECUCIÓN DE LIMPIEZA MASIVA (2 pasadas para asegurar herencia)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR i IN 1..2 LOOP
        FOR r IN SELECT id FROM public.recipes LOOP
            PERFORM public.update_recipe_unit_cost(r.id);
        END LOOP;
    END LOOP;
END $$;
