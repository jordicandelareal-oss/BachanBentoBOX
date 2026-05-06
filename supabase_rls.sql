-- Activar RLS en todas las tablas sensibles
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_config ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores (opcional)
-- DROP POLICY IF EXISTS "Admin All Access" ON ingredients;

-- Crear Política Híbrida: Solo Autenticados o Cabecera Personalizada
-- Tabla: ingredients
CREATE POLICY "Admin All Access" ON ingredients FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

-- Tabla: recipes
CREATE POLICY "Admin All Access" ON recipes FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

-- Tabla: recipe_ingredients
CREATE POLICY "Admin All Access" ON recipe_ingredients FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

-- Tabla: menu_items
CREATE POLICY "Admin All Access" ON menu_items FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

-- Tabla: categories
CREATE POLICY "Admin All Access" ON categories FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

-- Tabla: subcategories
CREATE POLICY "Admin All Access" ON subcategories FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

-- Tabla: preparation_categories
CREATE POLICY "Admin All Access" ON preparation_categories FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

-- Tabla: menu_categories
CREATE POLICY "Admin All Access" ON menu_categories FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

-- Tabla: orders
CREATE POLICY "Admin All Access" ON orders FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

-- Tabla: pos_config
CREATE POLICY "Admin All Access" ON pos_config FOR ALL USING (auth.role() = 'authenticated' OR current_setting('request.headers', true)::json->>'x-bachan-key' = 'BachAn_Master_2026_Secure');

  
-- NOTA: Si necesitas que los usuarios públicos (clientes que entren a la home y vean el "Próximamente")
-- en el futuro puedan ver los productos sin iniciar sesión, tendrás que crear una política SELECT adicional
-- específica para los 'anon' en menu_items:
-- CREATE POLICY "Public Read Access" ON menu_items FOR SELECT USING (true);
