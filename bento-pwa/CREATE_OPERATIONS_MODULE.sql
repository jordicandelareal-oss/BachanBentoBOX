-- Add stock fields to ingredients if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredients' AND column_name='stock') THEN
        ALTER TABLE public.ingredients ADD COLUMN stock NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredients' AND column_name='min_stock') THEN
        ALTER TABLE public.ingredients ADD COLUMN min_stock NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Create provider_invoices table
CREATE TABLE IF NOT EXISTS public.provider_invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado')),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies for provider_invoices
ALTER TABLE public.provider_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on provider_invoices" 
ON public.provider_invoices
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Also add an anon policy if you want it to work without explicit auth, or depends on your app rules
CREATE POLICY "Allow anon select on provider_invoices" 
ON public.provider_invoices
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Allow anon insert on provider_invoices" 
ON public.provider_invoices
FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Allow anon update on provider_invoices" 
ON public.provider_invoices
FOR UPDATE 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow anon delete on provider_invoices" 
ON public.provider_invoices
FOR DELETE 
TO anon 
USING (true);
