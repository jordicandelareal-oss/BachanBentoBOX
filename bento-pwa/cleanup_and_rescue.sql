-- ============================================================
-- SCRIPT DE LIMPIEZA TOTAL Y RESCATE FINAL (v3 - CASING LOWERCASE)
-- 1. Elimina vistas residuales (view_*)
-- 2. Rescata Bentos 'invisibles' usando columna en minúsculas
-- ============================================================

-- A. LIMPIEZA DE VISTAS (Views)
DROP VIEW IF EXISTS view_inventario_legible;
DROP VIEW IF EXISTS view_recetas_legibles;


-- B. RESCATE DE BENTOS HUÉRFANOS
-- Se usa el UUID exacto: 0c43bac9-4f7b-4834-952c-81af2296dfd3
-- Se apunta a la columna en minúsculas para asegurar que no haya saltos de casing.
UPDATE recipes 
SET preparation_category_id = '0c43bac9-4f7b-4834-952c-81af2296dfd3'
WHERE recipe_type = 'bento' 
  AND (preparation_category_id IS NULL OR preparation_category_id::text = 'all');


-- C. VERIFICACIÓN (Opcional)
-- SELECT id, name, preparation_category_id FROM recipes WHERE recipe_type = 'bento';
