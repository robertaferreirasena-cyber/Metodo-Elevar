-- Table for strategic commitments (Encontro 0)
CREATE TABLE public.strategic_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  annual_goal text,
  quarterly_goal text,
  current_revenue text,
  main_challenge text,
  commitment_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.strategic_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own commitments" ON public.strategic_commitments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all commitments" ON public.strategic_commitments
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Clean existing generic modules/lessons to replace with Método ELEVAR
DELETE FROM public.user_module_progress;
DELETE FROM public.learning_lessons;
DELETE FROM public.learning_modules;

-- Insert 10 Encontros
INSERT INTO public.learning_modules (id, title, description, icon, category, position, is_active, total_lessons) VALUES
('e0000000-0000-0000-0000-000000000000', 'Encontro 0 – Imersão e Posicionamento', 'Alinhar postura, compromisso e visão de crescimento. Letra: E (Estrutura Mental)', '🎯', 'metodo-elevar', 0, true, 3),
('e0000000-0000-0000-0000-000000000001', 'Encontro 1 – Raio-X Estrutural Profundo', 'Clareza absoluta da realidade financeira e operacional. Letra: E (Estrutura Empresarial)', '🔍', 'metodo-elevar', 1, true, 3),
('e0000000-0000-0000-0000-000000000002', 'Encontro 2 – Posicionamento Premium 360°', 'Transformar a percepção da marca no físico e no digital. Letra: E (Estratégia Comercial)', '💎', 'metodo-elevar', 2, true, 3),
('e0000000-0000-0000-0000-000000000003', 'Encontro 3 – Sistema Comercial Integrado', 'Criar previsibilidade de vendas no físico e no digital. Letra: V (Validação)', '📊', 'metodo-elevar', 3, true, 3),
('e0000000-0000-0000-0000-000000000004', 'Encontro 4 – Liderança e Cultura', 'Transformar a empresária em líder estratégica. Letra: L (Liderança)', '👑', 'metodo-elevar', 4, true, 3),
('e0000000-0000-0000-0000-000000000005', 'Encontro 5 – Gestão Estratégica para Escala', 'Base financeira sustentável para 100K+. Letra: E (Estrutura Avançada)', '📈', 'metodo-elevar', 5, true, 3),
('e0000000-0000-0000-0000-000000000006', 'Encontro 6 – Validação e Otimização', 'Tomar decisões baseadas em dados. Letra: V (Validação e Velocidade)', '⚡', 'metodo-elevar', 6, true, 2),
('e0000000-0000-0000-0000-000000000007', 'Encontro 7 – Diferenciação e Posicionamento', 'Criar diferenciação competitiva real. Letra: R (Resultado)', '🏆', 'metodo-elevar', 7, true, 2),
('e0000000-0000-0000-0000-000000000008', 'Encontro 8 – Autonomia e Sistematização', 'Negócio funcionando sem dependência excessiva. Letra: A (Autonomia)', '🔄', 'metodo-elevar', 8, true, 2),
('e0000000-0000-0000-0000-000000000009', 'Encontro 9 – Plano de Escala 100K+', 'Visão de expansão estruturada. Letra: R (Resultado Escalável)', '🚀', 'metodo-elevar', 9, true, 1);

-- Encontro 0 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000000', 'Definir meta anual e trimestral', 'Estabeleça sua meta de faturamento anual e divida em metas trimestrais. Pense em 100K+ como pressuposto estrutural.', 0, 10, 'compromisso'),
('e0000000-0000-0000-0000-000000000000', 'Preencher diagnóstico de posicionamento', 'Avalie seu posicionamento atual: como sua marca é percebida, quem é seu público e qual sua proposta de valor.', 1, 15, 'persona'),
('e0000000-0000-0000-0000-000000000000', 'Formalizar compromisso estratégico', 'Assine seu compromisso com a execução do Método ELEVAR. Comprometa-se com as entregas e prazos da mentoria.', 2, 5, 'compromisso');

-- Encontro 1 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000001', 'Organizar números reais do negócio', 'Use a Calculadora de Preços para entender sua margem real vs faturamento ilusório. Mapeie custos fixos, variáveis e pró-labore.', 0, 20, 'calculadora'),
('e0000000-0000-0000-0000-000000000001', 'Listar 5 tarefas delegáveis', 'Identifique tarefas operacionais que você executa mas que poderiam ser delegadas. Use a Mentora Gi para ajudar nessa análise.', 1, 15, 'mentor'),
('e0000000-0000-0000-0000-000000000001', 'Ajustar posicionamento nas redes', 'Atualize seu perfil do Instagram com bio estratégica e destaques. Use o Ensaio Fotográfico para elevar seu posicionamento visual.', 2, 20, 'foto');

