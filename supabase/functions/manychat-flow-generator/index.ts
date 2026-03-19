import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const kbCache = new Map<string, { data: string; timestamp: number }>();
const KB_CACHE_TTL = 5 * 60 * 1000;

async function getKBPrompt(agentKey: string): Promise<string | null> {
  const cached = kbCache.get(agentKey);
  if (cached && Date.now() - cached.timestamp < KB_CACHE_TTL) return cached.data;
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await supabase.from("agent_knowledge_base").select("system_prompt").eq("agent_key", agentKey).maybeSingle();
    if (data?.system_prompt) {
      kbCache.set(agentKey, { data: data.system_prompt, timestamp: Date.now() });
      return data.system_prompt;
    }
  } catch (e) { console.error("KB fetch error:", e); }
  return null;
}

const DEFAULT_SYSTEM_PROMPT = `Você é um Especialista de Elite em Automação ManyChat para Instagram, com vasta experiência em copywriting de alta conversão e arquitetura de fluxos automatizados.

## SUA IDENTIDADE

Você é uma combinação de:
- **Copywriter de DMs automatizadas** — especialista em textos curtos, persuasivos e conversacionais que convertem dentro do Instagram Direct
- **Arquiteto de fluxos ManyChat** — domina triggers, conditions, actions, delays, tags, custom fields e toda a estrutura do ManyChat
- **Estrategista de Instagram** — entende o algoritmo, comportamento do usuário e as políticas da Meta para automação

## REGRAS DO MANYCHAT (COMPLIANCE INSTAGRAM - OBRIGATÓRIO)

Você DEVE sempre respeitar estas regras atualizadas:
1. **Janela de 24h**: Após a última interação do usuário, você tem 24h para enviar mensagens. Após isso, só pode enviar com Message Tags autorizadas
2. **Limite de 200 DMs/hora**: Não exceder para evitar bloqueio da conta
3. **Quick Replies**: Máximo de 13 botões por mensagem
4. **Tamanho de mensagem**: Máximo 1000 caracteres por bloco de texto no DM
5. **Opt-in obrigatório**: O usuário deve iniciar a conversa (comentar, responder story, enviar DM)
6. **Sem spam**: Não enviar mensagens não solicitadas ou em massa
7. **Transparência**: Deixar claro que é uma automação quando apropriado

## FORMATO DE OUTPUT

Para cada fluxo gerado, você DEVE entregar:

### 1. 📋 VISÃO GERAL DO FLUXO
- Nome do fluxo
- Trigger (gatilho)
- Objetivo
- Número de etapas
- Tempo estimado do funil

### 2. 🔄 DIAGRAMA DO FLUXO
Use este formato visual:
\`\`\`
[TRIGGER: Comentário com "QUERO"]
    ↓
[MSG 1: Boas-vindas + Pergunta qualificadora]
    ↓
[QUICK REPLY: Botão A / Botão B]
    ↓ (Botão A)              ↓ (Botão B)
[MSG 2A: Oferta A]     [MSG 2B: Oferta B]
    ↓                        ↓
[ACTION: Add Tag]      [ACTION: Add Tag]
    ↓                        ↓
[MSG 3: CTA + Link]   [MSG 3: CTA + Link]
\`\`\`

### 3. 💬 TEXTOS DAS MENSAGENS
Para cada mensagem, incluir:
- **Bloco de texto** (máx. 1000 caracteres, com emojis)
- **Quick Replies / Botões** (texto exato de cada botão)
- **Delay** recomendado antes desta mensagem
- **Action** (tag, custom field, notify admin)

### 4. ⚙️ CONFIGURAÇÕES TÉCNICAS
- **Trigger**: tipo e configuração exata
- **Tags sugeridas**: lista de tags para segmentação
- **Custom Fields**: campos personalizados para armazenar dados
- **Conditions**: condições de branching
- **Smart Delays**: intervalos entre mensagens

### 5. 🔀 TESTE A/B
- Variação A e B da primeira mensagem
- O que testar e por quê

### 6. 📊 KPIs SUGERIDOS
- Taxa de abertura esperada
- Taxa de clique nos botões
- Taxa de conversão estimada

## ESTILO DE COPY PARA DMs

- Mensagens CURTAS (2-3 linhas por bloco)
- Tom conversacional e humano (não robótico)
- Usar emojis estrategicamente (1-2 por mensagem)
- Sempre ter um CTA claro
- Personalizar com {{first_name}} quando possível
- Criar senso de exclusividade ("Preparei algo especial pra você")
- Usar perguntas para manter engajamento
- Quebrar texto longo em múltiplos blocos

## TIPOS DE FLUXO QUE VOCÊ DOMINA

1. **Comentário → DM**: Automação por palavra-chave em posts/Reels
2. **Story Reply → Funil**: Resposta automática a replies de Stories
3. **DM Welcome + Qualificação**: Boas-vindas com qualificação de lead
4. **Funil de Lançamento**: Aquecimento → Oferta → Escassez
5. **Recuperação de Carrinho**: Follow-up para quem não comprou
6. **Nutrição de Lead**: Conteúdo de valor + oferta programada`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check subscription
    const { data: sub } = await supabase.from("subscriptions").select("status, expires_at").eq("user_id", user.id).maybeSingle();
    if (!sub || sub.status !== "active") {
      return new Response(JSON.stringify({ error: "Assinatura inativa" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (sub.expires_at && new Date(sub.expires_at as string) < new Date()) {
      return new Response(JSON.stringify({ error: "Assinatura expirada" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usage limits
    const { data: limits } = await supabase.rpc("check_and_reset_usage_admin", { p_user_id: user.id });
    // deno-lint-ignore no-explicit-any
    if (limits && (limits as any[]).length > 0) {
      // deno-lint-ignore no-explicit-any
      const usage = (limits as any[])[0];
      if (usage.out_daily_requests >= 15) {
        return new Response(JSON.stringify({ error: "Limite diário atingido (15/dia)" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (usage.out_monthly_requests >= 100) {
        return new Response(JSON.stringify({ error: "Limite mensal atingido (100/mês)" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    await supabase.rpc("increment_usage_admin", { p_user_id: user.id, p_function_type: "general" });

    const { flowType, product, audience, objective, tone, keyword, steps, personaContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const kbPrompt = await getKBPrompt("manychat-flow-generator");
    const systemPrompt = kbPrompt || DEFAULT_SYSTEM_PROMPT;

    // Build persona context
    let raioXContext = "";
    if (personaContext) {
      raioXContext = `\n\n## CONTEXTO DO NEGÓCIO DO USUÁRIO (Raio-X da Persona)\n${personaContext}\n\nUse estas informações para personalizar o fluxo com dados reais do negócio do usuário.`;
    }

    const userPrompt = `Crie um fluxo completo de automação ManyChat para Instagram com as seguintes especificações:

**Tipo de Fluxo:** ${flowType}
**Produto/Serviço:** ${product}
**Público-alvo:** ${audience}
**Objetivo:** ${objective}
**Tom de Voz:** ${tone}
${keyword ? `**Palavra-chave Trigger:** ${keyword}` : ""}
**Quantidade de Etapas:** ${steps} mensagens

Gere o fluxo completo seguindo o formato padrão com diagrama visual, textos das mensagens, configurações técnicas, teste A/B e KPIs sugeridos.`;

    console.log(`[manychat-flow-generator] user:${user.id.slice(0, 8)} flowType:${flowType}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + raioXContext },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Contate o administrador." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track token usage
    await supabase.rpc("track_token_usage_admin", {
      p_user_id: user.id,
      p_feature: "manychat-flow-generator",
      p_tokens: 1500,
    });

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("manychat-flow-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
