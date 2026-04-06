-- ============================================================
-- SCRIPT DE RESCATE FINAL Y LIMPIEZA TOTAL (CASING FIX)
-- 1. Elimina vistas residuales de Supabase (DROP VIEW)
-- 2. Rescata Bentos 'invisibles' usando el Casing exacto CORREGIDO
-- ============================================================

-- A. LIMPIEZA DE VISTAS (Views)
-- Eliminamos cualquier rastro de las vistas creadas anteriormente.
DROP VIEW IF EXISTS view_inventario_legible;
DROP VIEW IF EXISTS view_recetas_legibles;


-- B. RESCATE DE BENTOS HUÉRFANOS
-- Se requiere comillas dobles para respetar el CASE-SENSITIVE de PostgreSQL ("Id" con mayúscula).
-- Esto rescata los registros que se guardaron como NULL por el error de casing previo.
UPDATE recipes 
SET "preparation_category_Id" = '0c43bac9-4f7b-4834-952c-81af2296dfd3'
WHERE recipe_type = 'bento' 
  AND ("preparation_category_Id" IS NULL OR "preparation_category_Id"::text = 'all');


-- C. VERIFICACIÓN FINAL (No ejecutar)
-- SELECT id, name, "preparation_category_Id" FROM recipes WHERE recipe_type = 'bento';
