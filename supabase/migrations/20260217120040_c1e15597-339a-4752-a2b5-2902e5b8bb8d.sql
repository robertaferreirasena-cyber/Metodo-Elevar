
ALTER TABLE public.whatsapp_ai_agents ADD COLUMN agent_type text DEFAULT 'custom';
ALTER TABLE public.whatsapp_ai_agents ADD COLUMN knowledge_base text DEFAULT '';
ALTER TABLE public.whatsapp_ai_agents ADD COLUMN use_persona_context boolean DEFAULT true;
ALTER TABLE public.whatsapp_ai_agents ADD COLUMN use_copy_formats boolean DEFAULT false;
