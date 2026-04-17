-- Script para añadir funcionalidad de descuentos a la tabla de órdenes
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount_input NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percent';

-- Comentario informativo
COMMENT ON COLUMN orders.discount_amount IS 'Monto total restado del ticket';
COMMENT ON COLUMN orders.discount_amount_input IS 'Valor bruto ingresado por el usuario (ej: 10)';
COMMENT ON COLUMN orders.discount_type IS 'Tipo de descuento: percent o fixed';
