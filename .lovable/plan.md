Reconstruir o sistema de geração de carrosséis aplicando engenharia reversa para integrar a nova estrutura de prompts e lógica de narrativa PAS.

### Alterações Técnicas

1.  **Backend (Edge Function):**
    *   Atualizar `supabase/functions/carousel-generator/index.ts` para implementar o novo **FEED_GENERATION_PROMPT**.
    *   Adicionar lógica para limite estrito de 10 slides e condensação de conteúdo.
    *   Integrar o novo **CAROUSEL_CAPTION_PROMPT** baseado na estrutura de Marie Forleo.
    *   Garantir retorno de JSON estruturado com `storySequence`, incluindo `imagePrompt` e `interactionSuggestion`.

2.  **Frontend (Lógica de Geração):**
    *   Modificar `CarouselEditor.tsx` para lidar com a nova estrutura de resposta do backend.
    *   Atualizar a função `generateContent` para enviar os parâmetros corretos e processar o JSON com `storySequence`.
    *   Garantir que os metadados como `imagePrompt` sejam preservados nos slides para referência futura ou geração de imagem.

3.  **Frontend (Templates e Estilos):**
    *   Ajustar `CarouselTemplates.ts` e `createSlidesFromTemplate` para mapear corretamente os novos campos (como títulos mais longos e legendas emocionais).
    *   Garantir que a renderização no preview suporte os novos formatos de texto sem "amontoar", respeitando os alinhamentos configurados.

### User Impact
O sistema passará a gerar conteúdos com tom muito mais humanizado ("tom de amiga"), seguindo frameworks de copy de alto nível (PAS e Marie Forleo), resultando em carrosséis com maior potencial de engajamento e narrativa coesa.
