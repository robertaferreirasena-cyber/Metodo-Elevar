-- Learning Modules
CREATE TABLE public.learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT '📖',
  category text DEFAULT 'instagram',
  position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  total_lessons integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view modules" ON public.learning_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage modules" ON public.learning_modules FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Learning Lessons
CREATE TABLE public.learning_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.learning_modules(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text,
  video_url text,
  position integer DEFAULT 0,
  duration_minutes integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view lessons" ON public.learning_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage lessons" ON public.learning_lessons FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- User Module Progress
CREATE TABLE public.user_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.learning_lessons(id) ON DELETE CASCADE NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progress" ON public.user_module_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON public.user_module_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.user_module_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all progress" ON public.user_module_progress FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Seed initial modules
INSERT INTO public.learning_modules (title, description, icon, category, position, total_lessons) VALUES
('Instagram para Vendas', 'Domine o Instagram como canal de vendas', '📸', 'instagram', 1, 5),
('Stories que Vendem', 'Crie stories irresistíveis que convertem', '🎬', 'instagram', 2, 4),
('Reels Magnéticos', 'Produza reels que atraem seguidores qualificados', '🎥', 'instagram', 3, 4),
('Bio Perfeita', 'Otimize sua bio para converter visitantes em seguidores', '✨', 'instagram', 4, 3),
('Copywriting Digital', 'Domine a arte de escrever textos que vendem', '✍️', 'copywriting', 5, 5),
('Funil de Vendas', 'Monte funis de alta conversão no digital', '🔄', 'estrategia', 6, 4);

-- Seed some lessons
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes) 
SELECT m.id, l.title, l.content, l.pos, l.dur
FROM public.learning_modules m
CROSS JOIN (VALUES
  ('Instagram para Vendas', 'Fundamentos do Instagram Comercial', 'Aprenda a configurar e otimizar sua conta comercial no Instagram para máxima performance.', 1, 8),
  ('Instagram para Vendas', 'Algoritmo e Alcance', 'Entenda como o algoritmo funciona e como aumentar seu alcance orgânico.', 2, 10),
  ('Instagram para Vendas', 'Estratégia de Conteúdo', 'Monte uma estratégia de conteúdo que atrai, engaja e converte.', 3, 12),
  ('Stories que Vendem', 'Anatomia de um Story que Vende', 'Descubra os elementos essenciais de stories que geram vendas.', 1, 7),
  ('Stories que Vendem', 'Sequência de Stories', 'Aprenda a criar sequências de stories que mantêm a atenção.', 2, 9),
  ('Copywriting Digital', 'Headlines que Param o Scroll', 'Técnicas para criar títulos irresistíveis que capturam atenção.', 1, 10),
  ('Copywriting Digital', 'Gatilhos Mentais na Prática', 'Use gatilhos mentais de forma ética e eficaz nos seus textos.', 2, 12)
) AS l(mod_title, title, content, pos, dur)
WHERE m.title = l.mod_title;