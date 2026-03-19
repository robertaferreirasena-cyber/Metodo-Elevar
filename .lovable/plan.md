

## Plano: Corrigir Carrossel + Persona + Stories + Download

### Problema Identificado

O erro "Resposta inválida da IA" ocorre porque:
1. O carrossel usa a edge function `sales-strategist` que tem `max_tokens: 800` — insuficiente para gerar JSON de 5-10 slides
2. O modelo `gemini-2.5-flash-lite` é fraco demais para seguir instruções de "retornar apenas JSON"
3. A IA retorna JSON incompleto/cortado, o regex `match(/\[[\s\S]*\]/)` falha

### Solução

#### 1. Nova Edge Function `carousel-generator`
- Modelo: `google/gemini-3-flash-preview` (melhor para seguir instruções)
- Usa **tool calling** para garantir resposta JSON estruturada (sem depender de regex)
- `max_tokens: 2000` para suportar até 10 slides
- Recebe dados da Persona para gerar conteúdo de alta conversão
- Prompt especializado em copywriting viral baseado na persona/público-alvo

#### 2. Integração com Persona no CarouselEditor
- Importar `usePersonaContext` no `CarouselEditor`
- Enviar dados da persona (nicho, dores, desejos, produto, tom de comunicação) para a edge function
- O prompt da IA usa esses dados para criar títulos e copies impossíveis de ignorar pelo público-alvo

#### 3. Formato Stories (9:16)
- Adicionar `"9:16"` ao tipo `aspectRatio` em `CarouselTemplates.ts`
- Adicionar seletor de formato (Feed 1:1 / Stories 9:16) no editor
- Ajustar `SlidePreview` para renderizar proporção 9:16
- Criar templates específicos para Stories

#### 4. Download Melhorado
- Botão "Baixar Todos como ZIP" (usando JSZip) — já existe exportAll, mas baixa individualmente
- Manter botão de download individual por slide

### Arquivos

| Arquivo | Mudança |
|---|---|
| `supabase/functions/carousel-generator/index.ts` | Nova edge function com tool calling + persona |
| `src/components/carousel/CarouselEditor.tsx` | Usar nova edge function, integrar persona, seletor de formato |
| `src/components/carousel/CarouselTemplates.ts` | Adicionar tipo `9:16`, templates Stories |
| `src/components/carousel/SlidePreview.tsx` | Suportar aspect ratio 9:16 |
| `supabase/config.toml` | Registrar nova function |

### Detalhes da Edge Function

```text
Tool calling schema:
{
  name: "generate_carousel",
  parameters: {
    slides: [{
      title: string,
      body: string
    }]
  }
}
```

O prompt incluirá contexto da persona:
- Nicho, produto, dor principal, diferencial
- Tom de comunicação do Raio-X
- Gatilhos mentais prioritários
- Instruções de copywriting viral (ganchos, CTAs, escassez)

