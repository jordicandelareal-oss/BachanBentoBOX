-- Add max_stock field to ingredients table
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS max_stock NUMERIC DEFAULT 0;
