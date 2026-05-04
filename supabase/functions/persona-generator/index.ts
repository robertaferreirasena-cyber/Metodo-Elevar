import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

const PERSONA_PROMPT = `# Especialista em Neuromarketing e Vendas Instagram

Crie RAIO-X DE PERSONA completo baseado nos dados fornecidos.

## CONCEITOS FUNDAMENTAIS

### Níveis de Consciência
Identifique em qual nível a MAIORIA do público-alvo está:
1. Inconsciente - Não sabe que tem o problema
2. Consciente do Problema - Sabe que sofre mas não busca solução
3. Consciente da Solução - Sabe que precisa resolver
4. Consciente do Produto - Conhece opções no mercado
5. Pronto para Decidir - Só precisa do empurrão final

### 10 Formatos de Copy Conversacional
Recomende os 3 mais eficazes para este público:
1. Storytelling Pessoal - História curta e real
2. Identificação Imediata - "Você também sente que...?"
3. Diagnóstico Estratégico - Pergunta que revela dor
4. Autoridade Sutil - Experiência sem arrogância
5. Prova Social Narrativa - "Semana passada, a Maria..."
6. Quebra de Objeção Indireta - Contorno antes de surgir
7. Micro-compromisso - Pequenos "sins"
8. Antecipação - Criar expectativa
9. Convite Conversacional - CTA que parece convite
10. Fechamento Progressivo - Conduzir ao sim

## SAÍDA JSON

{
  "nivel_consciencia_predominante": "Nome do nível (1-5)",
  "nivel_consciencia_explicacao": "Por que este nível? Baseado em qual comportamento?",
  "formatos_copy_recomendados": ["Formato 1", "Formato 2", "Formato 3"],
  "formatos_copy_justificativa": "Por que esses formatos são ideais para este público",
  "problemas_externos": ["Problema 1", "Problema 2", "Problema 3"],
  "problemas_internos": ["Sentimento 1", "Insegurança 2"],
  "problemas_filosoficos": ["Crença 1", "Paradigma 2"],
  "desejos": ["Desejo 1", "Sonho 2", "Objetivo 3"],
  "fontes_de_dor": ["Dor 1", "Situação 2"],
  "medos": ["Medo 1", "Fracasso 2"],
  "oportunidades": ["Porta 1", "Possibilidade 2"],
  "sonhos": ["Visão 1", "Sentimento 2"],
  "problemas_financeiros": ["Impacto 1", "Custo 2"],
  "padroes_de_compra": {
    "gatilhos_decisao": "O que faz decidir",
    "objecoes_previsiveis": "Barreiras comuns",
    "ciclo_decisao": "Quanto tempo leva",
    "influenciadores": "Quem influencia a decisão"
  },
  "neurocomportamentos": {
    "processamento_informacao": "Como absorve informação",
    "gatilhos_confianca": "O que gera confiança",
    "gatilhos_resistencia": "O que afasta",
    "canal_comunicacao_ideal": "Instagram X1 ou Grupo?"
  },
  "estrategia_recomendada": {
    "tom_comunicacao": "Tom ideal (ex: Amiga especialista)",
    "gatilhos_mentais_prioritarios": ["Gatilho 1", "Gatilho 2", "Gatilho 3"],
    "abordagem_venda": "Estratégia de venda recomendada",
    "argumentos_chave": ["Argumento 1", "Argumento 2"],
    "sequencia_aquecimento": "Quantos posts/msgs antes de ofertar"
  },
  "templates_indicados": ["Template 1", "Template 2"],
  "resumo_executivo": "3-4 linhas resumindo persona + nível de consciência + abordagem ideal"
}

REGRAS: 
- Específico para o nicho
- Linguagem simples e acionável
- Baseado nos dados fornecidos
- Retorne APENAS JSON válido`;

