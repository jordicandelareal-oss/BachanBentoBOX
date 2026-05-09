-- ============================================================
-- SCRIPT DE RESTAURACIÓN DE VISTAS v1.0
-- Propósito: Recrear la vista detallada de costes y actualizar las vistas legibles
-- para que utilicen net_cost_per_unit como fuente de verdad.
-- ============================================================

-- 1. RECREAR VISTA DETALLADA DE COSTES DE RECETAS
-- Esta vista desglosa cada ingrediente/sub-receta de una receta con sus costes netos.
CREATE OR REPLACE VIEW view_recipe_costs_detailed AS
SELECT
    r.id AS recipe_id,
    r.name AS recipe_name,
    ri.quantity AS item_quantity,
    COALESCE(i.name, cr.name) AS item_name,
    CASE 
        WHEN ri.ingredient_id IS NOT NULL THEN 'ingredient'
        ELSE 'sub-recipe'
    END AS item_type,
    CASE
        WHEN ri.ingredient_id IS NOT NULL THEN COALESCE(i.net_cost_per_unit, i.cost_per_unit, 0)
        ELSE cr.cost_per_portion
    END AS item_unit_cost,
    CASE
        WHEN ri.ingredient_id IS NOT NULL THEN 
            CASE 
                -- Si la unidad es peso (kg/l/g/ml), aplicamos la regla de /1000 si la cantidad está en gramos
                WHEN lower(u.name) LIKE '%peso%' OR lower(u.name) LIKE '%kg%' OR lower(u.name) LIKE '%l%' 
                THEN (ri.quantity / 1000.0) * COALESCE(i.net_cost_per_unit, i.cost_per_unit, 0)
                ELSE ri.quantity * COALESCE(i.net_cost_per_unit, i.cost_per_unit, 0)
            END
        ELSE 
            CASE 
                -- Para sub-recetas, si el escenario es 'weight' (peso), el coste es por KG
                WHEN cr.yield_scenario = 'weight' 
                THEN (ri.quantity / 1000.0) * cr.cost_per_portion
                ELSE ri.quantity * cr.cost_per_portion
            END
    END AS item_subtotal
FROM public.recipes r
JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN public.ingredients i ON ri.ingredient_id = i.id
LEFT JOIN public.units u ON i.unit_id = u.id
LEFT JOIN public.recipes cr ON ri.child_recipe_id = cr.id;

-- 2. ACTUALIZAR VISTA DE INVENTARIO LEGIBLE
-- Asegura que el coste mostrado sea el coste neto (con merma).
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
    COALESCE(i.net_cost_per_unit, i.cost_per_unit, 0) AS coste_neto_kg_ud,
    i.is_published AS en_tienda
FROM public.ingredients i
LEFT JOIN public.categories c ON i.category_id = c.id
LEFT JOIN public.subcategories s ON i.subcategory_id = s.id
LEFT JOIN public.units u ON i.unit_id = u.id
ORDER BY i.name ASC;

-- 3. VISTA DE RECETAS (PRODUCTOS/ELABORACIONES) LEGIBLE
-- Mantenemos la coherencia con el coste por ración/kg ya calculado.
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
