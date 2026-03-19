

## Plano: Simulador do Gerenciador de Anúncios

### Conceito

Após gerar um anúncio com o Método ANDROMEDA, o usuário clica em "Aprovar Campanha". A IA então transforma o resultado em uma **estrutura JSON organizada** (Campanha → Conjunto de Anúncios → Anúncios) e exibe numa interface visual que simula o gerenciador real da plataforma escolhida (Meta Ads Manager, Google Ads, TikTok Ads).

### Fluxo do Usuário

```text
1. Gera anúncio (já existe) → Resultado em Markdown
2. Clica "✅ Aprovar Campanha" → Salva no banco + chama IA para estruturar
3. IA retorna JSON estruturado com hierarquia de campanha
4. Abre aba "Simulador" com visual do gerenciador de anúncios
5. Usuário vê: Campanha > Conjunto de Anúncios > Anúncios (como no Meta Ads)
```

### Interface do Simulador

A UI replica visualmente o gerenciador de anúncios com:

- **Barra lateral** com lista de campanhas aprovadas
- **Tabela principal** estilo Meta Ads Manager com colunas:
  - Status (ativo/pausado toggle)
  - Nome da campanha/conjunto/anúncio
  - Orçamento diário/total
  - Objetivo
  - Público estimado
  - Posicionamentos
- **3 níveis colapsáveis**: Campanha → Conjunto → Anúncio
- **Preview do anúncio** ao clicar (mock de como apareceria no feed/stories)
- **Configurações editáveis**: o usuário pode ajustar orçamento, público, posicionamentos

### Arquivos a criar

| Arquivo | Descrição |
|---|---|
| `src/components/traffic/AdManagerSimulator.tsx` | Componente principal do simulador com tabela hierárquica |
| `src/components/traffic/AdPreviewMock.tsx` | Preview visual do anúncio (feed/stories/search) |
| `src/components/traffic/CampaignStructurePanel.tsx` | Painel lateral com campanhas salvas |
| `supabase/functions/ad-structure-generator/index.ts` | Edge function que transforma o resultado ANDROMEDA em JSON estruturado |

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/pages/TrafficAds.tsx` | Adicionar botão "Aprovar Campanha", aba Tabs (Criar / Simulador), estado de campanhas aprovadas |
| `supabase/config.toml` | Registrar `ad-structure-generator` |

### Migração SQL — Tabela `ad_campaigns`

```sql
CREATE TABLE public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  objective text NOT NULL,
  product text,
  audience text,
  budget text,
  tone text,
  raw_result text NOT NULL,          -- Markdown original do ANDROMEDA
  structured_data jsonb,              -- JSON com hierarquia campanha/conjunto/anúncio
  status text DEFAULT 'approved',     -- approved, active, paused, archived
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaigns"
  ON public.ad_campaigns FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Edge Function: `ad-structure-generator`

Recebe o markdown gerado pelo ANDROMEDA + metadados da campanha e retorna um JSON estruturado:

```json
{
  "campaign": {
    "name": "Campanha — Curso de Confeitaria",
    "objective": "Conversão",
    "budget_type": "daily",
    "budget_value": "R$ 30,00",
    "status": "active"
  },
  "ad_sets": [
    {
      "name": "Conjunto — Mulheres 25-45 SP",
      "audience": { "gender": "female", "age_min": 25, "age_max": 45, "locations": ["São Paulo"] },
      "placements": ["feed", "stories", "reels"],
      "budget": "R$ 15,00/dia",
      "schedule": "continuous",
      "ads": [
        {
          "name": "Anúncio A — Versão Emocional",
          "headline": "Transforme sua paixão em renda",
          "primary_text": "Você sempre sonhou em...",
          "description": "Curso completo de confeitaria",
          "cta": "Saiba Mais",
          "format": "video",
          "video_script": "...",
          "visual_brief": "..."
        }
      ]
    }
  ]
}
```

### Visual do Simulador

```text
┌─────────────────────────────────────────────────────┐
│ 📊 Gerenciador de Anúncios (Simulador)              │
├──────────┬──────────────────────────────────────────┤
│ Campanhas│  ☑ Status │ Nome           │ Orçamento   │
│          │─────────────────────────────────────────  │
│ ▸ Camp 1 │  🟢 Ativo │ 📁 Camp 1      │ R$ 30/dia   │
│ ▸ Camp 2 │  🟢 Ativo │  📂 Conjunto 1 │ R$ 15/dia   │
│          │           │   📄 Anúncio A │ —           │
│          │           │   📄 Anúncio B │ —           │
│          │  🟢 Ativo │  📂 Conjunto 2 │ R$ 15/dia   │
│          │           │   📄 Anúncio A │ —           │
├──────────┴──────────────────────────────────────────┤
│ Preview do Anúncio (Feed / Stories / Search)         │
│ ┌──────────────┐                                     │
│ │  📱 Mock     │  Headline: "Transforme sua paixão"  │
│ │  do Feed     │  CTA: [Saiba Mais]                  │
│ └──────────────┘                                     │
└─────────────────────────────────────────────────────┘
```

### Detalhes Técnicos

- A página `TrafficAds.tsx` ganha `Tabs` com duas abas: **"Criar Anúncio"** (formulário atual) e **"Gerenciador"** (simulador)
- Campanhas salvas são carregadas do banco via TanStack Query
- O botão "Aprovar" no resultado chama `ad-structure-generator`, salva tudo no banco, e redireciona para a aba Gerenciador
- O simulador é 100% local/visual (sem conexão real com Meta/Google) — serve como guia para o usuário replicar no gerenciador real
- Preview do anúncio adapta-se à plataforma: Feed mock para Meta, Search result mock para Google, For You mock para TikTok

