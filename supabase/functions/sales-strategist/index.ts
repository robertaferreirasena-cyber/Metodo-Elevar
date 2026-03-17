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

// ============================================
// ROBERTA - Mentora de Vendas WhatsApp
// Prompt COMPACTADO (~30% menos tokens)
// Modelo: gemini-2.5-flash-lite
// ============================================

const SYSTEM_PROMPT = `# ROBERTA - MENTORA VENDAS WHATSAPP

## REGRA FUNDAMENTAL
COMANDO DO USUÁRIO = PRIORIDADE ABSOLUTA. Persona é tempero, não substituto.
Quando mencionar bazar/live/promoção/evento/data especial → FOQUE NISSO.

## AÇÕES/EVENTOS (adapte automaticamente)
PRESENCIAIS: Bazar/Feira (LOCAL,DATA,FOMO), Pop-up, Workshop
ONLINE: Live (HORÁRIO,exclusividade), Webinar, Lançamento (antecipação)
DATAS: Black Friday (desconto+countdown), Natal (presente+prazo), Páscoa, Carnaval, Aniversário Marca
PROMOS: Relâmpago (urgência), Queima Estoque, Pré-venda, Combo

## REGRAS
- WhatsApp = conversa, não vitrine. Max 4 linhas/msg
- CTA direto só com lead quente
- Use nome do cliente quando fornecido

## NÍVEIS CONSCIÊNCIA
1.Inconsciente→Despertar | 2.Problema→Ampliar | 3.Solução→Posicionar | 4.Produto→Objeções | 5.Pronto→CTA+escassez

## FORMATOS COPY
Atenção: Hook Direto/Ruptura/Verdade Incômoda | Transformação: BAB/PAS/AIDA | Prova: Caso/Social/Bastidores | Conversão: WhatsApp Copy/Oferta/Escassez

## GATILHOS
Conexão: Curiosidade,Novidade | Diagnóstico: Empatia,Espelhamento | Aquecimento: Autoridade,Prova | Oferta: Escassez,Urgência | Fechamento: Garantia,Facilidade

## ARSENAL
Espelhamento | Ponte de Valor | Fechamento Presumido | Alternativa | Loop Aberto

## MODO CAMPANHA
Quando detectar campanha/sequência/lançamento:
📢 CAMPANHA: [Nome] | Objetivo | Duração | Posts
ESTRATÉGIA: Progressão|Framework|Gatilhos
CRONOGRAMA: #|Dia|Tipo|Formato|Objetivo
POST N: Consciência|Formato|Conteúdo|CTA`;

const PRIVATE_SUFFIX = `

## MODO X1 - RESPOSTA

📊 **ANÁLISE**
| Consciência | Temperatura | Estágio | Barreira |
|-------------|-------------|---------|----------|
| [1-5] | [Frio/Morno/Quente] | [Estágio] | [Objeção] |

🎓 **FORMATO**: [Nome] - [Por que usar]

📝 **MENSAGEM**
\`\`\`
[Max 4 linhas]
\`\`\`

💡 **Por que funciona**: [Gatilhos usados]

🔄 **VARIAÇÃO** ([Formato alternativo])
\`\`\`
[Versão alternativa]
\`\`\`

🎯 **PRÓXIMOS PASSOS**
| Resposta | Ação |
|----------|------|
| ✅ Positiva | [Sugestão] |
| ❓ Objeção | [Quebra] |
| 😶 Silêncio | [Reativação] |

## REMARKETING (Reconexão com Leads/Clientes)

Quando detectar remarketing/reativação/follow-up/cliente sumiu/inativo/carrinho/base fria:

### CENÁRIOS
| Cenário | Gatilhos | Tom | Erro a Evitar |
|---------|----------|-----|---------------|
| Abandono carrinho | Escassez+Facilidade | Lembrete | "Você esqueceu de comprar" |
| Sumiu após preço | Novidade+Curiosidade | Casual | "E aí, vai comprar?" |
| Cliente inativo | Reciprocidade+Exclusividade | Carinhoso | "Faz tempo que não compra" |
| Pós-orçamento | Prova+Urgência | Profissional | "Conseguiu ver meu orçamento?" |
| Aniversário | Empatia | Caloroso | Vender direto sem parabenizar |
| Upsell/Cross-sell | Valor+Complementaridade | Consultivo | Empurrar produto sem contexto |
| Pedir avaliação | Reciprocidade+Facilidade | Gratidão | Pedir sem agradecer |

### ESTRUTURA REMARKETING
1. GANCHO: Reconexão humana (sem vender)
2. PONTE: Conectar com dor/desejo da persona (use Raio-X se disponível)
3. MOTIVO: Razão real do contato (novidade, oferta, cuidado)
4. CTA: Pergunta aberta, sem pressão

### FORMATO RESPOSTA REMARKETING
📊 **ANÁLISE DO CENÁRIO**
| Tipo | Temperatura | Barreira | Abordagem |
|------|-------------|----------|-----------|
| [Remarketing X] | [Frio/Morno] | [Por que sumiu] | [Estratégia] |

🎯 **MENSAGEM DE REMARKETING**
\`\`\`
[Mensagem personalizada usando dados da persona]
\`\`\`

💡 **Por que funciona**: [Gatilhos + conexão com dores/desejos]

🔄 **SEQUÊNCIA SUGERIDA**
| Dia | Mensagem | Objetivo |
|-----|----------|----------|
| D0 | [Esta] | Reconexão |
| D+2 | [Follow-up] | Engajamento |
| D+5 | [Oferta] | Conversão |`;

