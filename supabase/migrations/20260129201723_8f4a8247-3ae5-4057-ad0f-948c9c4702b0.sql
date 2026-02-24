-- Tipo enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabela de roles de usuário (segura contra privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função segura para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  )
$$;

-- Policy: admins podem ver todos os roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy: admins podem gerenciar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Tabela de pedidos Kiwify
CREATE TABLE public.kiwify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiwify_order_id TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  product_id TEXT,
  product_name TEXT,
  status TEXT NOT NULL DEFAULT 'paid',
  amount INTEGER,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.kiwify_orders ENABLE ROW LEVEL SECURITY;

-- Policy: somente admins podem ver pedidos
CREATE POLICY "Admins can view all orders"
ON public.kiwify_orders
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Adicionar campos na tabela subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS kiwify_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_source TEXT DEFAULT 'manual';

-- Tabela de mensagens da comunidade
CREATE TABLE public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  attachment_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Policy: usuários autenticados podem ver mensagens
CREATE POLICY "Authenticated users can view messages"
ON public.community_messages
FOR SELECT
TO authenticated
USING (true);

-- Policy: usuários podem criar suas próprias mensagens
CREATE POLICY "Users can create own messages"
ON public.community_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: usuários podem deletar próprias mensagens OU admins podem deletar qualquer uma
CREATE POLICY "Users can delete own messages or admins can delete any"
ON public.community_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Policy: admins podem atualizar mensagens (para fixar)
CREATE POLICY "Admins can update messages"
ON public.community_messages
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Tabela de materiais da comunidade
CREATE TABLE public.community_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.community_materials ENABLE ROW LEVEL SECURITY;

-- Policy: usuários autenticados podem ver materiais
CREATE POLICY "Authenticated users can view materials"
ON public.community_materials
FOR SELECT
TO authenticated
USING (true);

-- Policy: admins podem criar materiais
CREATE POLICY "Admins can create materials"
ON public.community_materials
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Policy: admins podem atualizar materiais
CREATE POLICY "Admins can update materials"
ON public.community_materials
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy: admins podem deletar materiais
CREATE POLICY "Admins can delete materials"
ON public.community_materials
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Função para buscar perfis (para admins)
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles
  WHERE public.is_admin(auth.uid())
$$;

-- Função para buscar todas assinaturas (para admins)
CREATE OR REPLACE FUNCTION public.get_all_subscriptions()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  plan TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  kiwify_order_id TEXT,
  payment_source TEXT,
  email TEXT,
  full_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.plan,
    s.status,
    s.started_at,
    s.expires_at,
    s.kiwify_order_id,
    s.payment_source,
    p.email,
    p.full_name
  FROM public.subscriptions s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE public.is_admin(auth.uid())
$$;

-- Habilitar realtime para mensagens da comunidade
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;