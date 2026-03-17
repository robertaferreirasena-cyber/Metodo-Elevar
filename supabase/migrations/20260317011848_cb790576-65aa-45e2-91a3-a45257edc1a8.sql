-- Tabela de conquistas (admin define)
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT '🏆',
  category text DEFAULT 'geral',
  xp_reward integer DEFAULT 10,
  condition_type text NOT NULL DEFAULT 'manual',
  condition_value integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Conquistas desbloqueadas por usuário
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- XP e nível do usuário
CREATE TABLE public.user_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- achievements: todos autenticados podem ver, admins podem gerenciar
CREATE POLICY "Authenticated can view achievements" ON public.achievements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage achievements" ON public.achievements
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- user_achievements: usuário vê as suas, admins veem todas
CREATE POLICY "Users view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all user achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert user achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- user_xp: usuário vê/atualiza a sua, admins veem todas
CREATE POLICY "Users view own xp" ON public.user_xp
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp" ON public.user_xp
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own xp" ON public.user_xp
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all xp" ON public.user_xp
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Seed de conquistas iniciais
INSERT INTO public.achievements (title, description, icon, category, xp_reward, condition_type, condition_value) VALUES
  ('Primeiro Passo', 'Faça seu primeiro login na plataforma', '👣', 'inicio', 10, 'login_count', 1),
  ('Estrategista Iniciante', 'Gere 5 estratégias de vendas', '📝', 'estrategia', 25, 'strategy_count', 5),
  ('Mestre das Palavras', 'Gere 20 estratégias de vendas', '✍️', 'estrategia', 50, 'strategy_count', 20),
  ('Persona Expert', 'Complete seu perfil de persona', '🎯', 'persona', 30, 'persona_complete', 1),
  ('Sequenciador', 'Crie 3 sequências de conteúdo', '📅', 'sequencia', 40, 'sequence_count', 3),
  ('Fotógrafo Digital', 'Use o Ensaio Fotográfico pela primeira vez', '📸', 'ferramenta', 20, 'photoboss_count', 1),
  ('Comunidade Ativa', 'Envie 10 mensagens na comunidade', '💬', 'comunidade', 30, 'community_messages', 10),
  ('Calculador Pro', 'Use a calculadora de preços 5 vezes', '🧮', 'ferramenta', 20, 'calculator_count', 5),
  ('Maratonista', 'Use a plataforma por 7 dias seguidos', '🔥', 'streak', 50, 'streak_days', 7),
  ('Lenda', 'Alcance o nível 10', '👑', 'nivel', 100, 'level_reached', 10);