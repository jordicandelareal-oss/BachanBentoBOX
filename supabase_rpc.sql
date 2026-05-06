-- ==============================================================
-- 1. FUNCIÓN PÚBLICA DE LECTURA DE MENÚ
-- Esta función lee menu_items pero sólo expone columnas no-sensibles
-- Se declara como SECURITY DEFINER para puentear el RLS que bloquea 'anon'
-- ==============================================================
CREATE OR REPLACE FUNCTION get_public_menu()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  price numeric,
  image_url text,
  quantity_multiplier integer,
  menu_category_id uuid,
  sort_order integer
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id, 
    m.name, 
    m.description, 
    m.price, 
    m.image_url, 
    m.quantity_multiplier, 
    m.menu_category_id,
    m.sort_order
  FROM menu_items m
  WHERE m.active = true
  ORDER BY m.sort_order ASC NULLS LAST, m.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Otorga permiso de ejecución a usuarios públicos locales no logueados (anon)
GRANT EXECUTE ON FUNCTION get_public_menu() TO anon;


-- ==============================================================
-- 2. FUNCIÓN PÚBLICA DE INYECCIÓN DE PEDIDO
-- Recibe un JSON validado y lo inyecta generando la estructura "Cuenta Abierta"
-- ==============================================================
CREATE OR REPLACE FUNCTION submit_guest_order(p_order jsonb)
RETURNS uuid
SECURITY DEFINER
AS $$
DECLARE
  new_order_id uuid;
  next_seq int;
  t_number text;
  v_name text;
  v_contact text;
  v_time text;
  v_total numeric;
  v_items jsonb;
BEGIN
  -- Extraer del Payload JSON
  v_name := p_order->>'customer_name';
  v_contact := p_order->>'customer_contact';
  v_time := p_order->>'delivery_time';
  v_total := (p_order->>'total')::numeric;
  v_items := p_order->'items';

  -- Calcular el siguiente ticket number
  -- Intentamos llamar a la secuencia existente, si falla usamos fallback horario.
  BEGIN
    SELECT public.increment_ticket_sequence() INTO next_seq;
    t_number := 'T-' || extract(year from current_timestamp) || '-' || lpad(next_seq::text, 4, '0');
  EXCEPTION WHEN OTHERS THEN
    -- Fallback si no está increment_ticket_sequence
    t_number := 'T-' || extract(year from current_timestamp) || '-WB' || right(extract(epoch from current_timestamp)::text, 4);
  END;

  INSERT INTO orders (
    customer_name,
    customer_contact,
    table_id,
    ticket_number,
    total,
    status,
    items,
    tax_amount,
    discount_amount,
    total_cost,
    payment_method,
    created_at
  ) VALUES (
    v_name,
    v_contact,
    'Web ' || v_time, -- Usamos el campo table_id para indicar que viene de web con fecha/hora
    t_number,
    v_total,
    'pending',
    v_items,
    (v_total - (v_total / 1.10)), -- Asumiendo 10% IVA
    0,
    0, -- Coste 0 por seguridad, en TPV interno se re-calcula o ignora
    'pending',
    now()
  ) RETURNING id INTO new_order_id;
  
  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql;

-- Permiso público explícito para el POST
GRANT EXECUTE ON FUNCTION submit_guest_order(jsonb) TO anon;
