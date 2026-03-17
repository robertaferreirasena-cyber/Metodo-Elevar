

# Plano: Jornada do Aluno + Hub Pages + Menu Simplificado

## Conceito
Transformar o app de um "dashboard de ferramentas" para uma **jornada guiada do aluno**. Ao inves de mostrar tudo de uma vez, o aluno ve sua jornada atual e e direcionado para a etapa correta baseado nas atividades da mentoria.

## Arquitetura

```text
Sidebar (simplificado)          Paginas Hub
─────────────────────          ──────────────
Dashboard (Jornada)             /
📱 WhatsApp         ──────►    /whatsapp (hub com sub-dashboard)
🧠 Mentora Gi       ──────►    /mentora (hub com chat + recursos)
📚 Aprendizado      ──────►    /aprendizado
🏆 Conquistas       ──────►    /conquistas
📦 Mais             ──────►    (expandir: Persona, Ideias, Calc, etc)
🔐 Admin
```

## Mudancas

### 1. Sidebar Simplificado (`AppSidebar.tsx`)
Reduzir de 6 grupos / 16+ itens para menu limpo:
- **Dashboard** (home - jornada)
- **📱 WhatsApp** (link unico para hub `/whatsapp`)
- **🧠 Mentora Gi** (link unico para hub `/mentora-hub`)
- **📚 Aprendizado** (link para `/aprendizado`)
- **🏆 Conquistas** (link para `/conquistas`)
- **📦 Mais** (collapsible: Persona, Ideias, Calculadora, Ensaio Foto, Comunidade, Favoritos, Historico, Glossario, Instalar)
- **🔐 Admin** (se admin)

Rebrand header: "Mentoria Elevar" / "Sua assistente de vendas"

### 2. WhatsApp Hub Page (`/whatsapp`) - NOVA
Uma pagina unica que concentra tudo de WhatsApp:
- Header com icone e titulo "WhatsApp - Central de Vendas"
- Cards de acesso rapido para:
  - Estrategias 1:1 (`/privado/estrategias`)
  - Analise de Conversa (`/privado/analise`)
  - Scripts Prontos (`/privado/scripts`)
  - Conteudo p/ Grupo (`/grupo/conteudo`)
  - Sequencias (`/grupo/sequencias`)
  - Templates (`/grupo/templates`)
- Stats do aluno (conversas, favoritos)

### 3. Mentora Gi Hub Page (`/mentora-hub`) - NOVA
Hub que agrupa Mentora Gi + recursos relacionados:
- Chat da Mentora Gi (componente principal)
- Acesso rapido a: Ideias, Persona, Ensaio Foto
- Historico de conversas com a mentora

### 4. Dashboard = Jornada do Aluno (`Dashboard.tsx`) - REFAZER
Substituir o dashboard atual por uma **tela de jornada guiada**:

- **Card de boas-vindas** (manter, com nome + greeting)
- **Card "Sua Proxima Atividade"** - O CORE:
  - Puxa os modulos de aprendizado (`useLearning`)
  - Identifica a proxima licao nao concluida
  - Exibe: titulo da aula, descricao da atividade
  - Botao de acao que direciona para a pagina correta baseado no tipo de atividade:
    - Atividade sobre atendimento individual → `/whatsapp`
    - Atividade sobre conteudo de grupo → `/whatsapp` (secao grupo)
    - Atividade sobre persona → `/persona`
    - Atividade sobre copy → glossario ou mentora
  - Logica de mapeamento: cada `learning_lesson` tera um campo `activity_type` que mapeia para uma rota
- **Progresso geral** - barra de progresso dos modulos + nivel XP
- **Acesso rapido** - grid reduzido (WhatsApp, Mentora, Aprendizado, Conquistas)

### 5. Migracao de Banco: campo `activity_type` em `learning_lessons`
Adicionar coluna `activity_type text default null` na tabela `learning_lessons`.
Valores possiveis: `whatsapp_private`, `whatsapp_group`, `persona`, `content`, `mentor`, `calculator`, `photo`.
O admin pode definir isso ao criar licoes. O dashboard usa esse campo para direcionar o aluno.

### 6. Atualizar Rotas (`App.tsx`)
- Adicionar rota `/whatsapp` → WhatsAppHub
- Adicionar rota `/mentora-hub` → MentoraHub
- Manter rotas existentes de sub-paginas (privado/*, grupo/*, etc)

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/layout/AppSidebar.tsx` | Simplificar menu, rebrand |
| `src/pages/Dashboard.tsx` | Refazer como jornada do aluno |
| `src/pages/WhatsAppHub.tsx` | **Criar** - hub de WhatsApp |
| `src/pages/MentoraHub.tsx` | **Criar** - hub da Mentora |
| `src/App.tsx` | Adicionar 2 rotas novas |
| `src/hooks/useLearning.ts` | Adicionar leitura de `activity_type` |
| **Migracao SQL** | Adicionar `activity_type` em `learning_lessons` |

## Fluxo do Aluno

```text
Login → Dashboard (Jornada)
  ↓
"Sua proxima atividade: Aula 2 - Atendimento Individual"
  ↓ [click: Ir para atividade]
WhatsApp Hub → Estrategias 1:1
  ↓ [conclui atividade, marca como feita]
Dashboard atualiza → proxima atividade
```

