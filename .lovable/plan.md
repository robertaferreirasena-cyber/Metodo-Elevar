

# Plano: Persistência do Carrossel + Responsividade Mobile

## Parte 1 — Corrigir perda de estado do Carrossel

**Problema atual:** O `CarouselEditor` já usa `useSessionPersistence` para salvar tema, slides, template e formatação. Porém existem 3 bugs que causam perda do trabalho:

1. **Remontagem por `key`**: em `src/pages/LearningModules.tsx` o componente é renderizado como `<CarouselEditor key={carouselTopic} ... />`. Toda vez que o tema muda (ou usuário volta de outra aba), o React desmonta e remonta o componente, podendo sobrescrever a sessão salva.
2. **`initialTopic` sobrescreve sessão restaurada**: `useState(initialTopic || sessionState.topic)` ignora os slides já gerados quando vem um tema novo da URL.
3. **Estado da Mentora Gi (chat lateral) e modo de aplicação de template não persistem** — usuário perde a conversa ao trocar de aba.

**Correções:**

- Remover o `key={carouselTopic}` em `LearningModules.tsx`. Em vez disso, usar um `useEffect` interno no `CarouselEditor` que reaja a mudanças de `initialTopic` apenas quando ele mudar de fato (e perguntar antes de descartar o trabalho atual se já houver slides gerados).
- Quando vier um `initialTopic` novo E já existirem slides na sessão, exibir um aviso curto: "Você já tem um carrossel em andamento. Substituir pelo novo tema?" com botões Manter / Substituir.
- Adicionar à `CarouselSessionState` os campos: `giMessages`, `giOpen`, `templateApplyMode` para preservar o chat e preferências.
- Garantir que o `SessionIndicator` apareça no topo do editor com botão "Limpar carrossel" para o usuário descartar manualmente quando quiser começar do zero.
- Aumentar a janela de retenção da sessão (já são 24h em `useSessionPersistence`) — manter, mas confirmar que o salvamento debounced (500ms) cobre edições rápidas.

## Parte 2 — Responsividade Mobile (foco no Carrossel e demais telas)

**Áreas críticas identificadas no Carrossel** (1012 linhas, layout grid lateral + canvas):

- **Toolbar lateral**: hoje é uma coluna fixa que no celular fica espremida. Converter em **Drawer/Sheet inferior** no mobile (<768px) usando `useIsMobile` + componente `Sheet` ou `Drawer` já presente no projeto.
- **Canvas do slide**: aplicar `max-w-full` + `aspect-ratio` responsivo, garantindo que o slide nunca ultrapasse a viewport.
- **Botões de ação** (Gerar, Exportar, Duplicar, Apagar, Tela cheia): agrupar em barra inferior fixa (sticky bottom) no mobile com ícones + labels curtos.
- **Galeria de templates**: trocar grid por carrossel horizontal scrollável (snap-x) no mobile.
- **Chat Mentora Gi**: virar Sheet lateral full-height no mobile em vez de painel fixo.
- **Inputs**: garantir `text-base` (16px) para evitar zoom automático do iOS.
- **Touch targets**: todos os botões com `min-h-[44px]` (já existe `touch-target` class).

**Varredura geral de responsividade nas demais páginas:**

- `Dashboard`, `MentorChat`, `PersonaRaioX`, `LearningModules`, `InstaProGenerator`, `TrafficAds`, `ManyChatFlows`, `Community`, `PriceCalculator`, `FinancialReport`, `SalesGoals`, `AdminUsers`.
- Padrões a aplicar em todas:
  - Containers usando `px-3 sm:px-4 md:px-6` em vez de paddings fixos.
  - Tabelas (Admin) → cards verticais no mobile.
  - Diálogos com `max-h-[90dvh] overflow-y-auto` e largura `w-[95vw] sm:max-w-lg`.
  - Tabs com scroll horizontal quando excedem largura.
  - Substituir grids `grid-cols-3` fixos por `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
  - Sidebar admin colapsável no mobile (já há `SidebarTrigger` no `AppLayout`).

## Arquivos que serão modificados

- `src/components/carousel/CarouselEditor.tsx` — persistência expandida + layout mobile (Sheet para toolbar/chat, sticky bottom bar, prompt de substituição de tema).
- `src/pages/LearningModules.tsx` — remover `key={carouselTopic}`, passar `initialTopic` como prop reativa.
- `src/components/carousel/SlidePreview.tsx` — ajustes de aspect-ratio/responsividade.
- Páginas listadas acima — ajustes de classes Tailwind para responsividade.
- Possivelmente `src/components/ui/sheet.tsx` (sem alterações, apenas uso).

## Detalhes técnicos

```ts
// Nova CarouselSessionState
interface CarouselSessionState {
  topic: string;
  slideCount: number;
  tone: string;
  formatFilter: FormatFilter;
  selectedTemplateId: string;
  slides: SlideData[];
  currentSlide: number;
  giMessages: { role: "user" | "assistant"; content: string }[];
  giOpen: boolean;
  templateApplyMode: "all" | "current" | "preserve";
}
```

```tsx
// LearningModules.tsx — antes
<CarouselEditor key={carouselTopic} initialTopic={carouselTopic} />
// depois
<CarouselEditor initialTopic={carouselTopic} />
```

```tsx
// CarouselEditor.tsx — gerenciar mudança de initialTopic
useEffect(() => {
  if (!initialTopic) return;
  if (slides.length > 0 && initialTopic !== topic) {
    setPendingTopic(initialTopic); // abre diálogo de confirmação
  } else {
    setTopic(initialTopic);
  }
}, [initialTopic]);
```

Sem migrações de banco. Apenas alterações de frontend.

