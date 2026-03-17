

# Plano: Acesso de 4 Meses + Admin Completo com Navegacao por Abas + Base de Conhecimento

## 3 Frentes de Trabalho

---

### 1. Acesso de 4 Meses a Partir do Cadastro

**Problema**: O `handle_new_user()` cria assinatura com `status = 'active'` mas **sem `expires_at`**, significando acesso vitalicio.

**Solucao**: Migracao SQL para:
- Alterar `handle_new_user()` para definir `expires_at = NOW() + INTERVAL '4 months'` ao criar a subscription
- Atualizar subscriptions existentes que nao tem `expires_at` para calcular `started_at + 4 meses`

**Impacto**: O `ProtectedRoute.tsx` ja verifica `expires_at` e redireciona para `/assinatura-expirada`. Nenhuma mudanca de frontend necessaria.

---

### 2. Admin: Devolver Todas as Abas com Menu Superior

**Problema**: As paginas admin (Usuarios, Pagamentos, Tokens, Credenciais, Aprendizado) existem mas navegacao e por cards no dashboard. Usuario quer um **menu de abas no topo** para transitar rapidamente.

**Solucao**: Criar um componente `AdminLayout.tsx` com menu horizontal de abas (usando `Tabs` do shadcn ou nav links) que envolve todas as paginas admin:

```text
[ Dashboard | Usuarios | Pagamentos | Tokens | Credenciais | Aprendizado ]
```

Aplicar esse layout em todas as rotas `/admin/*`. Cada pagina admin usa o mesmo header com as abas, facilitando navegacao sem voltar ao dashboard.

**Arquivos**:
- **Criar** `src/components/admin/AdminLayout.tsx` — nav com links horizontais
- **Editar** `src/pages/Admin.tsx` — envolver com AdminLayout
- **Editar** `src/pages/AdminUsers.tsx` — remover breadcrumbs, usar AdminLayout
- **Editar** `src/pages/AdminPayments.tsx` — idem
- **Editar** `src/pages/AdminTokens.tsx` — idem
- **Editar** `src/pages/AdminCredentials.tsx` — idem
- **Editar** `src/pages/admin/AdminLearning.tsx` — idem

---

### 3. Devolver Base de Conhecimento dos Agentes

**O que ja existe**: Os edge functions (`sales-strategist`, `conversation-analyzer`, `sequence-generator`, `ai-mentor-chat`) ja possuem system prompts completos com base de conhecimento embutida:
- `ROBERTA` com arsenal de vendas, niveis de consciencia, formatos copy, remarketing
- `Mentora Gi` com 4 personas (mentora, estrategista, copywriter, instagram)
- `Conversation Analyzer` com framework de analise

**O que "devolver" significa**: Adicionar na aba Admin > Aprendizado (ou nova aba "Base de Conhecimento") a capacidade de **visualizar e editar os system prompts** dos agentes. Atualmente os prompts sao hardcoded nos edge functions.

**Solucao pragmatica**: Criar uma tabela `agent_knowledge_base` no banco para armazenar os system prompts customizaveis. Os edge functions consultam essa tabela e usam o prompt do banco (com fallback para o hardcoded). O admin edita via interface.

**Migracao SQL**:
```sql
CREATE TABLE agent_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text UNIQUE NOT NULL,
  agent_name text NOT NULL,
  system_prompt text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
-- RLS: admins manage, authenticated read
```

**Arquivos**:
- **Migracao SQL** — criar tabela `agent_knowledge_base` + seed com prompts atuais
- **Criar** `src/pages/admin/AdminKnowledgeBase.tsx` — interface para editar prompts
- **Editar** `src/App.tsx` — adicionar rota `/admin/base-conhecimento`
- **Editar** `AdminLayout.tsx` — adicionar aba "Base de Conhecimento"
- **Editar** edge functions (`sales-strategist`, `ai-mentor-chat`, `conversation-analyzer`, `sequence-generator`) — consultar tabela antes de usar prompt hardcoded

---

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| **Migracao SQL** | `handle_new_user` com expires_at 4 meses + tabela `agent_knowledge_base` |
| `src/components/admin/AdminLayout.tsx` | **Criar** — nav horizontal com abas admin |
| `src/pages/admin/AdminKnowledgeBase.tsx` | **Criar** — editor de prompts dos agentes |
| `src/pages/Admin.tsx` | Usar AdminLayout |
| `src/pages/AdminUsers.tsx` | Remover breadcrumbs, usar AdminLayout |
| `src/pages/AdminPayments.tsx` | Idem |
| `src/pages/AdminTokens.tsx` | Idem |
| `src/pages/AdminCredentials.tsx` | Idem |
| `src/pages/admin/AdminLearning.tsx` | Idem |
| `src/App.tsx` | Adicionar rota `/admin/base-conhecimento` |
| Edge functions (4) | Consultar `agent_knowledge_base` com fallback |

