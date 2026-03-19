

## Plano: Central de Automação ManyChat — Fluxos de Alta Conversão para Instagram

### Visão Geral

Criar uma nova seção no app chamada **"Automação Instagram"** que combina geração de roteiros/textos de fluxos ManyChat com IA + futura integração direta via API ManyChat. O sistema seguirá os padrões atualizados do ManyChat (Instagram Graph API, limite de 200 DMs/hora, janela de 24h).

A implementação será em **2 fases**:
- **Fase 1 (agora)**: Gerador inteligente de fluxos — a IA cria o roteiro completo do fluxo com textos, triggers, condições e estrutura visual para o usuário montar no ManyChat.
- **Fase 2 (futuro)**: Integração com API ManyChat para criar fluxos diretamente na conta do usuário.

---

### Fase 1: Gerador de Fluxos ManyChat com IA

#### Tipos de fluxo contemplados

| Tipo | Trigger | Descrição |
|---|---|---|
| Comentário → DM | Palavra-chave em post/Reel | Usuário comenta e recebe DM automática com link/oferta |
| Story Reply → Funil | Resposta ao Story | Sequência de qualificação via perguntas no DM |
| DM Welcome + Qualificação | Primeira mensagem no DM | Boas-vindas + perguntas para segmentar e direcionar oferta |
| Funil de Lançamento | Palavra-chave ou link na bio | Sequência de aquecimento → oferta → escassez |
| Recuperação de Carrinho | Tag ou custom field | Sequência de follow-up para quem não comprou |
| Nutrição de Lead | Sequência temporal | Conteúdo de valor + oferta após X dias |

#### Formulário de entrada

- **Tipo de fluxo** (seleção dos tipos acima)
- **Produto/Serviço** (puxar do Raio-X se disponível)
- **Público-alvo** (puxar do Raio-X)
- **Objetivo** (Vendas, Leads, Engajamento, Lançamento)
- **Tom de voz** (Amigável, Profissional, Descontraído, Urgente)
- **Palavra-chave trigger** (para fluxos de comentário)
- **Quantidade de etapas** (3, 5, 7 mensagens)

#### Output gerado pela IA

Para cada fluxo, a IA gerará:
1. **Estrutura visual do fluxo** (diagrama em texto com setas e condições)
2. **Textos de cada mensagem** (com emojis, CTAs, botões)
3. **Configuração de triggers** (palavra-chave, Story reply, etc.)
4. **Condições e branches** (sim/não, interesse, objeção)
5. **Tags e Custom Fields** sugeridos para segmentação
6. **Quick Replies / Botões** formatados no padrão ManyChat
7. **Delays recomendados** entre mensagens (respeitando janela de 24h)
8. **Variação A/B** para a primeira mensagem

---

### Arquivos a criar

| Arquivo | Descrição |
|---|---|
| `src/pages/ManyChatFlows.tsx` | Página principal com formulário + resultado |
| `supabase/functions/manychat-flow-generator/index.ts` | Edge function com prompt especializado em ManyChat |

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Adicionar rota `/automacao-instagram` |
| `src/components/layout/AppSidebar.tsx` | Adicionar item na navegação principal (ícone: `Bot` ou `Workflow`) |
| `src/hooks/usePermissions.ts` | Adicionar `module_manychat_flows` |
| `src/pages/AccessBlocked.tsx` | Adicionar label do novo módulo |
| `supabase/config.toml` | Registrar `[functions.manychat-flow-generator]` |

### Migração SQL

```sql
ALTER TABLE public.user_feature_permissions
ADD COLUMN IF NOT EXISTS module_manychat_flows boolean DEFAULT true;
```

### Edge Function: Prompt do Gerador

O system prompt será estruturado como um especialista em:
- **Copywriting de alta conversão** para DMs automatizadas
- **Arquitetura de fluxos ManyChat** (triggers, conditions, actions, delays)
- **Compliance Instagram** (janela de 24h, limite 200 DMs/hora, políticas da Meta)
- **Técnicas de qualificação** (perguntas abertas vs. botões, scoring de lead)
- **Padrões ManyChat atualizados** (Quick Replies com limite de 13 botões, Smart Delays, Conditions, Actions)

O prompt receberá contexto do Raio-X da Persona automaticamente.

### Navegação

```text
Sidebar (principal):
  Dashboard
  WhatsApp
  Mentora Gi
  Tráfego Pago
  Automação Instagram  ← NOVO (ícone: Workflow/Bot)
  Persona
  Aprendizado
  Conquistas
```

### Nova Persona na Mentora Gi

Adicionar persona **"Especialista ManyChat"** no chat da Mentora Gi para consultas livres sobre automação, estratégia de fluxos e troubleshooting.

| Arquivo | Mudança |
|---|---|
| `src/pages/MentorChat.tsx` | Adicionar persona "especialista-manychat" |
| `supabase/functions/ai-mentor-chat/index.ts` | Adicionar system prompt da persona |

---

### Fase 2 (futura — não implementada agora)

Integração direta com a API do ManyChat:
- Usuário conecta conta ManyChat via API Key
- App cria fluxos automaticamente via `POST /fb/sending/sendFlow`
- Sincroniza tags e custom fields
- Requer secret `MANYCHAT_API_KEY` por usuário (armazenada no banco, encriptada)

Esta fase será planejada separadamente após a Fase 1 estar validada.

