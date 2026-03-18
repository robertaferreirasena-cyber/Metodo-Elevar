

## Plano: Lógica de Caminho com Retorno ao Aprendizado + Separar Compromisso em 2 Missões

### Resumo
1. Adicionar botão "Finalizar e Salvar" nas páginas de ferramentas (Persona, Calculadora, etc.) que aparece quando o usuário veio do aprendizado, redirecionando de volta para `/aprendizado`
2. Separar o formulário atual em duas partes: "Definir Meta Anual e Trimestral" (formulário de metas) e "Formalizar Compromisso Estratégico" (mini-página com copy gerada por IA)
3. Criar nova página/componente de "Formalizar Compromisso" com copy personalizada via IA

### Mudanças Planejadas

#### 1. Botão "Finalizar e Salvar" nas ferramentas (retorno ao aprendizado)
- **`src/hooks/useMissionAutoComplete.ts`**: Além do `pending_mission_complete`, salvar flag `coming_from_learning=true` no localStorage
- **Criar `src/components/learning/FinishMissionButton.tsx`**: Componente reutilizável que verifica se `coming_from_learning` está setado. Se sim, mostra botão "✅ Finalizar e Voltar ao Aprendizado" que navega para `/aprendizado`
- **Adicionar em**: `PersonaRaioX.tsx` (ao lado do botão Editar na RaioXView), `PriceCalculator.tsx`, `MentorChat.tsx` e demais páginas de ferramentas

#### 2. Separar StrategicCommitmentForm em duas missões
- **Renomear `StrategicCommitmentForm.tsx`** para focar apenas em "Definir Meta Anual e Trimestral" (campos: meta anual, meta trimestral, faturamento atual, desafio principal). Remover campo `commitment_text`
- **Criar `src/pages/FormalizeCommitment.tsx`**: Nova página dedicada para "Formalizar Compromisso Estratégico"

#### 3. Página "Formalizar Compromisso Estratégico" (nova)
- Puxa dados do usuário: nome (profiles), nicho/negócio (persona_profiles), metas (strategic_commitments)
- Chama edge function para gerar copy personalizada via IA com esses dados
- Exibe a copy formatada como uma "carta de compromisso" visual
- Campo de texto para o compromisso pessoal + botão "Assinar Compromisso"
- Ao assinar, salva `commitment_text` na tabela `strategic_commitments` e redireciona para `/aprendizado`

#### 4. Edge Function `generate-commitment-copy`
- Recebe: nome, nicho, metas, faturamento, desafio
- Gera copy motivacional personalizada usando Lovable AI Gateway
- Retorna texto formatado para exibir na página

#### 5. Rota e Mapeamento
- Adicionar rota `/compromisso` no `App.tsx` para `FormalizeCommitment`
- Atualizar `ACTIVITY_CONFIG` no `MissionChecklist.tsx`: `compromisso` mapeia para `/compromisso`
- O tipo `compromisso` no admin já existe; agora terá rota funcional

### Arquivos a Criar/Editar

| Arquivo | Ação |
|---|---|
| `src/components/learning/FinishMissionButton.tsx` | **Criar** - Botão reutilizável de retorno ao aprendizado |
| `src/hooks/useMissionAutoComplete.ts` | **Editar** - Adicionar flag `coming_from_learning` |
| `src/pages/PersonaRaioX.tsx` | **Editar** - Adicionar FinishMissionButton na RaioXView |
| `src/components/learning/StrategicCommitmentForm.tsx` | **Editar** - Renomear para "Definir Metas" e remover campo compromisso |
| `src/pages/FormalizeCommitment.tsx` | **Criar** - Página com copy IA + assinatura |
| `supabase/functions/generate-commitment-copy/index.ts` | **Criar** - Edge function para gerar copy via IA |
| `src/App.tsx` | **Editar** - Adicionar rota `/compromisso` |
| `src/components/learning/MissionChecklist.tsx` | **Editar** - Mapear `compromisso` para `/compromisso` |

### Fluxo do Usuário
```text
Aprendizado → Clica "Executar" (ex: Raio-X) → Navega para /persona
  → Completa o Raio-X → Vê botão "Finalizar e Voltar"
  → Clica → Volta para /aprendizado com missão já concluída

Aprendizado → Clica "Executar" (Formalizar Compromisso) → /compromisso
  → Vê copy personalizada com seus dados reais
  → Assina compromisso → Volta para /aprendizado
```

