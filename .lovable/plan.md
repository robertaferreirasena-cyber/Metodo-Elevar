

## Plano: INSTA PRO — Gerador de Perfil Instagram com IA e Preview Realista

### Resumo

Substituir o `ProfileGenerator` atual (mock com `setTimeout`) pela central **INSTA PRO** com formulário ampliado de 4 etapas, geração via IA (nova edge function), e preview visual estilo Instagram real com conteúdos sugeridos navegáveis.

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/LearningModules.tsx` | Renomear tab "Perfil" → "Insta PRO", trocar componente por `InstaProGenerator` |
| `src/components/instagram/ProfileGeneratorForm.tsx` | **Criar** — formulário 4 etapas com auto-preenchimento via Persona |
| `src/components/instagram/InstagramProfilePreview.tsx` | **Criar** — preview visual fiel ao Instagram com grid navegável |
| `src/components/instagram/InstaProGenerator.tsx` | **Criar** — orquestra formulário → IA → preview |
| `supabase/functions/instagram-profile-generator/index.ts` | **Criar** — edge function com tool calling para JSON estruturado |
| `supabase/config.toml` | Adicionar entrada `instagram-profile-generator` |

### 1. Tab "Insta PRO" (`LearningModules.tsx`)

- Ícone: `Instagram` do lucide (ou `Sparkles`)
- Substitui `<ProfileGenerator />` por `<InstaProGenerator />`
- Remove a função `ProfileGenerator` local

### 2. Formulário Ampliado (`ProfileGeneratorForm.tsx`)

Stepper visual com 4 etapas:

| Etapa | Campos |
|---|---|
| **Identidade & Nicho** | Nicho (select + livre com sugestões rápidas), sub-nicho, aparece na câmera? (Sim/Não/Às vezes) |
| **Público & Objetivo** | Público ideal (textarea), faixa etária, objetivo principal (select: Vender curso, Atrair clientes, Construir autoridade, Gerar leads) |
| **Marca & Tom** | Nome da marca, o que vende, diferencial, transformação, tom de voz (select) |
| **Presença Atual** | Já tem Instagram? Seguidores aprox? Frequência de postagem, dificuldades |

Auto-preenchimento via `usePersonaContext()` — campos nicho, público, produto, diferencial, transformação são pré-populados se persona existir.

### 3. Edge Function (`instagram-profile-generator`)

- Usa `google/gemini-3-flash-preview` via Lovable AI Gateway
- Tool calling para retornar JSON estruturado:

```text
{
  username_sugestoes, nome_perfil, categoria,
  bio_lines (4 linhas com emojis),
  link_sugerido,
  destaques (nome + emoji),
  posts_sugeridos (tipo + titulo + descricao + legenda),
  estrategia (pilares, frequencia, horarios)
}
```

- Tratamento de 429/402, tracking de tokens

### 4. Preview Instagram Real (`InstagramProfilePreview.tsx`)

Componente mobile-first (max-width 375px) que renderiza:

- **Header**: @username, foto placeholder, contadores (posts/seguidores/seguindo)
- **Bio**: Linhas com emojis, categoria badge, link
- **Botões**: "Seguir" / "Mensagem" decorativos
- **Destaques**: Círculos com emoji + nome (scroll horizontal)
- **Grid**: 3 colunas com posts sugeridos (cards coloridos por tipo)
- **Modal**: Ao clicar num post → detalhes (tipo, título, descrição, legenda) + botão "Copiar legenda"
- **Tabs**: Grade | Estratégia (pilares, frequência, horários)
- **Ações**: Copiar bio, regenerar, exportar como imagem (html-to-image)

### 5. Orquestrador (`InstaProGenerator.tsx`)

Gerencia 3 estados: `form` → `generating` → `result`. Permite voltar ao formulário para regenerar com dados alterados.

