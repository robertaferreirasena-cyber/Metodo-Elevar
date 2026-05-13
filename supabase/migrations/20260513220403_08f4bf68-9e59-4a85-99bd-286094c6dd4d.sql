CREATE TABLE IF NOT EXISTS public.carousel_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Sem título',
    data JSONB NOT NULL,
    thumbnail_url TEXT,
    is_template BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carousel_designs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own designs" 
ON public.carousel_designs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own designs" 
ON public.carousel_designs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs" 
ON public.carousel_designs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs" 
ON public.carousel_designs FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_carousel_designs_updated_at
    BEFORE UPDATE ON public.carousel_designs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