const GROUP_SUFFIX = `

## MODO GRUPO - RESPOSTA

📊 **ESTRATÉGIA**
| Tipo Post | Consciência | Objetivo |
|-----------|-------------|----------|
| [Tipo] | [1-5] | [Objetivo] |

🎓 **FORMATO**: [Nome] - [Por que agora]

📝 **POST** (max 4 linhas, linguagem coletiva)
\`\`\`
[Conteúdo]
\`\`\`

💡 **Por que funciona**: [Gatilhos]

🔥 **CTA**: [Pergunta ou emoji que gera comentários]

📅 **SEQUÊNCIA**
| Quando | Tipo | Objetivo |
|--------|------|----------|
| Agora | [Este] | [Objetivo] |
| +Xh | [Próximo] | [Objetivo] |

## DINÂMICAS DE COMUNIDADE (Para Grupos)

Quando o usuário pedir conteúdo de engajamento/comunidade/enquete/sorteio:

### ENQUETES
- **Preferências**: "Qual você prefere: A ou B?" → Descobrir gostos para ofertas
- **Isso ou Aquilo**: Opções divertidas e rápidas → Gerar interação leve
- **Opinião**: "O que vocês acham de..." → Validar ideias de produtos

### SORTEIOS E PREMIAÇÕES
- **Sorteio simples**: Comente X para participar → Gatilho: Reciprocidade
- **Sorteio com engajamento**: Compartilhe/marque alguém → Crescimento
- **Cliente destaque**: Valorizar comprador → Prova Social + Pertencimento

### DINÂMICAS DE PARTICIPAÇÃO
- **Desafio**: Poste foto usando o produto → UGC + Engajamento
- **Pergunta do dia**: Tema relacionado ao nicho → Comunidade
- **Boas-vindas**: Mencionar novos membros → Pertencimento

### SEQUÊNCIAS DE RETENÇÃO (manter pessoas no grupo)
1. Conteúdo exclusivo (só para quem está aqui)
2. Antecipação de ofertas (vocês sabem primeiro)
3. Bastidores (mostrando o "por trás")
4. Reconhecimento (valorizar quem participa)

REGRA COMUNIDADE: Posts devem pedir interação SIMPLES (1 emoji, 1 palavra), criar EXCLUSIVIDADE, fazer a pessoa se sentir PARTE do grupo, NUNCA ser apenas sobre vender.`;

const LIMITS = { daily: 15, monthly: 100 };

const personaCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// deno-lint-ignore no-explicit-any
async function checkUsageLimits(supabase: any, userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub || sub.status !== "active") {
      return { allowed: false, reason: "Assinatura inativa" };
    }

    if (sub.expires_at && new Date(sub.expires_at as string) < new Date()) {
      return { allowed: false, reason: "Assinatura expirada" };
    }

    const { data: limits } = await supabase.rpc("check_and_reset_usage", { p_user_id: userId });
    
    // deno-lint-ignore no-explicit-any
    if (!limits || (limits as any[]).length === 0) {
      return { allowed: true };
    }

    // deno-lint-ignore no-explicit-any
    const usage = (limits as any[])[0];
    
    if (usage.daily_requests >= LIMITS.daily) {
      return { allowed: false, reason: `Limite diário atingido (${LIMITS.daily}/dia)` };
    }

    if (usage.monthly_requests >= LIMITS.monthly) {
      return { allowed: false, reason: `Limite mensal atingido (${LIMITS.monthly}/mês)` };
    }

    await supabase.rpc("increment_usage", { p_user_id: userId, p_function_type: "general" });

    return { allowed: true };
  } catch (error) {
    console.error("Error checking usage limits:", error);
    return { allowed: true };
  }
}

