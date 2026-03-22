-- Professional TPV Upgrade: Legal & Modifiers Support
-- Run this in Supabase SQL Editor

-- 1. Update orders table for legal compliance
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0.00;

-- 2. Add modifiers support to recipes
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS modifiers JSONB DEFAULT '[]'::jsonb;
-- Example modifiers: ["Picante", "No Picante", "Extra Wasabi"]

-- 3. Update existing recipes with example modifiers if they are Bentos
UPDATE public.recipes 
SET modifiers = '["Picante", "Normal", "Suave"]'::jsonb 
WHERE category = 'bento' AND is_published = true;
