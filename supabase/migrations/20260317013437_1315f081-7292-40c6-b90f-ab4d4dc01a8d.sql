-- Mentor Conversations
CREATE TABLE public.mentor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  persona text DEFAULT 'mentora-gi',
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.mentor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mentor conversations" ON public.mentor_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own mentor conversations" ON public.mentor_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own mentor conversations" ON public.mentor_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own mentor conversations" ON public.mentor_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Mentor Messages
CREATE TABLE public.mentor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.mentor_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mentor messages" ON public.mentor_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mentor_conversations WHERE id = mentor_messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users create own mentor messages" ON public.mentor_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.mentor_conversations WHERE id = mentor_messages.conversation_id AND user_id = auth.uid())
);

-- Trigger to update conversation timestamp
CREATE TRIGGER update_mentor_conversation_timestamp
  BEFORE UPDATE ON public.mentor_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();