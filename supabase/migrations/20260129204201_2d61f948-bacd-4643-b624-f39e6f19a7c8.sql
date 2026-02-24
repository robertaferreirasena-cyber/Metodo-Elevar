-- Add reply_to column to community_messages
ALTER TABLE public.community_messages 
ADD COLUMN reply_to_id uuid REFERENCES public.community_messages(id) ON DELETE SET NULL;

-- Create table for message reactions
CREATE TABLE public.community_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create table for polls
CREATE TABLE public.community_polls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for poll votes
CREATE TABLE public.community_poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reactions
CREATE POLICY "Authenticated users can view reactions"
ON public.community_reactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add their own reactions"
ON public.community_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON public.community_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for polls
CREATE POLICY "Authenticated users can view polls"
ON public.community_polls FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create polls"
ON public.community_polls FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete polls"
ON public.community_polls FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for poll votes
CREATE POLICY "Authenticated users can view votes"
ON public.community_poll_votes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can vote"
ON public.community_poll_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote"
ON public.community_poll_votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
ON public.community_poll_votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);