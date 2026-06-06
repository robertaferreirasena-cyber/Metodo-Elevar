
-- A: Limpar conversas e mensagens do estrategista antigo + análise de conversa
DELETE FROM public.messages WHERE conversation_id IN (SELECT id FROM public.conversations WHERE type IN ('strategy','analysis'));
DELETE FROM public.conversations WHERE type IN ('strategy','analysis');

-- D: Remover coluna órfã do estrategista privado
ALTER TABLE public.user_feature_permissions DROP COLUMN IF EXISTS module_private;
ALTER TABLE public.user_feature_permissions DROP COLUMN IF EXISTS module_conversation_analysis;