const LIMITS = { daily: 15, monthly: 100, persona: 1 };

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
      await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "persona" });
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

    if (usage.out_persona_requests_month >= LIMITS.persona) {
      return { allowed: false, reason: `Limite de Raio-X atingido (${LIMITS.persona}/mês)` };
    }

    await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "persona" });
    return { allowed: true };
  } catch (error) {
    console.error("Error checking usage limits:", error);
    return { allowed: true };
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

    const { profileData, catalogFiles } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    // Extract catalog content if files provided
    let catalogContext = "";
    if (catalogFiles && Array.isArray(catalogFiles) && catalogFiles.length > 0) {
      const extractedTexts: string[] = [];
      for (const path of catalogFiles.slice(0, 5)) {
        try {
          const { data, error } = await supabase.storage
            .from("product-catalogs")
            .download(path);
          if (error || !data) continue;

          const ext = path.split(".").pop()?.toLowerCase() || "";
          if (["txt", "csv"].includes(ext)) {
            const text = await data.text();
            extractedTexts.push(`[${path.split("/").pop()}]: ${text.slice(0, 1500)}`);
          } else if (ext === "pdf") {
            const text = await data.text();
            const readable = text.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, " ").replace(/\s+/g, " ").trim();
            extractedTexts.push(`[PDF ${path.split("/").pop()}]: ${readable.slice(0, 1500)}`);
          } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
            extractedTexts.push(`[Imagem: ${path.split("/").pop()} - conteúdo visual do catálogo]`);
          }
        } catch (err) {
          console.error("Error extracting:", path, err);
        }
      }
      if (extractedTexts.length > 0) {
        catalogContext = `\n\nMATERIAIS DO CATÁLOGO/PRODUTOS ENVIADOS:\n${extractedTexts.join("\n").slice(0, 3000)}`;
      }
    }

    const businessType = profileData.business_type || "";
    const isLojista = businessType.toLowerCase().includes("lojista");
    const isPrestador = businessType.toLowerCase().includes("serviço") || businessType.toLowerCase().includes("prestador");
    const contextLabel = isLojista 
      ? "CLIENTE IDEAL (comprador de produtos)" 
      : isPrestador 
        ? "CLIENTE IDEAL (contratante de serviços)" 
        : "CLIENTE IDEAL";

    const userMessage = `Crie RAIO-X DE PERSONA completo do ${contextLabel} deste negócio.

IMPORTANTE: Você está criando o perfil do CLIENTE IDEAL deste negócio, não do dono. ${isLojista ? "Este é um LOJISTA que vende produtos. Foque em comportamento de compra, ticket médio e frequência." : isPrestador ? "Este é um PRESTADOR DE SERVIÇOS. Foque em gatilhos de contratação, confiança e ciclo de decisão." : "Analise o tipo de negócio e adapte."}

TIPO DE NEGÓCIO: ${businessType || "Não informado"}
NEGÓCIO: ${profileData.business_name || "?"} | ${profileData.niche || "?"} / ${profileData.sub_niche || "?"}
Tempo: ${profileData.time_in_market || "?"} | Canais: ${profileData.sales_channels?.join(", ") || "?"}

PRODUTO/SERVIÇO: ${profileData.product_description || "?"}
Preço: ${profileData.price_range || "?"} | Diferencial: ${profileData.main_differentiator || "?"}
Transforma: ${profileData.transformation || "?"}

PÚBLICO: ${profileData.target_gender || "?"}, ${profileData.target_age_range || "?"}, ${profileData.target_profession || "?"}
Onde: ${profileData.target_location || "?"} | Dor: ${profileData.main_pain || "?"}
Já tentou: ${profileData.previous_attempts || "?"}

DESAFIOS: Vendas: ${profileData.sales_challenges || "?"}
Objeções: ${profileData.common_objections || "?"} | Melhorar: ${profileData.improvement_goals || "?"}${catalogContext}

IMPORTANTE:
1. Identifique o nível de consciência PREDOMINANTE do público
2. Recomende os 3 melhores formatos de copy para este nicho
3. ${catalogContext ? "USE os materiais do catálogo como base para entender melhor os produtos/serviços e gerar análise mais precisa" : "Gere análise baseada nas informações fornecidas"}
4. Gere JSON completo conforme especificado`;

    console.log("[persona-generator] user:", userId.slice(0,8), "business:", profileData.business_name);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: 4000,
        messages: [
          { role: "system", content: PERSONA_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
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
      throw new Error("Erro no processamento da IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content in AI response");

    let raioX;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      raioX = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Falha ao processar resposta da IA");
    }

    const tokensUsed = data.usage?.total_tokens || 1500;
    await supabase.rpc("track_token_usage_admin", {
      p_user_id: userId,
      p_feature: "raio-x",
      p_tokens: tokensUsed
    });

    console.log("[persona-generator] Success, tokens:", tokensUsed);

    return new Response(
      JSON.stringify({ raioX }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("persona-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});