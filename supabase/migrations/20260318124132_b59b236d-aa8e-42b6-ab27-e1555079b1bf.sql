
-- 1. Remove policy that lets users reset their own usage counters
DROP POLICY IF EXISTS "Users can update own usage limits" ON public.usage_limits;

-- 2. Remove policy that lets users grant themselves achievements
DROP POLICY IF EXISTS "System can insert user achievements" ON public.user_achievements;

-- 3. Remove policy that lets users inflate their own XP
DROP POLICY IF EXISTS "Users can update own xp" ON public.user_xp;
DROP POLICY IF EXISTS "Users can insert own xp" ON public.user_xp;

-- 4. Restrict agent_knowledge_base to admins only (remove public read)
DROP POLICY IF EXISTS "Authenticated can read knowledge base" ON public.agent_knowledge_base;

-- 5. Restrict poll votes visibility to own votes only
DROP POLICY IF EXISTS "Authenticated users can view votes" ON public.community_poll_votes;
CREATE POLICY "Users can view own votes" ON public.community_poll_votes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
