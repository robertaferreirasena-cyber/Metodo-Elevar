
-- Create parameterless is_admin() that uses auth.uid() internally
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ 
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') 
$function$;

-- Revoke execute on the parameterized version from public/authenticated
-- Keep it available only for service role (edge functions)
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;

-- Update all RLS policies to use parameterless is_admin()
-- achievements
DROP POLICY IF EXISTS "Admins manage achievements" ON public.achievements;
CREATE POLICY "Admins manage achievements" ON public.achievements FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- agent_knowledge_base
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON public.agent_knowledge_base;
CREATE POLICY "Admins can manage knowledge base" ON public.agent_knowledge_base FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- community_materials
DROP POLICY IF EXISTS "Admins can create materials" ON public.community_materials;
CREATE POLICY "Admins can create materials" ON public.community_materials FOR INSERT TO authenticated
  WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can delete materials" ON public.community_materials;
CREATE POLICY "Admins can delete materials" ON public.community_materials FOR DELETE TO authenticated
  USING (is_admin());
DROP POLICY IF EXISTS "Admins can update materials" ON public.community_materials;
CREATE POLICY "Admins can update materials" ON public.community_materials FOR UPDATE TO authenticated
  USING (is_admin());

-- community_messages
DROP POLICY IF EXISTS "Admins can update messages" ON public.community_messages;
CREATE POLICY "Admins can update messages" ON public.community_messages FOR UPDATE TO authenticated
  USING (is_admin());
DROP POLICY IF EXISTS "Users can delete own messages or admins" ON public.community_messages;
CREATE POLICY "Users can delete own messages or admins" ON public.community_messages FOR DELETE TO authenticated
  USING ((auth.uid() = user_id) OR is_admin());

-- community_polls
DROP POLICY IF EXISTS "Admins can create polls" ON public.community_polls;
CREATE POLICY "Admins can create polls" ON public.community_polls FOR INSERT TO authenticated
  WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can delete polls" ON public.community_polls;
CREATE POLICY "Admins can delete polls" ON public.community_polls FOR DELETE TO authenticated
  USING (is_admin());

-- kiwify_orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.kiwify_orders;
CREATE POLICY "Admins can view all orders" ON public.kiwify_orders FOR SELECT TO authenticated
  USING (is_admin());

-- linked_emails
DROP POLICY IF EXISTS "Admins can manage linked emails" ON public.linked_emails;
CREATE POLICY "Admins can manage linked emails" ON public.linked_emails FOR ALL TO authenticated
  USING (is_admin());

-- strategic_commitments
DROP POLICY IF EXISTS "Admins can view all commitments" ON public.strategic_commitments;
CREATE POLICY "Admins can view all commitments" ON public.strategic_commitments FOR SELECT TO authenticated
  USING (is_admin());

-- subscriptions
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions FOR DELETE TO authenticated
  USING (is_admin());
DROP POLICY IF EXISTS "Admins can update any subscription" ON public.subscriptions;
CREATE POLICY "Admins can update any subscription" ON public.subscriptions FOR UPDATE TO authenticated
  USING (is_admin());

-- usage_limits
DROP POLICY IF EXISTS "Admins can view all usage limits" ON public.usage_limits;
CREATE POLICY "Admins can view all usage limits" ON public.usage_limits FOR SELECT TO authenticated
  USING (is_admin());

-- user_achievements
DROP POLICY IF EXISTS "Admins view all user achievements" ON public.user_achievements;
CREATE POLICY "Admins view all user achievements" ON public.user_achievements FOR SELECT TO authenticated
  USING (is_admin());

-- user_feature_permissions
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_feature_permissions;
CREATE POLICY "Admins can manage permissions" ON public.user_feature_permissions FOR ALL TO authenticated
  USING (is_admin());

-- user_module_progress
DROP POLICY IF EXISTS "Admins view all progress" ON public.user_module_progress;
CREATE POLICY "Admins view all progress" ON public.user_module_progress FOR SELECT TO authenticated
  USING (is_admin());

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (is_admin());

-- user_tag_assignments
DROP POLICY IF EXISTS "Admins can manage tag assignments" ON public.user_tag_assignments;
CREATE POLICY "Admins can manage tag assignments" ON public.user_tag_assignments FOR ALL TO authenticated
  USING (is_admin());

-- user_tags
DROP POLICY IF EXISTS "Admins can manage tags" ON public.user_tags;
CREATE POLICY "Admins can manage tags" ON public.user_tags FOR ALL TO authenticated
  USING (is_admin());

-- user_xp
DROP POLICY IF EXISTS "Admins view all xp" ON public.user_xp;
CREATE POLICY "Admins view all xp" ON public.user_xp FOR SELECT TO authenticated
  USING (is_admin());

-- learning_modules
DROP POLICY IF EXISTS "Admins manage modules" ON public.learning_modules;
CREATE POLICY "Admins manage modules" ON public.learning_modules FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- learning_lessons
DROP POLICY IF EXISTS "Admins manage lessons" ON public.learning_lessons;
CREATE POLICY "Admins manage lessons" ON public.learning_lessons FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
