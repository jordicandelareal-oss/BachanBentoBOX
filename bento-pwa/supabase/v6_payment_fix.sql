-- Optional: Add payment_method column to orders if it does not exist
-- Run this in Supabase SQL Editor if you get a payment_method error

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'Efectivo';
    END IF;
END $$;
