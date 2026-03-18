

## Plano: Painel de Estratégia com Acompanhamento no Dashboard de Missões

### Problema
O aluno não tem uma visão clara do fluxo estratégico integrado. As missões existem mas falta:
1. Um card de "Plano Estratégico" sempre visível no dashboard mostrando onde o aluno está no fluxo
2. Avisos/alertas guiando o próximo passo
3. Salvamento automático do progresso com indicadores visuais de etapa atual

### Mudanças Planejadas

#### 1. Componente `StrategicPlanTracker` (novo)
Criar `src/components/learning/StrategicPlanTracker.tsx` - um card fixo no topo do dashboard de missões que:
- Mostra o encontro atual (baseado no primeiro módulo incompleto)
- Exibe a próxima missão pendente com botão direto de ação
- Mostra um stepper visual com os 10 encontros (0-9) como etapas
- Indica claramente: "Você está no Encontro X, Missão Y de Z"
- Salva o último encontro visitado em `localStorage` para manter contexto

#### 2. Sistema de Avisos/Alertas no Dashboard
No `LearningModules.tsx` (aba Encontros), adicionar:
- Alert banner no topo quando há missões pendentes: "Você tem X missões pendentes no Encontro Y. Continue de onde parou!"
- Toast automático ao entrar na página se houver missão incompleta
- Destaque visual (auto-expand) do encontro atual incompleto
- Aviso quando o aluno pula encontros: "Recomendamos completar o Encontro X antes de avançar"

#### 3. Dashboard Principal (`Dashboard.tsx`) - Card de Acompanhamento
Adicionar um card compacto no Dashboard principal mostrando:
- Encontro atual + progresso visual (stepper)
- Próxima missão com link direto
- Botão "Continuar Método ELEVAR" que leva ao encontro correto

#### 4. Lógica de Fluxo Sequencial
- Calcular automaticamente o "encontro atual" = primeiro módulo com progresso < 100%
- Auto-expandir o encontro atual ao abrir a página
- Salvar estado do fluxo (encontro atual, última missão feita) via `strategic_commitments` existente ou `localStorage`

### Arquivos a Criar/Editar

| Arquivo | Acao |
|---------|------|
| `src/components/learning/StrategicPlanTracker.tsx` | **Criar** - Stepper visual + próxima missão + status |
| `src/pages/LearningModules.tsx` | **Editar** - Adicionar tracker, alertas, auto-expand do encontro atual |
| `src/pages/Dashboard.tsx` | **Editar** - Card de acompanhamento do Método ELEVAR com stepper |
| `src/hooks/useLearning.ts` | **Editar** - Adicionar helpers: `getCurrentModule()`, `getNextMission()` |

### Detalhes Tecnicos

- **Stepper visual**: Linha horizontal com circulos para cada encontro (0-9), preenchidos conforme progresso, com o atual destacado
- **Auto-expand**: Ao montar `EncontrosTab`, calcular primeiro modulo incompleto e setar como `expandedModuleId`
- **Alerta**: Usar componente `Alert` do shadcn com icone e mensagem contextual
- **Sem nova tabela**: Usa dados ja existentes de `learning_modules`, `user_module_progress` e `strategic_commitments`
- **Performance**: Calculos derivados dos dados ja carregados pelo `useLearning`, sem queries adicionais

