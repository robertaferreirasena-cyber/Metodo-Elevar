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

    const systemPrompt = `Você é um especialista em copywriting viral para redes sociais (Instagram, LinkedIn, WhatsApp Status).

Sua missão é gerar slides de carrossel com conteúdo IMPOSSÍVEL DE IGNORAR pelo público-alvo.

REGRAS DE COPYWRITING VIRAL:
- Slide 1 (GANCHO): Frase curta e provocativa que OBRIGA a pessoa a parar de scrollar. Use padrões virais: "Pare de...", "O erro que...", "Ninguém te contou...", números específicos, contradições
- Slides intermediários: Conteúdo de ALTO VALOR com dicas práticas, frameworks, revelações. Cada slide deve ter uma micro-transformação
- Último slide (CTA): Chamada para ação irresistível com senso de urgência ou exclusividade
- Títulos: CURTOS e IMPACTANTES (max 6-8 palavras), use emojis estrategicamente
- Corpo: 2-3 linhas DIRETAS, linguagem conversacional, sem enrolação
- Use gatilhos mentais: curiosidade, prova social, escassez, autoridade, reciprocidade
- Adapte ao tom solicitado mas SEMPRE mantenha energia alta${personaContext}`;

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
        max_tokens: 2000,
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
                        title: { type: "string", description: "Título curto e impactante do slide (max 8 palavras)" },
                        body: { type: "string", description: "Corpo do slide com 2-3 linhas de conteúdo de valor" },
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
