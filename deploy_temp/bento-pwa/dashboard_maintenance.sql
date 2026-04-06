-- ============================================================
-- SCRIPT DE MANTENIMIENTO: RESCATE Y LEGIBILIDAD (v2 - CASING FIX)
-- 1. Rescata Bentos sin categoría
-- 2. Crea vistas para lectura humana (Nombres vs UUIDs)
-- ============================================================

-- A. RESCATE DE BENTOS HUÉRFANOS
-- Se usa double quotes para respetar el casing exacto detectado en el código ("Id" con mayúscula).
UPDATE recipes 
SET "preparation_category_Id" = (SELECT id FROM preparation_categories WHERE "Name" = 'Bentos' LIMIT 1)
WHERE recipe_type = 'bento' AND ("preparation_category_Id" IS NULL OR "preparation_category_Id"::text = 'all');


-- B. VISTA DE INVENTARIO LEGIBLE
CREATE OR REPLACE VIEW view_inventario_legible AS
SELECT 
    i.id,
    i.name AS ingrediente,
    i.brand AS marca,
    i.provider AS proveedor,
    i.provider_product_code AS cod_proveedor,
    c.name AS categoria,
    s.name AS subcategoria,
    u.name AS unidad_medida,
    i.purchase_format AS formato_compra,
    i.purchase_price AS precio_compra,
    i.cost_per_unit AS coste_unitario_kg_ud,
    i.is_published AS en_tienda
FROM public.ingredients i
LEFT JOIN public.categories c ON i.category_id = c.id
LEFT JOIN public.subcategories s ON i.subcategory_id = s.id
LEFT JOIN public.units u ON i.unit_id = u.id
ORDER BY i.name ASC;


-- C. VISTA DE RECETAS (PRODUCTOS/ELABORACIONES) LEGIBLE
CREATE OR REPLACE VIEW view_recetas_legibles AS
SELECT 
    r.id,
    r.name AS receta,
    r.recipe_type AS tipo,
    pc."Name" AS categoria_preparacion,
    u.name AS unidad_rendimiento,
    r.portions AS raciones,
    r.net_yield AS rendimiento_gramos,
    r.cost_per_portion AS coste_unitario_final,
    r.sale_price AS pvp_sugerido,
    r.is_published AS en_menu
FROM public.recipes r
LEFT JOIN public.preparation_categories pc ON r."preparation_category_Id" = pc.id
LEFT JOIN public.units u ON r."Unid_Id" = u.id
ORDER BY r.recipe_type, r.name ASC;
