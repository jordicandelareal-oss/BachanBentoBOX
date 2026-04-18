CREATE TABLE IF NOT EXISTS pos_config (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO pos_config (key, value)
VALUES ('ticket_sequence', '{"last_number": 11}')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION increment_ticket_sequence()
RETURNS INTEGER AS $$
DECLARE
    next_val INTEGER;
BEGIN
    UPDATE pos_config
    SET value = jsonb_set(value, '{last_number}', (COALESCE((value->>'last_number')::int, 0) + 1)::text::jsonb),
        updated_at = NOW()
    WHERE key = 'ticket_sequence'
    RETURNING (value->>'last_number')::int INTO next_val;
    
    RETURN next_val;
END;
$$ LANGUAGE plpgsql;
