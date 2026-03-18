

## Plano: Salvamento Real, Finalização de Atividades e Correção de Mapeamentos

### Problemas Identificados

#### 1. Mismatch nos activity_type entre Admin e MissionChecklist
O painel admin cadastra missões com os tipos: `calculator`, `photo`, `content`
Mas o `MissionChecklist.tsx` usa chaves diferentes: `calculadora`, `foto` — que nunca vão bater.

| Admin cadastra | MissionChecklist espera | Status |
|---|---|---|
| `whatsapp_private` | `whatsapp_private` | ✅ OK |
| `whatsapp_group` | `whatsapp_group` | ✅ OK |
| `persona` | `persona` | ✅ OK |
| `mentor` | `mentor` | ✅ OK |
| `content` | ❌ não existe | Faltando |
| `calculator` | `calculadora` ❌ | Chave errada |
| `photo` | `foto` ❌ | Chave errada |
| — | `compromisso` | Não existe no admin |

#### 2. Salvamento do progresso não tem feedback de "Finalizar e Salvar"
O `toggleLessonComplete` funciona mas não há um botão claro de "Finalizar Encontro" quando todas as missões são completadas.

#### 3. Compromisso Estratégico não está como activity_type no admin
O tipo `compromisso` deveria existir no admin para poder ser associado a missões do Encontro 0.

### Mudanças Planejadas

#### Arquivo: `src/components/learning/MissionChecklist.tsx`
- Corrigir `ACTIVITY_CONFIG`: trocar `calculadora` → `calculator`, `foto` → `photo`
- Adicionar `content` mapeado para `/mentora` (Mentora Gi / produção de conteúdo)
- Adicionar botão "✅ Finalizar Encontro" que aparece quando todas missões do módulo estão completas, com toast de celebração e salvamento automático
- Adicionar lógica visual de "encontro finalizado" com card de parabéns

#### Arquivo: `src/pages/admin/AdminLearning.tsx`
- Adicionar `compromisso` como opção de activity_type no Select do admin

#### Arquivo: `src/components/learning/StrategicCommitmentForm.tsx`
- Adicionar descrição "Assine seu compromisso com a execução do Método ELEVAR. Comprometa-se com as entregas e prazos da mentoria."
- Melhorar o feedback de salvamento com toast mais detalhado

#### Arquivo: `src/pages/Dashboard.tsx`
- Corrigir `activityRoutes` para incluir `content` e `compromisso`

### Detalhes Técnicos

**ACTIVITY_CONFIG corrigido:**
```
compromisso → "" (inline form)
persona → /persona
calculator → /calculadora
mentor → /mentora
content → /mentora (conteúdo vai para Mentora Gi)
photo → /ensaio-fotografico
whatsapp_private → /privado
whatsapp_group → /grupo
```

**Botão Finalizar Encontro:**
- Aparece apenas quando `progressPercent === 100`
- Mostra toast "🎉 Encontro X finalizado!"
- Salva timestamp no `localStorage` como `elevar_completed_${moduleId}`
- Visual: card verde de celebração no final da lista de missões

**Sem migrações necessárias** — os dados de progresso já são salvos no Supabase via `user_module_progress`. As correções são apenas de mapeamento no frontend.

### Arquivos a Editar

| Arquivo | Ação |
|---|---|
| `src/components/learning/MissionChecklist.tsx` | Corrigir ACTIVITY_CONFIG + botão Finalizar |
| `src/pages/admin/AdminLearning.tsx` | Adicionar `compromisso` ao Select |
| `src/pages/Dashboard.tsx` | Corrigir activityRoutes |
| `src/components/learning/StrategicCommitmentForm.tsx` | Melhorar descrição e feedback |

