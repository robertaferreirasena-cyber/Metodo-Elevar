ALTER TABLE public.profiles ADD COLUMN community_last_seen_at TIMESTAMP WITH TIME ZONE;

-- Ensure RLS allows users to update their own community_last_seen_at
-- This depends on existing policies, but typically users can update their own profiles.
-- If no UPDATE policy exists, we should add one specifically for this column or profile.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END
$$;
