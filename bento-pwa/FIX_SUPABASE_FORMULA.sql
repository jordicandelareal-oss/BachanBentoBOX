-- ==========================================
-- SCRIPT DE EMERGENCIA v3: CORRECCIÓN DE MERMA
-- ==========================================
-- Este script es el más robusto: convierte la columna generada en una columna 
-- normal para evitar errores de dependencias y usa un TRIGGER para el cálculo.

-- 1. Convertir la columna generada en una columna normal
-- Esto ELIMINA la fórmula antigua pero MANTIENE la columna, evitando errores de Vistas.
ALTER TABLE public.ingredients ALTER COLUMN net_cost_per_unit DROP EXPRESSION;

-- 2. Crear la función de cálculo con la fórmula exacta solicitada
CREATE OR REPLACE FUNCTION public.calculate_net_cost_formula()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_cost_per_unit := CASE 
    WHEN NEW.waste_percentage < 0 THEN 
      ( (CAST(NEW.purchase_price AS numeric) / NULLIF(CAST(NEW.purchase_format AS numeric), 0)) * CASE WHEN NEW.calculation_type = 'peso' THEN 1000.0 ELSE 1.0 END ) 
      / (1.0 + (ABS(CAST(NEW.waste_percentage AS numeric)) / 100.0))
    ELSE 
      ( (CAST(NEW.purchase_price AS numeric) / NULLIF(CAST(NEW.purchase_format AS numeric), 0)) * CASE WHEN NEW.calculation_type = 'peso' THEN 1000.0 ELSE 1.0 END ) 
      / NULLIF(1.0 - (CAST(NEW.waste_percentage AS numeric) / 100.0), 0)
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el Trigger para automatizar el cálculo en cada guardado
DROP TRIGGER IF EXISTS trg_recalculate_net_cost ON public.ingredients;
CREATE TRIGGER trg_recalculate_net_cost
BEFORE INSERT OR UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION public.calculate_net_cost_formula();

-- 4. Forzar el recalculo de toda la tabla inmediatamente
UPDATE public.ingredients SET purchase_price = purchase_price;
