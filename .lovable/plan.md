

## Plano: Integração do Método ANDROMEDA e Expertise em Tráfego Pago

### Análise do App Atual

O app possui estas funções de IA e conteúdo:
- **Mentora Gi** (4 personas: Mentora Gi, Estrategista, Copywriter, Instagram Expert)
- **WhatsApp Hub** (estratégias 1:1, análise de conversa, scripts, grupos, sequências)
- **Raio-X Persona** (dossiê do cliente ideal)
- **Gerador de Ideias**

### Onde encaixar as novas habilidades

| Habilidade | Onde encaixar | Como |
|---|---|---|
| Copywriter de Cinema/Roteirista | Nova persona na Mentora Gi: **"Diretor Criativo"** | Persona com background Disney/Marvel/Netflix para storytelling em anúncios |
| Estrategista de Marca | Nova persona na Mentora Gi: **"Brand Strategist"** | Expertise Coca-Cola/Natura/Avon para posicionamento |
| Gestor de Tráfego | **Nova seção dedicada: "Tráfego Pago"** | Criador de anúncios com Método ANDROMEDA |
| Copywriting avançado | Ampliar persona existente "Copywriter" | Adicionar frameworks ANDROMEDA ao prompt |

### Recomendação: SIM, criar seção dedicada para Tráfego Pago

Justificativa: Tráfego pago tem um fluxo diferente (objetivo, público, orçamento, criativo, copy do anúncio). Não cabe apenas no chat — precisa de um formulário estruturado + geração com IA.

### Implementação

#### 1. Nova página: Tráfego Pago (`/trafego-pago`)

Página com formulário estruturado seguindo o Método ANDROMEDA:
- **A**tenção (hook visual/textual)
- **N**arrativa (storytelling cinematográfico)
- **D**or (problema do público)
- **R**esolução (sua solução)
- **O**ferta (proposta irresistível)
- **M**ovimento (CTA)
- **E**scassez (urgência)
- **D**ados (prova social/números)
- **A**ção (próximo passo)

Campos do formulário:
- Plataforma (Meta Ads, Google Ads, TikTok Ads)
- Objetivo (Vendas, Leads, Tráfego, Reconhecimento)
- Produto/Serviço (puxar do Raio-X se disponível)
- Público-alvo (puxar do Raio-X)
- Orçamento estimado
- Tom (Cinematográfico, Direto, Emocional, Aspiracional)

Output gerado pela IA:
- Copy do anúncio (headline, texto principal, descrição, CTA)
- Roteiro para vídeo (estilo cinema, com cenas e direção)
- Sugestão de criativo (briefing visual)
- Variações A/B

#### 2. Nova Edge Function: `ad-creator`

Edge function dedicada com system prompt que incorpora:
- Método ANDROMEDA como framework principal
- Background cinematográfico (roteiros estilo Disney/Marvel)
- Expertise de grandes marcas (Coca-Cola, Natura, Netflix)
- Copywriting avançado (PAS, AIDA, BAB integrados)
- Dados do Raio-X da Persona para personalização automática

#### 3. Duas novas personas na Mentora Gi

- **"Diretor Criativo"** (🎬): Para consultas livres sobre storytelling, roteiros de vídeo, narrativa de marca
- **"Gestor de Tráfego"** (📈): Para consultas sobre estratégia de tráfego, otimização, métricas

#### 4. Navegação

Adicionar "Tráfego Pago" na sidebar, dentro da seção principal ou como novo hub:

```text
Sidebar:
  Dashboard
  WhatsApp
  Mentora Gi       ← +2 personas (Diretor Criativo, Gestor de Tráfego)
  Tráfego Pago     ← NOVA SEÇÃO (ícone: Megaphone)
  Persona
  Aprendizado
  Conquistas
```

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `src/pages/TrafficAds.tsx` | Criar — página principal com formulário ANDROMEDA + resultado IA |
| `supabase/functions/ad-creator/index.ts` | Criar — edge function com prompt ANDROMEDA + integração Raio-X |
| `supabase/config.toml` | Adicionar `[functions.ad-creator]` |
| `src/pages/MentorChat.tsx` | Adicionar 2 novas personas (Diretor Criativo, Gestor de Tráfego) |
| `src/components/layout/AppSidebar.tsx` | Adicionar item "Tráfego Pago" na navegação |
| `src/App.tsx` | Adicionar rota `/trafego-pago` |
| `src/pages/MentoraHub.tsx` | Adicionar card de Tráfego Pago nos recursos relacionados |
| `agent_knowledge_base` | Cadastrar prompts editáveis para as novas personas e ad-creator |

### Prompt ANDROMEDA (resumo do system prompt)

O prompt do `ad-creator` seguirá esta estrutura:
- Identidade: Estrategista de marca + Diretor criativo com passagem por Coca-Cola, Natura, Disney, Marvel, Netflix
- Framework: Método ANDROMEDA (9 etapas)
- Output: Copy estruturada por plataforma (Meta/Google/TikTok) + roteiro de vídeo + briefing visual
- Personalização: Injeta dados do Raio-X automaticamente
- Variações: Sempre gera versão A e B para teste

### Permissões

Adicionar `module_traffic_ads` na tabela `user_feature_permissions` para controle de acesso por admin.

