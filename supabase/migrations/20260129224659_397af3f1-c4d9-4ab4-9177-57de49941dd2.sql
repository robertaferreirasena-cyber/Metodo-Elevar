-- 1. Inserir profiles para usuários existentes (que não foram criados pelo trigger)
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir subscriptions Pro para admins
INSERT INTO public.subscriptions (user_id, plan, status, expires_at)
SELECT p.id, 'pro', 'active', NOW() + INTERVAL '100 years'
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email IN ('gianescatolin@hotmail.com', 'robertaferreirasena@gmail.com')
  AND p.id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT (user_id) DO UPDATE SET
  plan = 'pro',
  status = 'active',
  expires_at = NOW() + INTERVAL '100 years';

-- 3. Adicionar role de admin para os emails especificados
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email IN ('gianescatolin@hotmail.com', 'robertaferreirasena@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Criar bucket para anexos do chat
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-attachments', 'chat-attachments', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- 5. Policy: Qualquer usuário autenticado pode ver arquivos
CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- 6. Policy: Apenas admins podem fazer upload
CREATE POLICY "Admins can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND public.is_admin(auth.uid())
);

-- 7. Policy: Apenas admins podem deletar
CREATE POLICY "Admins can delete chat attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments' 
  AND public.is_admin(auth.uid())
);