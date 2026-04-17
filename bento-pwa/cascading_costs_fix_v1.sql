-- ============================================================
-- SCRIPT DE CASCADA DE COSTES RECURSIVA v1.0 (REFINADO)
-- Propósito: Asegurar que cambios en Ingredientes -> Elaboraciones -> Bentos
-- se propaguen automáticamente en toda la cadena.
-- ============================================================

-- 1. LIMPIEZA DE DISPARADORES PREVIOS (Evitar conflictos)
DROP TRIGGER IF EXISTS trigger_recipe_cost_cascade ON public.recipes;

-- 2. FUNCIÓN DE PROPAGACIÓN HACIA PADRES
CREATE OR REPLACE FUNCTION public.trg_on_recipe_cost_change()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_id UUID;
BEGIN
    -- Solo actuar si el coste unitario (cost_per_portion) ha cambiado efectivamente
    IF (OLD.cost_per_portion IS DISTINCT FROM NEW.cost_per_portion) THEN
        -- Buscar todas las recetas que consumen esta receta (NEW.id) como 'child_recipe_id' en la tabla intermedia
        FOR v_parent_id IN
            SELECT DISTINCT recipe_id 
            FROM public.recipe_ingredients 
            WHERE child_recipe_id = NEW.id
        LOOP
            -- RAISE NOTICE 'Cascading update to parent recipe: %', v_parent_id;
            -- Llamar a la función de actualización del padre. 
            -- Esto disparará de nuevo este trigger para el padre, creando la cascada recursiva.
            PERFORM public.update_recipe_unit_cost(v_parent_id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CREACIÓN DEL DISPARADOR EN LA TABLA RECIPES
-- Se activa AFTER UPDATE de la columna cost_per_portion
CREATE TRIGGER trigger_recipe_cost_cascade
AFTER UPDATE OF cost_per_portion ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.trg_on_recipe_cost_change();

-- 4. SINCRONIZACIÓN INICIAL COMPLETA
-- Ejecutamos 3 pasadas para asentar cualquier cambio pendiente en la jerarquía
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
