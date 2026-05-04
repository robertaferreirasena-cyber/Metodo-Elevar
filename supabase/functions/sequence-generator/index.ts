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

async function authenticateRequest(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return { userId: user.id };
}

const SYSTEM_PROMPT = `# MENTORA SEQUÊNCIAS INSTAGRAM

## REGRA FUNDAMENTAL
COMANDO DO USUÁRIO = PRIORIDADE ABSOLUTA. Persona é tempero, não substituto.
Bazar/evento/promoção/lançamento mencionados → FOQUE NISSO.

## AÇÕES/EVENTOS
PRESENCIAIS: Bazar(LOCAL,DATA,FOMO), Pop-up, Workshop
ONLINE: Live(HORÁRIO,exclusividade), Webinar, Lançamento
DATAS: Black Friday, Natal, Páscoa, Carnaval, Aniversário
PROMOS: Relâmpago, Queima Estoque, Pré-venda, Combo

## NÍVEIS CONSCIÊNCIA
1.Inconsciente→Despertar | 2.Problema→Ampliar | 3.Solução→Posicionar | 4.Produto→Objeções | 5.Pronto→CTA

## FORMATOS COPY
Atenção: Hook Direto/Ruptura | Consciência: Parábola/Storytelling/Diagnóstico | Transformação: BAB/PAS/AIDA | Autoridade: Caso/Prova Social/Bastidores | Conversão: Instagram Copy/Oferta/Escassez

## REGRAS GRUPO
Max 4 linhas | Linguagem coletiva | 1-2 emojis | Storytelling em capítulos

## DINÂMICAS DE COMUNIDADE
Quando objetivo incluir engajamento/comunidade/enquete/sorteio:
- ENQUETES: Preferências ("A ou B?"), Isso ou Aquilo, Opinião
- SORTEIOS: Comente para participar, Marque alguém, Cliente destaque
- PARTICIPAÇÃO: Desafio semanal, Pergunta do dia, Boas-vindas especiais
- RETENÇÃO: Exclusividade, Antecipação, Bastidores, Reconhecimento
Posts comunidade: Interação SIMPLES, sensação EXCLUSIVA, PERTENCIMENTO

## MODOS
grupo: Posts curtos coletivos | x1: Íntimo personalizado | diagnostico: Perguntas estratégicas | fechamento: Foco objeções

## JSON OUTPUT
\`\`\`json
{"title":"","description":"","mode":"grupo|x1","totalPosts":5,"duration":"","strategy":"","awarenessProgression":"","copyFramework":"","mentorNote":"","posts":[{"order":1,"timing":"","type":"","awarenessLevel":{"current":2,"target":3,"name":""},"copyFormat":"","whyThisFormat":"","objective":"","trigger":"","content":"","adaptationTip":"","cta":"","expectedReaction":"","tips":""}],"finalCta":""}
\`\`\`
RETORNE APENAS JSON VÁLIDO.`;

const LIMITS = { daily: 15, monthly: 100, sequence: 5 };

const personaCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// deno-lint-ignore no-explicit-any
async function checkUsageLimits(supabase: any, userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, expires_at, plan")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub || sub.status !== "active") {
      return { allowed: false, reason: "Assinatura inativa" };
    }

    if (sub.expires_at && new Date(sub.expires_at as string) < new Date()) {
      return { allowed: false, reason: "Assinatura expirada" };
    }

    // Pro users bypass all usage limits
    if (sub.plan === "pro") {
      await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "sequence" });
      return { allowed: true };
    }

    const { data: limits } = await supabase.rpc("check_and_reset_usage_admin", { p_user_id: userId });
    
    // deno-lint-ignore no-explicit-any
    if (!limits || (limits as any[]).length === 0) return { allowed: true };

    // deno-lint-ignore no-explicit-any
    const usage = (limits as any[])[0];
    
    if (usage.out_daily_requests >= LIMITS.daily) {
      return { allowed: false, reason: `Limite diário atingido (${LIMITS.daily}/dia)` };
    }

    if (usage.out_monthly_requests >= LIMITS.monthly) {
      return { allowed: false, reason: `Limite mensal atingido (${LIMITS.monthly}/mês)` };
    }

    if (usage.out_sequence_requests_month >= LIMITS.sequence) {
      return { allowed: false, reason: `Limite de sequências atingido (${LIMITS.sequence}/mês)` };
    }

    await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "sequence" });
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
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data } = await supabase
      .from("persona_profiles")
      .select("niche, product_description, main_pain, transformation, target_gender, target_age_range, generated_raio_x")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data?.generated_raio_x) {
      personaCache.set(userId, { data: "", timestamp: Date.now() });
      return "";
    }

    const raioX = data.generated_raio_x as Record<string, unknown>;
    const estrategia = raioX.estrategia_recomendada as Record<string, unknown> | undefined;
    const persona = raioX.persona as Record<string, unknown> | undefined;

    const context = `

## CONTEXTO DO NEGÓCIO DO USUÁRIO - USE PARA PERSONALIZAR, NÃO SUBSTITUIR

LEMBRE-SE: Use estes dados para PERSONALIZAR os posts, não para mudar o OBJETIVO pedido pelo usuário.
Se o usuário pediu "campanha para bazar", crie posts sobre o BAZAR, usando estes dados como tempero.

- **Nicho**: ${data.niche || "?"}
- **Produto**: ${data.product_description || "?"}
- **Dor Principal do Cliente**: ${data.main_pain || "?"}
- **Transformação Prometida**: ${data.transformation || "?"}
- **Público**: ${data.target_gender || "?"}, ${data.target_age_range || "?"}
- **Tom Recomendado**: ${estrategia?.tom_comunicacao || "Natural"}
- **Gatilhos Prioritários**: ${(estrategia?.gatilhos_mentais_prioritarios as string[])?.join(", ") || "Prova social, Escassez"}
- **Formatos de Copy Recomendados**: ${(raioX.formatos_copy_recomendados as string[])?.join(", ") || "Identificação, Prova Social"}
- **Nível de Consciência Predominante do Público**: ${raioX.nivel_consciencia_predominante || "Consciente do problema"}
- **Linguagem do Público**: ${(persona?.linguagem as string[])?.slice(0, 3).join(", ") || "Informal"}

Use este contexto para:
1. Começar a sequência no nível de consciência do público
2. Usar os formatos de copy recomendados
3. Aplicar os gatilhos prioritários
4. Adaptar a linguagem ao público
5. Dar dicas de adaptação específicas para o nicho no "adaptationTip" de cada post`;

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
    // Authenticate user from JWT
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const { product, goal, numPosts = 5, mode = "grupo" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { allowed, reason } = await checkUsageLimits(supabase, userId);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: reason }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const personaContext = await getPersonaContext(userId);

    const modeDescriptions: Record<string, string> = {
      grupo: "Roteiro de grupo com posts curtos (máx 4 linhas) e linguagem coletiva",
      x1: "Sequência completa X1 com tom íntimo e personalizado",
      diagnostico: "Conversa de diagnóstico com perguntas estratégicas",
      fechamento: "Conversa de fechamento focada em objeções"
    };
    const modeDescription = modeDescriptions[mode] || "Roteiro de grupo";

    const userPrompt = `## COMANDO DO USUÁRIO (PRIORIDADE MÁXIMA)
**Produto/Serviço**: ${product}
**Objetivo da Sequência**: ${goal}
**Modo de Execução**: ${mode} - ${modeDescription}

⚠️ RESPONDA EXATAMENTE AO OBJETIVO ACIMA.
Se menciona "bazar", "evento", "promoção", "lançamento" → FOQUE NISSO.
Use a persona abaixo para PERSONALIZAR, não para mudar o foco.

${personaContext}

Crie uma sequência de alta conversão com ${numPosts} posts.

IMPORTANTE:
1. FOQUE no objetivo específico mencionado acima (evento, promoção, etc)
2. Siga a progressão de níveis de consciência (do atual até decisão)
3. Cada post deve indicar qual formato de copy está usando E POR QUE
4. Para grupo: máximo 4 linhas por post
5. Use os gatilhos adequados para cada nível de consciência
6. Inclua "whyThisFormat" explicando por que o formato funciona neste momento
7. Inclua "adaptationTip" com dicas de como o vendedor pode personalizar
8. Inclua "mentorNote" com uma dica geral sobre a sequência
9. Retorne APENAS o JSON válido`;

    const kbPrompt = await getKBPrompt("sequence-generator");
    const finalSystemPrompt = kbPrompt || SYSTEM_PROMPT;

    console.log(`[sequence-generator] user:${userId.slice(0,8)} ${numPosts} posts, mode: ${mode}${personaContext ? " (with persona)" : ""}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: 1500,
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
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
      throw new Error("AI request failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content in response");

    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    let sequenceData;
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      sequenceData = JSON.parse(jsonStr);
    } else {
      throw new Error("Could not parse sequence data");
    }

    const tokensUsed = data.usage?.total_tokens || 2000;
    await supabase.rpc("track_token_usage_admin", {
      p_user_id: userId,
      p_feature: "sequencias",
      p_tokens: tokensUsed
    });
    console.log(`[sequence-generator] Success, tokens: ${tokensUsed}`);

    return new Response(
      JSON.stringify(sequenceData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sequence-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});