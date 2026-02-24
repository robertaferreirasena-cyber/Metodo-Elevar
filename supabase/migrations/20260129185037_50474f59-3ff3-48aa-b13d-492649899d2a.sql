-- Create persona_profiles table for storing user business and persona data
CREATE TABLE public.persona_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- About You (Step 1)
  business_name TEXT,
  niche TEXT,
  sub_niche TEXT,
  time_in_market TEXT,
  sales_channels TEXT[],
  
  -- Product/Service (Step 2)
  product_description TEXT,
  price_range TEXT,
  main_differentiator TEXT,
  transformation TEXT,
  
  -- Target Audience (Step 3)
  target_gender TEXT,
  target_age_range TEXT,
  target_profession TEXT,
  target_location TEXT,
  main_pain TEXT,
  previous_attempts TEXT,
  
  -- Challenges (Step 4)
  sales_challenges TEXT,
  common_objections TEXT,
  improvement_goals TEXT,
  
  -- AI Generated Content
  generated_raio_x JSONB,
  suggested_templates TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.persona_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view their own persona profile"
ON public.persona_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own persona profile"
ON public.persona_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persona profile"
ON public.persona_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persona profile"
ON public.persona_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_persona_profiles_updated_at
BEFORE UPDATE ON public.persona_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();