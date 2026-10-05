-- ============================================================================
-- BaChan BentoBox CRM & Flyer Module (v2.16.0)
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard/project/qicwnfswitplggwtmmsp/sql)
-- ============================================================================

-- 1. TABLA DE CLIENTES (CRM & FIDELIZACIÓN)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    birthday DATE,
    address TEXT,
    allergens TEXT,
    notes TEXT,
    loyalty_tier TEXT DEFAULT 'standard', -- standard, frequent, vip, gold
    discount_percent NUMERIC(5,2) DEFAULT 0,
    favorite_dish TEXT,
    language TEXT DEFAULT 'es', -- 'es' (Español), 'en' (English), 'ja' (Japonés)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migración segura por si la tabla ya existe
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_birthday ON public.customers(birthday);

-- 2. AMPLIAR TABLA DE ÓRDENES CON VÍNCULO DE CLIENTE
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 3. TABLA DE PLANTILLAS Y MENÚS SEMANALES (FLYERS)
CREATE TABLE IF NOT EXISTS public.flyer_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'weekly_menu', -- 'weekly_menu', 'product_highlight', 'promotion'
    aspect_ratio TEXT DEFAULT '9:16', -- '9:16', '1:1', '16:9'
    theme TEXT DEFAULT 'bachan_classic', -- 'bachan_classic', 'navy_gold', 'cherry_minimal', 'neo_tokyo'
    content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. POLÍTICAS DE ACCESO (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flyer_templates ENABLE ROW LEVEL SECURITY;

-- Lectura y escritura pública / autenticada
DROP POLICY IF EXISTS "Allow all for customers" ON public.customers;
CREATE POLICY "Allow all for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for flyer_templates" ON public.flyer_templates;
CREATE POLICY "Allow all for flyer_templates" ON public.flyer_templates FOR ALL USING (true) WITH CHECK (true);
