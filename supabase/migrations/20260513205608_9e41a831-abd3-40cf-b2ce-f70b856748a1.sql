-- Create brand_kit table
CREATE TABLE IF NOT EXISTS public.brand_kit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    primary_color TEXT DEFAULT '#E11D48',
    secondary_color TEXT DEFAULT '#1A1A1A',
    accent_color TEXT DEFAULT '#FBBF24',
    font_family_title TEXT DEFAULT 'DM Sans',
    font_family_body TEXT DEFAULT 'Inter',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.brand_kit ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own brand kit"
    ON public.brand_kit FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand kit"
    ON public.brand_kit FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand kit"
    ON public.brand_kit FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_brand_kit_updated_at
    BEFORE UPDATE ON public.brand_kit
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
