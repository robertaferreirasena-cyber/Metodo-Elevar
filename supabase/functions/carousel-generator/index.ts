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

async function getPersonaContext(userId: string): Promise<string> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await supabase
      .from("persona_profiles")
      .select("niche, main_pain, common_objections, main_differentiator, transformation, product_description, generated_raio_x, target_gender, target_age_range")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) return "";

    const raioX = profile.generated_raio_x as Record<string, unknown> | null;
    const estrategia = raioX?.estrategia_recomendada as Record<string, unknown> | undefined;

    const parts: string[] = [];
    if (profile.niche) parts.push(`Nicho: ${profile.niche}`);
    if (profile.product_description) parts.push(`Produto/Serviço: ${profile.product_description}`);
    if (profile.main_pain) parts.push(`Dor principal do público: ${profile.main_pain}`);
    if (profile.main_differentiator) parts.push(`Diferencial: ${profile.main_differentiator}`);
    if (profile.transformation) parts.push(`Transformação oferecida: ${profile.transformation}`);
    if (profile.common_objections) parts.push(`Objeções comuns: ${profile.common_objections}`);
    if (profile.target_gender) parts.push(`Público: ${profile.target_gender}${profile.target_age_range ? `, ${profile.target_age_range}` : ""}`);

    if (raioX) {
      const doresExternas = (raioX.problemas_externos as string[])?.slice(0, 3).join(", ");
      const desejos = (raioX.desejos as string[])?.slice(0, 3).join(", ");
      const medos = (raioX.medos as string[])?.slice(0, 2).join(", ");
      if (doresExternas) parts.push(`Dores externas: ${doresExternas}`);
      if (desejos) parts.push(`Desejos: ${desejos}`);
      if (medos) parts.push(`Medos: ${medos}`);
      if (estrategia?.tom_comunicacao) parts.push(`Tom de comunicação: ${estrategia.tom_comunicacao}`);
      const gatilhos = (estrategia?.gatilhos_mentais_prioritarios as string[])?.slice(0, 3).join(", ");
      if (gatilhos) parts.push(`Gatilhos mentais: ${gatilhos}`);
    }

    return parts.length > 0 ? `\n\nCONTEXTO DA PERSONA DO USUÁRIO:\n${parts.join("\n")}` : "";
  } catch (e) {
    console.error("Error fetching persona:", e);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const { topic, slideCount = 5, tone = "profissional", persona } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build persona context from DB or from client-provided data
    let personaContext = "";
    if (persona?.niche) {
      const parts: string[] = [];
      if (persona.niche) parts.push(`Nicho: ${persona.niche}`);
      if (persona.product) parts.push(`Produto: ${persona.product}`);
      if (persona.pain) parts.push(`Dor principal: ${persona.pain}`);
      if (persona.differentiator) parts.push(`Diferencial: ${persona.differentiator}`);
      if (persona.tone) parts.push(`Tom: ${persona.tone}`);
      if (persona.triggers) parts.push(`Gatilhos: ${persona.triggers}`);
      personaContext = `\n\nCONTEXTO DA PERSONA:\n${parts.join("\n")}`;
    } else {
      personaContext = await getPersonaContext(userId);
    }

    const systemPrompt = `Você é a MENTORA GI — Copywriter Expert e Diretora Criativa de carrosséis virais para redes sociais (Instagram, LinkedIn, Instagram Status).

Sua missão é criar carrosséis com NARRATIVA ENVOLVENTE, usando storytelling cinematográfico com começo, meio e fim. Cada carrossel deve ser uma JORNADA que prende a atenção do início ao final.

═══════════════════════════════════════
ESTRUTURA NARRATIVA OBRIGATÓRIA (3 ATOS)
═══════════════════════════════════════

ATO 1 — GANCHO + DOR (Slides 1 e 2):
- Slide 1 (GANCHO IRRESISTÍVEL): Título provocativo e emocional que OBRIGA a parar de scrollar. Use padrões virais: contradições, números específicos, "O erro fatal que...", "Ninguém te contou sobre...", "Você está perdendo dinheiro porque..."
  → O corpo deve amplificar a dor, gerar identificação imediata. Faça o leitor pensar "isso é sobre mim!"
- Slide 2 (AMPLIFICAÇÃO DA DOR): Aprofunde o problema. Mostre as consequências de não agir. Use exemplos reais e cenários do dia a dia que o público vive.

ATO 2 — DESENVOLVIMENTO + VALOR (Slides intermediários):
- Cada slide deve entregar uma MICRO-TRANSFORMAÇÃO — uma revelação, dica prática ou framework que mude a perspectiva do leitor
- Use transições narrativas entre slides: "Mas não para por aí...", "E aqui vem a virada...", "O que poucos sabem é que..."
- Inclua exemplos práticos, números, analogias e metáforas que tornem o conteúdo tangível
- Alterne entre ensinar e provocar — mantenha a tensão narrativa

ATO 3 — RESOLUÇÃO + CTA (2 últimos slides):
- Penúltimo slide: PROVA ou TRANSFORMAÇÃO — Mostre o resultado, o antes/depois, a luz no fim do túnel
- Último slide: CTA IRRESISTÍVEL — Amarre a narrativa toda, resgate o gancho inicial e convide à ação com urgência emocional (não genérica)

═══════════════════════════════════════
REGRAS DE COPY PROFUNDA
═══════════════════════════════════════

TÍTULOS (8-15 palavras):
- Emocionais, impactantes e conectados à narrativa
- Devem criar curiosidade ou tensão para o próximo slide
- Use emojis estrategicamente (1-2 por título, não mais)

CORPO (4-6 linhas por slide):
- Linguagem conversacional e envolvente, como se estivesse falando diretamente com a pessoa
- Cada linha deve ter peso — sem enchimento, sem frases genéricas
- Use quebras de linha para ritmo e impacto visual
- Inclua exemplos concretos, dados ou histórias curtas
- Varie entre perguntas retóricas, afirmações fortes e revelações

GATILHOS MENTAIS (use pelo menos 3 diferentes no carrossel):
- Curiosidade, prova social, escassez, autoridade, reciprocidade, antecipação, contraste, especificidade

CONEXÃO ENTRE SLIDES:
- Cada slide deve ter um "gancho de saída" que faz o leitor querer ver o próximo
- A narrativa deve fluir como uma história, não como uma lista desconectada
- O último slide deve referenciar o primeiro, fechando o arco narrativo${personaContext}`;

    const userPrompt = `Gere ${slideCount} slides sobre: "${topic}"
Tom: ${tone}
Retorne usando a função generate_carousel.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_carousel",
              description: "Gera os slides do carrossel com títulos e corpos otimizados para engajamento viral",
              parameters: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título emocional e impactante do slide (8-15 palavras), conectado à narrativa" },
                        body: { type: "string", description: "Corpo do slide com 4-6 linhas de conteúdo denso, envolvente e com exemplos práticos. Use quebras de linha (\\n) para ritmo visual." },
                      },
                      required: ["title", "body"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["slides"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_carousel" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      throw new Error("Resposta inválida da IA");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const slides = parsed.slides;

    if (!Array.isArray(slides) || slides.length === 0) {
      throw new Error("Nenhum slide gerado");
    }

    // Track usage
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "general" });
      await supabase.rpc("track_token_usage_admin", { p_user_id: userId, p_feature: "carousel-generator", p_tokens: 500 });
    } catch (e) {
      console.error("Usage tracking error:", e);
    }

    return new Response(JSON.stringify({ slides }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("carousel-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