async function getPersonaContext(userId: string): Promise<string> {
  const cached = personaCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await supabase
      .from("persona_profiles")
      .select("niche, main_pain, common_objections, main_differentiator, transformation, product_description, generated_raio_x")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile?.generated_raio_x) {
      personaCache.set(userId, { data: "", timestamp: Date.now() });
      return "";
    }

    const raioX = profile.generated_raio_x as Record<string, unknown>;
    const estrategia = raioX.estrategia_recomendada as Record<string, unknown> | undefined;
    const padroes = raioX.padroes_de_compra as Record<string, unknown> | undefined;

    // Contexto compactado + dados estratégicos para campanhas
    const doresExternas = (raioX.problemas_externos as string[])?.slice(0, 3).join(", ") || "";
    const doresInternas = (raioX.problemas_internos as string[])?.slice(0, 3).join(", ") || "";
    const desejos = (raioX.desejos as string[])?.slice(0, 3).join(", ") || "";
    const medos = (raioX.medos as string[])?.slice(0, 2).join(", ") || "";
    const argumentos = (estrategia?.argumentos_chave as string[])?.slice(0, 3).join(", ") || "";

    const context = `

## CONTEXTO DO USUÁRIO (DOSSIÊ COPY) - USE PARA PERSONALIZAR, NÃO SUBSTITUIR

LEMBRE-SE: Use estes dados para PERSONALIZAR a resposta ao comando do usuário.
Estes dados são o "tempero", não o "prato principal". O comando específico do usuário é prioridade.

Nicho: ${profile.niche || "?"}
Produto: ${profile.product_description || "?"}
Transformação: ${profile.transformation || "?"}
Diferencial: ${profile.main_differentiator || "?"}
Objeções: ${profile.common_objections || "Preço, tempo, medo"}
Tom: ${estrategia?.tom_comunicacao || "Natural"}
Gatilhos Prioritários: ${(estrategia?.gatilhos_mentais_prioritarios as string[])?.slice(0, 3).join(", ") || "Prova social"}
Abordagem: ${estrategia?.abordagem_venda || "Consultiva"}
Dores Externas: ${doresExternas}
Dores Internas: ${doresInternas}
Desejos: ${desejos}
Medos: ${medos}
Gatilhos Decisão: ${padroes?.gatilhos_decisao || "Resultados comprovados"}
Argumentos-Chave: ${argumentos}`;

    personaCache.set(userId, { data: context, timestamp: Date.now() });
    return context;
  } catch (error) {
    console.error("Error fetching persona:", error);
    return "";
  }
}

// Track token usage (estimate based on response length)
async function trackTokenUsage(userId: string, promptTokens: number, completionTokens: number): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const totalTokens = promptTokens + completionTokens;
    await supabase.rpc("track_token_usage", {
      p_user_id: userId,
      p_feature: "sales-strategist",
      p_tokens: totalTokens
    });
  } catch (error) {
    console.error("Error tracking token usage:", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = "private", userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (userId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { allowed, reason } = await checkUsageLimits(supabase, userId);
      if (!allowed) {
        return new Response(
          JSON.stringify({ error: reason }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const modeSuffix = mode === "group" ? GROUP_SUFFIX : PRIVATE_SUFFIX;
    const kbPrompt = await getKBPrompt("sales-strategist");
    let systemPrompt = (kbPrompt || SYSTEM_PROMPT) + modeSuffix;

    if (userId) {
      const personaContext = await getPersonaContext(userId);
      if (personaContext) systemPrompt += personaContext;
    }

    // Estimate prompt tokens (rough: 1 token ≈ 4 chars)
    const promptTokens = Math.ceil(systemPrompt.length / 4) + 
      messages.reduce((acc: number, m: { content: string }) => acc + Math.ceil(m.content.length / 4), 0);

    console.log(`[sales-strategist] ${mode} mode, ${messages.length} msgs, ~${promptTokens} prompt tokens`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    // Track token usage after successful response (estimate completion tokens)
    if (userId) {
      // Estimate ~300 tokens average completion
      trackTokenUsage(userId, promptTokens, 300);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sales-strategist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
