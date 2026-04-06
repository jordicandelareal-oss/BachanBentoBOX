-- ============================================================
-- SCRIPT DE RESCATE FINAL v3 (UUID CORREGIDO)
-- 1. Elimina TODAS las vistas previas de Supabase
-- 2. Rescata Bentos 'invisibles' con el UUID oficial correcto
-- ============================================================

-- A. LIMPIEZA DE VISTAS (Views)
DROP VIEW IF EXISTS view_inventario_legible;
DROP VIEW IF EXISTS view_recetas_legibles;


-- B. RESCATE DE BENTOS HUÉRFANOS
-- Se usa el UUID CORREGIDO: 0c43bac9-471b-4834-952c-81a822965df3
-- Se aplica el casing exacto ("preparation_category_Id") con comillas dobles.
UPDATE recipes 
SET "preparation_category_Id" = '0c43bac9-471b-4834-952c-81a822965df3'
WHERE recipe_type = 'bento' 
  AND ("preparation_category_Id" IS NULL OR "preparation_category_Id"::text = 'all');


-- C. VERIFICACIÓN FINAL (No ejecutar)
-- SELECT id, name, "preparation_category_Id" FROM recipes WHERE recipe_type = 'bento';
