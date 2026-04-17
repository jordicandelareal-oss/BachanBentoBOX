-- ============================================================
-- v12: CRITICAL FIXES - Cost Sync, Timestamps & Analytics
-- Fecha: 2026-04-16
-- Propósito: 
--   1. Añadir columna 'cost' a menu_items
--   2. Trigger automático para sincronizar costes recipe→menu_items
--   3. Añadir columna 'sold_at' a orders
--   4. Backfill de costes existentes
-- ============================================================

-- ─── 1. COLUMNA COST EN MENU_ITEMS ───────────────────────────
ALTER TABLE public.menu_items 
  ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.menu_items.cost IS 'Coste de producción unitario del plato (sincronizado desde recipes.cost_per_portion)';

-- ─── 2. COLUMNA SOLD_AT EN ORDERS ────────────────────────────
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.orders.sold_at IS 'Timestamp exacto del momento de cobro (capturado en frontend)';

-- ─── 3. TRIGGER: SINCRONIZAR COSTE recipe → menu_items ──────
-- Cuando cost_per_portion cambie en recipes, actualizar menu_items.cost
CREATE OR REPLACE FUNCTION public.trg_sync_recipe_cost_to_menu()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar si el coste realmente cambió
    IF (OLD.cost_per_portion IS DISTINCT FROM NEW.cost_per_portion) THEN
        -- Actualizar todos los menu_items vinculados a esta receta
        -- cost = cost_per_portion * quantity_multiplier (para packs)
        UPDATE public.menu_items
        SET cost = NEW.cost_per_portion * COALESCE(quantity_multiplier, 1)
        WHERE recipe_id = NEW.id;
        
        RAISE NOTICE '[Cost Sync] recipe % → menu_items actualizado (nuevo coste: %)', 
            NEW.id, NEW.cost_per_portion;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instalar trigger (recrear si existe)
DROP TRIGGER IF EXISTS trigger_sync_recipe_cost_to_menu ON public.recipes;
CREATE TRIGGER trigger_sync_recipe_cost_to_menu
AFTER UPDATE OF cost_per_portion ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_recipe_cost_to_menu();

-- ─── 4. BACKFILL: Sincronizar costes de TODOS los menu_items existentes ──
-- Actualizar menu_items que tienen recipe_id con el coste real de la receta
UPDATE public.menu_items mi
SET cost = r.cost_per_portion * COALESCE(mi.quantity_multiplier, 1)
FROM public.recipes r
WHERE mi.recipe_id = r.id
  AND r.cost_per_portion > 0;

-- Actualizar menu_items que son ingredientes directos (sin recipe_id)
-- Para ingredientes, el cost_per_unit ya está en la tabla ingredients
UPDATE public.menu_items mi
SET cost = i.cost_per_unit
FROM public.ingredients i
WHERE mi.id = i.id  -- Ingredients use same ID
  AND mi.recipe_id IS NULL
  AND i.cost_per_unit > 0;

-- ─── 5. BACKFILL: Rellenar sold_at para orders que no lo tengan ──
UPDATE public.orders
SET sold_at = created_at
WHERE sold_at IS NULL;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
-- Mostrar menu_items con sus costes actualizados
SELECT 
    mi.name,
    mi.price AS pvp,
    mi.cost,
    mi.quantity_multiplier,
    CASE WHEN mi.price > 0 
        THEN ROUND(((mi.price - mi.cost) / mi.price) * 100, 1) 
        ELSE 0 
    END AS margin_pct
FROM public.menu_items mi
ORDER BY mi.name;
