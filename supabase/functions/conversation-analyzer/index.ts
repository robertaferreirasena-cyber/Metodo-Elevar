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

const SYSTEM_PROMPT = `# MENTORA ANÁLISE CONVERSAS WHATSAPP

## REGRA FUNDAMENTAL
COMANDO DO USUÁRIO = PRIORIDADE ABSOLUTA. Contexto do negócio é para personalizar, não substituir.

Você é MENTORA que analisa conversas de vendas. Seu papel:
- Analisar conversa entre vendedor e cliente
- Dar feedback construtivo usando formatos de copy
- Identificar nível de consciência do lead
- Sugerir melhorias específicas

## NÍVEIS CONSCIÊNCIA
1.Inconsciente | 2.Problema | 3.Solução | 4.Produto | 5.Decisão

## FORMATOS COPY
Atenção: Hook Direto/Ruptura | Transformação: BAB/PAS/AIDA | Prova: Caso/Social/Bastidores | Conversão: WhatsApp Copy/Oferta/Escassez

## ERROS COMUNS
Falar demais, preço cedo, não perguntar, ignorar sinais compra, mensagens longas

## FORMATO RESPOSTA

📊 **ANÁLISE**
| Tipo | Msgs | Estágio | Resultado |
|------|------|---------|-----------|

🧠 **CONSCIÊNCIA**
Nível Lead: [1-5] | Vendedor adaptou? | Tratamento adequado?

⚖️ **PESOS EMOCIONAIS** (0-5)
Dor | Desejo | Prova | Urgência

🎯 **SCORE**: X/10 (Rapport|Diagnóstico|Valor|Objeções|Fechamento)

✅ **ACERTOS** (max 3)
⚠️ **MELHORIAS** (max 3 com formato copy sugerido)

💬 **SUGESTÃO**
❌ Original: [msg]
✅ Melhor: [msg melhorada, max 4 linhas]
Formato: [nome] | Por que funciona: [explicação]

🔮 **PRÓXIMO PASSO**
🎓 **LIÇÃO PRINCIPAL**`;

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
    if (!limits || (limits as any[]).length === 0) return { allowed: true };

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
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await supabase
      .from("persona_profiles")
      .select("niche, main_pain, common_objections, generated_raio_x")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile?.generated_raio_x) {
      personaCache.set(userId, { data: "", timestamp: Date.now() });
      return "";
    }

    const raioX = profile.generated_raio_x as Record<string, unknown>;
    const estrategia = raioX.estrategia_recomendada as Record<string, unknown> | undefined;

    const context = `
## CONTEXTO NEGÓCIO (use para personalizar)
Nicho: ${profile.niche || "?"}
Dor: ${profile.main_pain || "?"}
Objeções: ${profile.common_objections || "Preço,tempo"}
Tom: ${estrategia?.tom_comunicacao || "Natural"}
Gatilhos: ${(estrategia?.gatilhos_mentais_prioritarios as string[])?.slice(0,3).join(",") || "Prova social"}`;

    personaCache.set(userId, { data: context, timestamp: Date.now() });
    return context;
  } catch (error) {
    console.error("Error fetching persona:", error);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    let systemPrompt = SYSTEM_PROMPT;
    if (userId) {
      const personaContext = await getPersonaContext(userId);
      if (personaContext) systemPrompt += personaContext;
    }

    console.log(`[conversation-analyzer] ${messages.length} msgs`);

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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("conversation-analyzer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
