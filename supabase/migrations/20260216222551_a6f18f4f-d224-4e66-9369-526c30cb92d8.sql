
-- Create whatsapp_ai_agents table
CREATE TABLE public.whatsapp_ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  group_id TEXT NOT NULL,
  group_name TEXT,
  is_active BOOLEAN DEFAULT true,
  system_prompt TEXT DEFAULT 'Você é um assistente de vendas inteligente. Responda de forma natural, amigável e persuasiva. Use técnicas de copywriting e neuromarketing.',
  trigger_mode TEXT DEFAULT 'mention',
  trigger_keywords TEXT[] DEFAULT '{}',
  response_delay_seconds INTEGER DEFAULT 5,
  max_responses_per_hour INTEGER DEFAULT 20,
  responses_this_hour INTEGER DEFAULT 0,
  hour_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_ai_agents ENABLE ROW LEVEL SECURITY;

-- Only admins can manage agents
CREATE POLICY "Admins can manage ai agents"
ON public.whatsapp_ai_agents
FOR ALL
USING (public.is_admin(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_ai_agents;
