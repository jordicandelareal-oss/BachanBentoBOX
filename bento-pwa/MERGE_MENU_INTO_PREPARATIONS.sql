-- ============================================================
-- MERGE MENU → PREPARATIONS  (PRE_MERGE_MENU_V4 → v5.1)
-- Fecha: 2026-05-14
-- Propósito: Asegurar que la tabla recipes tiene todos los datos
--   de PVP y categoría que antes residían exclusivamente en
--   menu_items. La UI de Elaboraciones es ahora el control único.
-- ============================================================

-- ─── PASO 1: Verificar que las columnas necesarias existen ─────────────────
-- La tabla recipes ya debería tener: is_published, sale_price, menu_category_id
-- Si alguna falta, descomenta la línea correspondiente:

-- ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
-- ALTER TABLE recipes ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2) DEFAULT 0;
-- ALTER TABLE recipes ADD COLUMN IF NOT EXISTS menu_category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL;

-- ─── PASO 2: Diagnóstico – Ver desincronizaciones ──────────────────────────
-- Elaboraciones publicadas sin PVP definido en recipes:
SELECT
  r.id,
  r.name,
  r.is_published,
  r.sale_price AS pvp_en_recipe,
  mi.price     AS pvp_en_menu_items,
  r.menu_category_id AS cat_en_recipe,
  mi.menu_category_id AS cat_en_menu_items
FROM recipes r
LEFT JOIN menu_items mi ON mi.recipe_id = r.id AND mi.quantity_multiplier = 1
WHERE r.recipe_type IN ('elaboracion', 'bento')
  AND (
    (r.is_published = TRUE AND (r.sale_price IS NULL OR r.sale_price = 0))
    OR (r.is_published = FALSE AND mi.id IS NOT NULL)
    OR (r.menu_category_id IS DISTINCT FROM mi.menu_category_id)
  )
ORDER BY r.name;


-- ─── PASO 3: Migración de PVP desde menu_items → recipes ──────────────────
-- Actualiza el PVP en la receta tomando el valor del item base (x1) de menu_items
-- Solo actualiza donde recipes.sale_price = 0 o NULL pero menu_items sí tiene precio
UPDATE recipes r
SET
  sale_price       = mi.price,
  menu_category_id = COALESCE(mi.menu_category_id, r.menu_category_id),
  is_published     = TRUE
FROM menu_items mi
WHERE mi.recipe_id = r.id
  AND mi.quantity_multiplier = 1
  AND mi.active = TRUE
  AND r.recipe_type IN ('elaboracion', 'bento')
  AND (r.sale_price IS NULL OR r.sale_price = 0)
  AND mi.price > 0;


-- ─── PASO 4: Sincronizar menu_items con los precios ya en recipes ──────────
-- Actualiza menu_items base (x1) con el PVP que pueda ya estar en recipes
UPDATE menu_items mi
SET
  price            = r.sale_price,
  cost             = r.cost_per_portion,
  menu_category_id = r.menu_category_id,
  name             = r.name
FROM recipes r
WHERE mi.recipe_id = r.id
  AND mi.quantity_multiplier = 1
  AND r.recipe_type IN ('elaboracion', 'bento')
  AND r.is_published = TRUE;


-- ─── PASO 5: Verificación final ────────────────────────────────────────────
-- Debería devolver 0 filas si todo está sincronizado
SELECT
  r.id,
  r.name,
  r.sale_price AS pvp_recipe,
  mi.price     AS pvp_menu_item,
  r.is_published
FROM recipes r
LEFT JOIN menu_items mi ON mi.recipe_id = r.id AND mi.quantity_multiplier = 1
WHERE r.recipe_type IN ('elaboracion', 'bento')
  AND r.is_published = TRUE
  AND ABS(COALESCE(r.sale_price, 0) - COALESCE(mi.price, 0)) > 0.01
ORDER BY r.name;


-- ─── PASO 6 (OPCIONAL): Crear vista resumen TPV desde Elaboraciones ─────────
-- Útil para el Dashboard y Analytics
CREATE OR REPLACE VIEW v_elaboraciones_tpv AS
SELECT
  r.id,
  r.name,
  r.recipe_type,
  r.cost_per_portion                                                  AS coste,
  r.sale_price                                                        AS pvp,
  CASE
    WHEN r.sale_price > 0
    THEN ROUND(((r.sale_price - r.cost_per_portion) / r.sale_price) * 100, 2)
    ELSE 0
  END                                                                  AS margen_pct,
  r.is_published,
  mc.name                                                              AS categoria_tpv,
  r.image_url,
  r.created_at
FROM recipes r
LEFT JOIN menu_categories mc ON mc.id = r.menu_category_id
WHERE r.recipe_type IN ('elaboracion', 'bento')
ORDER BY r.name;

-- ¡Listo! La fusión Menu → Elaboraciones está completa.
-- El control TPV ahora vive en Elaboraciones (recipes.is_published + sale_price).
