

## Plano: Insta PRO — Raio-X Completo, Multi-Objetivo, 9 Posts, Documento Detalhado + PDF

### Resumo

4 mudanças principais:
1. **Etapa "Público & Objetivo"** puxa o Raio-X completo da persona (dores, desejos, medos, padrões de compra, neurocomportamentos) e permite selecionar múltiplos objetivos
2. **Prompt da IA** reformulado para gerar perfil como "lugar ideal" onde a persona quer ficar, interagir e comprar — narrativa alinhada a atrair, reter e vender
3. **Preview gera 9 posts** estratégicos (grid 3x3 completo)
4. **Documento detalhado dos destaques** + botão para exportar PDF horizontal completo (preview + destaques + estratégia)

### Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `src/components/instagram/ProfileGeneratorForm.tsx` | Etapa 2: exibir resumo do Raio-X, multi-select de objetivos (checkbox), passar `raioXData` + `goals[]` no form |
| `src/components/instagram/InstaProGenerator.tsx` | Passar Raio-X completo para o form e para a edge function; receber `destaques_detalhados` da IA |
| `src/components/instagram/InstagramProfilePreview.tsx` | Grid 3x3 (9 posts), nova tab "Destaques" com documento detalhado, botão exportar PDF horizontal |
| `src/pages/LearningModules.tsx` | Passar `raioX` completo no `personaData` para InstaProGenerator |
| `supabase/functions/instagram-profile-generator/index.ts` | Receber raioX + goals[], prompt reformulado, gerar 9 posts, gerar `destaques_detalhados` com estrutura+motivo |

### Detalhes

#### 1. ProfileGeneratorForm — Etapa "Público & Objetivo"

- Substituir o single-select de objetivo por **checkboxes** (multi-select) usando os mesmos `GOALS`
- `InstaFormData.mainGoal` vira `mainGoals: string[]`
- Se a persona tem Raio-X, exibir um card resumo colapsável com:
  - Dores principais, desejos, medos, tom de comunicação recomendado
  - Badge "Raio-X carregado ✓"
- O textarea de público ideal é pré-preenchido com dados formatados do Raio-X (dores + desejos + público)

#### 2. InstaProGenerator + LearningModules

- `personaData` expandido para incluir `raioX: RaioXData | null` completo
- Ao chamar a edge function, enviar `raioXData` junto com `formData`

#### 3. Edge Function — Prompt Reformulado

System prompt atualizado para:
- Criar um perfil Instagram que seja o "lugar ideal" onde a persona quer estar
- Narrativa dos conteúdos alinhada ao funil: atrair → reter → vender
- Gerar **9 posts estratégicos** (3 atração, 3 retenção, 3 conversão)
- Gerar `destaques_detalhados`: array com `nome`, `emoji`, `conteudo_sugerido` (o que colocar), `estrutura` (quantos stories, formato), `motivo` (por que esse destaque)

Novo campo na tool:
```json
"destaques_detalhados": [{
  "nome": "string",
  "emoji": "string", 
  "conteudo_sugerido": "string",
  "estrutura": "string",
  "motivo": "string"
}]
```

Posts agora têm campo `fase` (atração/retenção/conversão):
```json
"posts_sugeridos": [{
  "tipo": "carrossel|reels|stories",
  "fase": "atração|retenção|conversão",
  "titulo": "...",
  "descricao": "...",
  "legenda": "..."
}]
```

#### 4. InstagramProfilePreview — 9 Posts + Documento + PDF

- Grid agora renderiza 9 posts (3x3)
- Nova tab "📋 Destaques" entre Grid e Estratégia com documento detalhado:
  - Cada destaque com: nome, emoji, conteúdo sugerido, estrutura, motivo estratégico
- Botão **"Exportar PDF Completo"** que usa `jsPDF` (já disponível no projeto) para gerar PDF horizontal:
  - Página 1: Preview do perfil (captura via html-to-image)
  - Página 2: Documento dos destaques detalhados
  - Página 3: Estratégia completa (pilares, frequência, horários, dicas)
  - Página 4+: Posts sugeridos com legendas

#### 5. InstaProfile Interface atualizada

```typescript
export interface InstaProfile {
  // ... campos existentes ...
  destaques_detalhados: {
    nome: string;
    emoji: string;
    conteudo_sugerido: string;
    estrutura: string;
    motivo: string;
  }[];
  posts_sugeridos: {
    tipo: string;
    fase: string; // novo
    titulo: string;
    descricao: string;
    legenda: string;
  }[];
}
```