-- Encontro 2 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000002', 'Atualizar Instagram completamente', 'Refaça bio, destaques, feed e stories com posicionamento premium. Use a Mentora Gi (Copywriter) para textos estratégicos.', 0, 30, 'mentor'),
('e0000000-0000-0000-0000-000000000002', 'Criar ensaio fotográfico estratégico', 'Use o PhotoBoss para planejar um ensaio que comunique autoridade e posicionamento premium.', 1, 20, 'foto'),
('e0000000-0000-0000-0000-000000000002', 'Ajustar experiência do cliente', 'Mapeie a jornada do cliente (físico e digital) e identifique pontos de encantamento. Peça ajuda à Mentora Gi.', 2, 20, 'mentor');

-- Encontro 3 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000003', 'Criar calendário comercial padrão', 'Defina sua rotina de conteúdo: 3 posts/dia, 12 stories estruturados, live semanal. Use a Mentora Gi para gerar o calendário.', 0, 25, 'mentor'),
('e0000000-0000-0000-0000-000000000003', 'Estruturar grupo VIP no WhatsApp', 'Crie seu grupo estratégico de clientes VIP. Use o WhatsApp Diamond (Modo Grupo) para gerar conteúdo e sequências.', 1, 20, 'whatsapp_group'),
('e0000000-0000-0000-0000-000000000003', 'Aplicar roteiro de negociação', 'Use o WhatsApp Diamond (Modo Privado) com a Roberta para criar e praticar scripts de negociação e conversão.', 2, 15, 'whatsapp_private');

-- Encontro 4 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000004', 'Delegar 1 função humana', 'Escolha uma tarefa operacional e delegue para um membro da equipe. Documente o processo de delegação.', 0, 15, 'mentor'),
('e0000000-0000-0000-0000-000000000004', 'Delegar 1 função tecnológica', 'Identifique um processo que pode ser automatizado com tecnologia. Use a Mentora Gi para planejar a automação.', 1, 15, 'mentor'),
('e0000000-0000-0000-0000-000000000004', 'Criar rotina estratégica semanal', 'Defina sua agenda semanal como líder: reuniões, análise de métricas, planejamento e execução.', 2, 15, 'mentor');

-- Encontro 5 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000005', 'Ajustar preços estrategicamente', 'Use a Calculadora de Preços para recalcular sua precificação com margem real e pró-labore saudável.', 0, 20, 'calculadora'),
('e0000000-0000-0000-0000-000000000005', 'Definir meta trimestral progressiva', 'Crie sua projeção: 30K → 50K → 70K → 100K+. Use a Mentora Gi para estruturar o plano.', 1, 15, 'mentor'),
('e0000000-0000-0000-0000-000000000005', 'Organizar projeção de crescimento', 'Planeje investimentos necessários e tráfego estratégico para atingir a meta de escala.', 2, 15, 'mentor');

-- Encontro 6 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000006', 'Ajustar campanha ativa', 'Analise métricas da campanha atual e faça ajustes estratégicos baseados em dados.', 0, 20, 'mentor'),
('e0000000-0000-0000-0000-000000000006', 'Documentar aprendizados', 'Registre o que funcionou e o que precisa melhorar. Use a Mentora Gi para organizar insights.', 1, 15, 'mentor');

-- Encontro 7 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000007', 'Definir linha premium', 'Crie ou destaque sua linha premium de produtos/serviços. Defina fornecedores estratégicos e diferenciação.', 0, 20, 'mentor'),
('e0000000-0000-0000-0000-000000000007', 'Estruturar campanha diferenciada', 'Planeje uma campanha que comunique sua diferenciação competitiva. Use a Mentora Gi para criar a estratégia.', 1, 20, 'mentor');

-- Encontro 8 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000008', 'Criar checklist de processos', 'Documente todos os processos-chave do negócio. Crie indicadores de controle e rotina de liderança.', 0, 25, 'mentor'),
('e0000000-0000-0000-0000-000000000008', 'Testar ausência estratégica', 'Simule 1 dia sem operar. Verifique o que funciona sem você e o que ainda precisa de ajuste.', 1, 15, 'mentor');

-- Encontro 9 missions
INSERT INTO public.learning_lessons (module_id, title, content, position, duration_minutes, activity_type) VALUES
('e0000000-0000-0000-0000-000000000009', 'Entregar Plano Estratégico ELEVAR 180 dias', 'Construa seu plano de escala para 100K+ nos próximos 6 meses: time ideal, crescimento sustentável e visão de longo prazo.', 0, 30, 'mentor');