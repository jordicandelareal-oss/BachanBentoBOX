-- ============================================================
-- SCRIPT DE SANEAMIENTO MASIVO v5.0
-- Convierte cost_per_portion de 'Total' a 'Unitario' (€/kg o €/ud)
-- Asegura coherencia para herencia de sub-recetas.
-- ============================================================

-- RECREAR FUNCIÓN DE CÁLCULO (Suma total de ingredientes)
DROP FUNCTION IF EXISTS public.calculate_recipe_total_cost(UUID);

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
        -- CASO 1: Ingrediente Base (cost_per_unit ya es €/kg o €/ud)
        IF v_item.ing_cost IS NOT NULL THEN
            IF lower(v_item.ing_unit_name) LIKE '%peso%' OR lower(v_item.ing_unit_name) LIKE '%kg%' THEN
                v_total_sum := v_total_sum + ((v_item.quantity / 1000.0) * v_item.ing_cost);
            ELSE
                v_total_sum := v_total_sum + (v_item.quantity * v_item.ing_cost);
            END IF;

        -- CASO 2: Elaboración (Sub-receta) (child_unit_cost es €/kg o €/ud)
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

-- PROCESO DE SINCRO MASIVA
DO $$
DECLARE
    r RECORD;
    v_total_sum NUMERIC;
    v_unit_cost NUMERIC;
BEGIN
    -- 1. Asegurar que los ingredientes base tienen coste por unidad correcto
    UPDATE public.ingredients ing
    SET cost_per_unit = CASE
        WHEN lower(u.name) LIKE '%peso%' OR lower(u.name) LIKE '%kg%'
             THEN (ing.purchase_price / NULLIF(ing.purchase_format, 0)) * 1000
        ELSE      (ing.purchase_price / NULLIF(ing.purchase_format, 0))
    END
    FROM public.units u
    WHERE ing.unit_id = u.id AND ing.purchase_format > 0;

    -- 2. Recalcular todas las recetas (Doble pasada para propagar sub-recetas correctamente)
    FOR i IN 1..2 LOOP
        FOR r IN SELECT id, yield_scenario, net_yield, portions FROM public.recipes LOOP
            -- Calcular suma total de ingredientes
            v_total_sum := public.calculate_recipe_total_cost(r.id);
            
            -- Convertir a PRECIO UNITARIO para almacenamiento
            IF r.yield_scenario = 'weight' THEN
                -- €/kg = (Total / gramos) * 1000
                v_unit_cost := (v_total_sum / NULLIF(r.net_yield, 0)) * 1000;
            ELSE
                -- €/ud = Total / unidades
                v_unit_cost := v_total_sum / NULLIF(r.portions, 0);
            END IF;

            UPDATE public.recipes 
            SET cost_per_portion = COALESCE(v_unit_cost, 0)
            WHERE id = r.id;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Saneamiento Masivo v5.0 (Coste Unitario) completado.';
END $$;
