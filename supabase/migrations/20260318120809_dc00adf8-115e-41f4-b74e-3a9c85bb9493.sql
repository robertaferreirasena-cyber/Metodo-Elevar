-- Update lesson content to replace "100K+" with "dobrar o faturamento"
UPDATE public.learning_lessons SET content = 'Estabeleça sua meta de faturamento anual e divida em metas trimestrais. Pense em dobrar o faturamento como pressuposto estrutural.' WHERE content ILIKE '%100K%' AND title = 'Definir meta anual e trimestral';

UPDATE public.learning_lessons SET content = 'Crie sua projeção: 30K → 50K → 70K e além. Use a Mentora Gi para estruturar o plano e dobrar o faturamento.' WHERE content ILIKE '%100K%' AND title = 'Definir meta trimestral progressiva';

UPDATE public.learning_lessons SET content = 'Construa seu plano de escala para dobrar o faturamento nos próximos 6 meses: time ideal, crescimento sustentável e visão de longo prazo.' WHERE content ILIKE '%100K%' AND title = 'Entregar Plano Estratégico ELEVAR 180 dias';

-- Update module title
UPDATE public.learning_modules SET title = 'Encontro 9 – Plano de Escala: Dobre o Faturamento' WHERE title = 'Encontro 9 – Plano de Escala 100K+';