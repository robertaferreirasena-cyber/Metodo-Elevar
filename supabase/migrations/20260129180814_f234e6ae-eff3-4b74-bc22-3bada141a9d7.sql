-- Create table for sequences
CREATE TABLE public.sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  product TEXT NOT NULL,
  goal TEXT NOT NULL,
  total_posts INTEGER NOT NULL DEFAULT 5,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for sequence posts
CREATE TABLE public.sequence_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  post_order INTEGER NOT NULL,
  timing TEXT NOT NULL,
  objective TEXT NOT NULL,
  content TEXT NOT NULL,
  expected_reaction TEXT,
  tips TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sequences
CREATE POLICY "Users can view their own sequences" 
ON public.sequences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sequences" 
ON public.sequences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sequences" 
ON public.sequences 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for sequence_posts
CREATE POLICY "Users can view posts from their sequences" 
ON public.sequence_posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sequences 
    WHERE sequences.id = sequence_posts.sequence_id 
    AND sequences.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create posts for their sequences" 
ON public.sequence_posts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sequences 
    WHERE sequences.id = sequence_posts.sequence_id 
    AND sequences.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete posts from their sequences" 
ON public.sequence_posts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.sequences 
    WHERE sequences.id = sequence_posts.sequence_id 
    AND sequences.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_sequences_user_id ON public.sequences(user_id);
CREATE INDEX idx_sequence_posts_sequence_id ON public.sequence_posts(sequence_id);