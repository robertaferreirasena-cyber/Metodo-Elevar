import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { rawResult, platform, objective, product, audience, budget, tone } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um gestor de tráfego pago especialista certificado em Meta Ads, Google Ads e TikTok Ads (padrão 2026 com lógica Andromeda/Advantage+). Sua tarefa é transformar o conteúdo de um anúncio gerado pelo Método ANDROMEDA em uma estrutura JSON organizada que simula um gerenciador de anúncios real.

Retorne APENAS o JSON válido (sem markdown, sem código, sem explicação) com a seguinte estrutura:

{
  "campaign": {
    "name": "Nome descritivo da campanha",
    "objective": "Objetivo da campanha",
    "budget_type": "daily" ou "lifetime",
    "budget_value": "R$ XX,XX",
    "status": "active"
  },
  "ad_sets": [
    {
      "name": "Nome descritivo do conjunto",
      "optimization_goal": "Conversões" ou "Cliques no link" ou "Alcance" ou "Visualizações de vídeo" ou "Geração de cadastros",
      "audience": {
        "gender": "all" ou "male" ou "female",
        "age_min": 18,
        "age_max": 65,
        "locations": ["Brasil", "São Paulo - SP"],
        "description": "Descrição resumida do público",
        "detailed_targeting": {
          "interests": ["Interesse 1", "Interesse 2", "Interesse 3"],
          "behaviors": ["Comportamento 1", "Comportamento 2"],
          "demographics": ["Dado demográfico 1", "Dado demográfico 2"]
        },
        "custom_audiences": ["Lookalike 1% - Compradores", "Visitantes do site 30 dias"],
        "advantage_plus": true
      },
      "placements": ["feed", "stories", "reels"],
      "budget": "R$ XX,XX/dia",
      "schedule": "continuous",
      "ads": [
        {
          "name": "Nome do anúncio (ex: Versão Emocional)",
          "headline": "Headline do anúncio",
          "primary_text": "Texto principal completo",
          "description": "Descrição curta",
          "cta": "Texto do botão CTA",
          "format": "video" ou "image" ou "carousel",
          "creative_format_label": "Vídeo Vertical 9:16" ou "Imagem Estática 1080x1080" ou "Carrossel 3 Cards",
          "creative_description": "Descrição detalhada do criativo com orientações visuais",
          "recommended_dimensions": "1080x1920px",
          "video_script": "Roteiro completo do vídeo se for vídeo",
          "visual_brief": "Briefing visual resumido"
        }
      ]
    }
  ]
}

REGRAS IMPORTANTES:
- Extraia as informações diretamente do conteúdo ANDROMEDA fornecido
- Crie pelo menos 2 conjuntos de anúncios com segmentações DIFERENTES
- Cada conjunto deve ter pelo menos 2 variações de anúncio (A/B)
- O campo "detailed_targeting" DEVE conter pelo menos 5 interesses específicos e relevantes para o nicho, 3 comportamentos e 2 dados demográficos — use termos EXATOS como aparecem no Meta Ads Manager 2026
- O campo "custom_audiences" deve sugerir públicos personalizados e lookalike relevantes
- O campo "advantage_plus" indica se recomenda usar Advantage+ Audience (Andromeda) — defina como true quando o objetivo for conversões
- O campo "optimization_goal" deve ser específico para o objetivo da campanha
- O campo "creative_format_label" deve ser descritivo (ex: "Vídeo Vertical 9:16", "Imagem Feed 1:1", "Carrossel 5 Cards")
- O campo "creative_description" deve descrever em detalhes o que o criativo deve conter visualmente
- O campo "recommended_dimensions" deve informar as dimensões em pixels ideais
- Adapte os posicionamentos à plataforma (Meta: feed/stories/reels, Google: search/display, TikTok: for_you/top_view)
- Use o orçamento informado para distribuir entre conjuntos
- Retorne SOMENTE o JSON, sem nenhum texto adicional`;

    const userMessage = `Transforme este anúncio ANDROMEDA em estrutura de gerenciador de anúncios:

**Plataforma:** ${platform}
**Objetivo:** ${objective}
**Produto:** ${product || "não informado"}
**Público-alvo:** ${audience || "não informado"}
**Orçamento:** ${budget || "a definir"}
**Tom:** ${tone || "não informado"}

**CONTEÚDO DO ANÚNCIO ANDROMEDA:**
${rawResult}`;

    console.log(`[ad-structure-generator] user:${user.id.slice(0, 8)} platform:${platform}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "structure_campaign",
              description: "Return the structured campaign data as JSON",
              parameters: {
                type: "object",
                properties: {
                  campaign: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      objective: { type: "string" },
                      budget_type: { type: "string", enum: ["daily", "lifetime"] },
                      budget_value: { type: "string" },
                      status: { type: "string", enum: ["active", "paused"] },
                    },
                    required: ["name", "objective", "budget_type", "budget_value", "status"],
                  },
                  ad_sets: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        optimization_goal: { type: "string" },
                        audience: {
                          type: "object",
                          properties: {
                            gender: { type: "string" },
                            age_min: { type: "number" },
                            age_max: { type: "number" },
                            locations: { type: "array", items: { type: "string" } },
                            interests: { type: "array", items: { type: "string" } },
                            description: { type: "string" },
                            detailed_targeting: {
                              type: "object",
                              properties: {
                                interests: { type: "array", items: { type: "string" } },
                                behaviors: { type: "array", items: { type: "string" } },
                                demographics: { type: "array", items: { type: "string" } },
                              },
                            },
                            custom_audiences: { type: "array", items: { type: "string" } },
                            advantage_plus: { type: "boolean" },
                          },
                          required: ["gender", "age_min", "age_max", "locations", "description"],
                        },
                        placements: { type: "array", items: { type: "string" } },
                        budget: { type: "string" },
                        schedule: { type: "string" },
                        ads: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              headline: { type: "string" },
                              primary_text: { type: "string" },
                              description: { type: "string" },
                              cta: { type: "string" },
                              format: { type: "string" },
                              creative_format_label: { type: "string" },
                              creative_description: { type: "string" },
                              recommended_dimensions: { type: "string" },
                              video_script: { type: "string" },
                              visual_brief: { type: "string" },
                            },
                            required: ["name", "headline", "primary_text", "cta", "format"],
                          },
                        },
                      },
                      required: ["name", "audience", "placements", "budget", "ads"],
                    },
                  },
                },
                required: ["campaign", "ad_sets"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "structure_campaign" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    let structuredData;
    if (toolCall?.function?.arguments) {
      structuredData = typeof toolCall.function.arguments === "string" 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } else {
      const content = aiResult.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract structured data from AI response");
      }
    }

    const { data: campaign, error: insertError } = await supabase
      .from("ad_campaigns")
      .insert({
        user_id: user.id,
        platform,
        objective,
        product,
        audience,
        budget,
        tone,
        raw_result: rawResult,
        structured_data: structuredData,
        status: "approved",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Erro ao salvar campanha");
    }

    try {
      await supabase.rpc("track_token_usage_admin", { p_user_id: user.id, p_feature: "ad-structure", p_tokens: 800 });
    } catch (e) { console.error("Token tracking error:", e); }

    return new Response(JSON.stringify({ campaign, structuredData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ad-structure-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
