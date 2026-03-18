

## Plano: Contrato Visível, Confetes, Assinatura com Nome e Melhorias UX

### Mudanças Planejadas

#### 1. Salvar copy gerada e não regenerar (`FormalizeCommitment.tsx`)
- Adicionar coluna conceitual: salvar a copy gerada no campo `commitment_text` junto com o texto do compromisso (ou usar um novo campo `generated_copy` via alter table)
- Na prática: salvar a copy no `localStorage` com chave `elevar_commitment_copy_{userId}` para evitar chamadas de API repetidas
- No `loadData`: se já existe copy salva, usar ela. Só gerar via IA se não existir ainda
- Adicionar campo "Assine seu nome" (Input de texto) além do Textarea de compromisso — visual tipo assinatura com fonte cursiva
- Deixar o contrato sempre visível e legível (formato carta com borda elegante, fundo suave)
- Adicionar botão de voltar para `/aprendizado`

#### 2. Migração: adicionar coluna `generated_copy` à tabela `strategic_commitments`
- `ALTER TABLE strategic_commitments ADD COLUMN generated_copy text;`
- Salvar a copy gerada pela IA nessa coluna na primeira vez
- Nas próximas visitas, usar essa coluna em vez de chamar a edge function

#### 3. Campo "Assinatura" com nome (`FormalizeCommitment.tsx`)
- Adicionar `Input` com placeholder "Digite seu nome completo" abaixo do compromisso
- Estilizar com fonte cursiva (font-style italic + font-family serif) para parecer assinatura
- Campo `signature_name` salvo junto ao commitment

#### 4. Efeito confetes em cada tarefa concluída (`MissionChecklist.tsx`)
- Instalar/usar `canvas-confetti` (ou implementar CSS confetti simples)
- Ao marcar checkbox de missão como concluída → disparar confetes pequenos
- Ao clicar "Finalizar Encontro" → confetes grandes + toast de celebração

#### 5. Botão "Visualizar" para missões já concluídas (`MissionChecklist.tsx`)
- Quando `mission.completed === true`, trocar "Executar" por "👁 Visualizar"
- O botão "Visualizar" navega para a mesma rota mas sem marcar como pendente novamente
- Não re-gerar IA, não re-executar — apenas abrir a ferramenta para ver o que já fez

#### 6. StrategicCommitmentForm: adicionar faturamento anual + mensal (`StrategicCommitmentForm.tsx`)
- Renomear "Faturamento Atual Mensal" → manter
- Adicionar campo "💰 Faturamento Anual Atual" ao lado
- Clarificar "Meta Anual de Faturamento" com helper text: "Quanto você DESEJA faturar por ano"
- Em vez de mostrar o form de metas visível, mostrar o contrato de compromisso (card leitura) quando já assinado

#### 7. Contrato visível na aba Encontros (`LearningModules.tsx`)
- Substituir `StrategicCommitmentForm` por um card de "Contrato de Compromisso" quando já assinado
- Formato de cartinha visual: borda decorativa, texto da copy, assinatura do usuário
- Se não assinado, manter o formulário de metas + link para `/compromisso`

### Arquivos a Criar/Editar

| Arquivo | Ação |
|---|---|
| `src/pages/FormalizeCommitment.tsx` | Salvar copy no DB, campo assinatura com nome, confetes ao assinar, não regenerar copy |
| `src/components/learning/MissionChecklist.tsx` | Confetes ao completar missão, confetes grandes ao finalizar encontro, botão "Visualizar" |
| `src/components/learning/StrategicCommitmentForm.tsx` | Adicionar faturamento anual, clarificar labels, mostrar contrato visual quando assinado |
| `src/pages/LearningModules.tsx` | Mostrar contrato visual (cartinha) quando já assinado no lugar do form |
| `supabase/migrations/add_generated_copy.sql` | Adicionar coluna `generated_copy` e `signature_name` à tabela `strategic_commitments` |

### Detalhes Técnicos
- **Confetes**: Usar `canvas-confetti` (npm package, leve ~5KB) — `confetti({ particleCount: 100, spread: 70 })` para tarefas, burst maior para encontros
- **Copy salva**: Gerar 1x via edge function, salvar em `strategic_commitments.generated_copy`, nunca mais chamar a API
- **Fonte assinatura**: `style={{ fontFamily: "'Dancing Script', cursive, serif", fontSize: "1.25rem" }}` com Google Font ou italic serif fallback
- **Visualizar vs Executar**: Completada → botão ghost "Visualizar" que navega sem `markMissionPending()`

