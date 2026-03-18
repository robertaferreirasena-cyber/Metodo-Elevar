# Plano: Acesso 4 Meses + Admin Completo + Base de Conhecimento

## Status: ✅ Implementado

## O que foi feito

### 1. Acesso de 4 Meses
- `handle_new_user()` agora define `expires_at = NOW() + 4 months`
- Subscriptions existentes sem `expires_at` atualizadas para `started_at + 4 meses`

### 2. Admin com Menu de Abas
- `AdminLayout.tsx` com navegação horizontal: Dashboard, Usuários, Pagamentos, Tokens, Credenciais, Aprendizado, Base IA
- Todas as páginas admin envolvidas com AdminLayout
- Breadcrumbs removidos em favor das abas

### 3. Base de Conhecimento IA
- Tabela `agent_knowledge_base` (agent_key, agent_name, system_prompt)
- Página `/admin/base-conhecimento` para editar prompts dos agentes
- Edge functions (ai-mentor-chat, sales-strategist, conversation-analyzer, sequence-generator) consultam a tabela com fallback para prompts hardcoded
- Cache de 5 minutos para evitar queries excessivas
