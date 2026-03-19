import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um especialista em marketing digital e Instagram. Gere um perfil Instagram completo e otimizado para alta conversão baseado nos dados fornecidos. Responda APENAS usando a tool "generate_instagram_profile".`;

    const userPrompt = `Dados do perfil:
- Nicho: ${formData.niche || "não informado"}
- Sub-nicho: ${formData.subNiche || "não informado"}
- Aparece na câmera: ${formData.showsFace || "não informado"}
- Público ideal: ${formData.targetAudience || "não informado"}
- Faixa etária: ${formData.ageRange || "não informado"}
- Objetivo principal: ${formData.mainGoal || "não informado"}
- Nome da marca: ${formData.brandName || "não informado"}
- O que vende: ${formData.whatSells || "não informado"}
- Diferencial: ${formData.differentiator || "não informado"}
- Transformação: ${formData.transformation || "não informado"}
- Tom de voz: ${formData.toneOfVoice || "não informado"}
- Já tem Instagram: ${formData.hasInstagram || "não informado"}
- Seguidores: ${formData.followers || "não informado"}
- Frequência de postagem: ${formData.postFrequency || "não informado"}
- Dificuldades: ${formData.difficulties || "não informado"}

Gere um perfil Instagram completo com sugestões de username criativas, bio otimizada com emojis estratégicos, destaques relevantes, 6 posts sugeridos variados (carrossel, reels, stories) e estratégia de conteúdo.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_instagram_profile",
              description: "Gera um perfil Instagram completo e otimizado",
              parameters: {
                type: "object",
                properties: {
                  username_sugestoes: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 sugestões de @username",
                  },
                  nome_perfil: { type: "string", description: "Nome exibido no perfil (ex: Maria | Coach Financeiro)" },
                  categoria: { type: "string", description: "Categoria do perfil (ex: Empreendedor(a) Digital)" },
                  bio_lines: {
                    type: "array",
                    items: { type: "string" },
                    description: "4 linhas de bio com emojis estratégicos",
                  },
                  link_sugerido: { type: "string", description: "Link sugerido para a bio" },
                  destaques: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string" },
                        emoji: { type: "string" },
                      },
                      required: ["nome", "emoji"],
                    },
                    description: "5-7 destaques sugeridos com nome e emoji",
                  },
                  posts_sugeridos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tipo: { type: "string", enum: ["carrossel", "reels", "stories"] },
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        legenda: { type: "string" },
                      },
                      required: ["tipo", "titulo", "descricao", "legenda"],
                    },
                    description: "6 posts sugeridos variados",
                  },
                  estrategia: {
                    type: "object",
                    properties: {
                      pilares: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-4 pilares de conteúdo",
                      },
                      frequencia: { type: "string" },
                      horarios: {
                        type: "array",
                        items: { type: "string" },
                        description: "Melhores horários para postar",
                      },
                      dicas_crescimento: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-5 dicas personalizadas de crescimento",
                      },
                    },
                    required: ["pilares", "frequencia", "horarios", "dicas_crescimento"],
                  },
                },
                required: [
                  "username_sugestoes",
                  "nome_perfil",
                  "categoria",
                  "bio_lines",
                  "link_sugerido",
                  "destaques",
                  "posts_sugeridos",
                  "estrategia",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_instagram_profile" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar perfil" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Resposta inesperada da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("instagram-profile-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
