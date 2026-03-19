import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { formData, raioXData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build raio-x context block
    let raioXContext = "";
    if (raioXData) {
      const parts: string[] = [];
      if (raioXData.fontes_de_dor?.length) parts.push(`DORES DA PERSONA: ${raioXData.fontes_de_dor.join("; ")}`);
      if (raioXData.desejos?.length) parts.push(`DESEJOS: ${raioXData.desejos.join("; ")}`);
      if (raioXData.medos?.length) parts.push(`MEDOS: ${raioXData.medos.join("; ")}`);
      if (raioXData.sonhos?.length) parts.push(`SONHOS: ${raioXData.sonhos.join("; ")}`);
      if (raioXData.problemas_internos?.length) parts.push(`PROBLEMAS INTERNOS: ${raioXData.problemas_internos.join("; ")}`);
      if (raioXData.oportunidades?.length) parts.push(`OPORTUNIDADES: ${raioXData.oportunidades.join("; ")}`);
      if (raioXData.padroes_de_compra) {
        const pc = raioXData.padroes_de_compra;
        parts.push(`PADRÕES DE COMPRA: Gatilhos: ${pc.gatilhos_decisao || "—"}, Objeções: ${pc.objecoes_previsiveis || "—"}, Ciclo: ${pc.ciclo_decisao || "—"}`);
      }
      if (raioXData.neurocomportamentos) {
        const nc = raioXData.neurocomportamentos;
        parts.push(`NEUROCOMPORTAMENTOS: Confiança: ${nc.gatilhos_confianca || "—"}, Resistência: ${nc.gatilhos_resistencia || "—"}, Canal ideal: ${nc.canal_comunicacao_ideal || "—"}`);
      }
      if (raioXData.estrategia_recomendada) {
        const er = raioXData.estrategia_recomendada;
        parts.push(`ESTRATÉGIA RECOMENDADA: Tom: ${er.tom_comunicacao || "—"}, Gatilhos: ${er.gatilhos_mentais_prioritarios?.join(", ") || "—"}, Abordagem: ${er.abordagem_venda || "—"}`);
      }
      if (raioXData.resumo_executivo) parts.push(`RESUMO EXECUTIVO: ${raioXData.resumo_executivo}`);
      raioXContext = `\n\nRAIO-X COMPLETO DA PERSONA DO CLIENTE:\n${parts.join("\n")}`;
    }

    const goals = Array.isArray(formData.mainGoals) ? formData.mainGoals.join(", ") : (formData.mainGoal || "não informado");

    const systemPrompt = `Você é um estrategista de Instagram de elite. Seu trabalho é criar um PERFIL INSTAGRAM que funcione como o LUGAR IDEAL onde a persona do cliente vai querer FICAR, INTERAGIR e COMPRAR.

REGRAS FUNDAMENTAIS:
1. O perfil deve ser um ecossistema de atração, retenção e conversão
2. Cada elemento (bio, destaques, posts) deve trabalhar em sinergia com o funil: ATRAIR → RETER → VENDER
3. A narrativa dos conteúdos deve estar 100% alinhada com as dores, desejos e medos da persona
4. Os posts devem usar os gatilhos mentais e tom de comunicação adequados para esta persona específica
5. Gere EXATAMENTE 9 posts estratégicos: 3 de ATRAÇÃO, 3 de RETENÇÃO e 3 de CONVERSÃO
6. Os destaques devem ter documento detalhado com estrutura e motivo estratégico

Responda APENAS usando a tool "generate_instagram_profile".`;

    const userPrompt = `Dados do perfil:
- Nicho: ${formData.niche || "não informado"}
- Sub-nicho: ${formData.subNiche || "não informado"}
- Aparece na câmera: ${formData.showsFace || "não informado"}
- Público ideal: ${formData.targetAudience || "não informado"}
- Faixa etária: ${formData.ageRange || "não informado"}
- Objetivos: ${goals}
- Nome da marca: ${formData.brandName || "não informado"}
- O que vende: ${formData.whatSells || "não informado"}
- Diferencial: ${formData.differentiator || "não informado"}
- Transformação: ${formData.transformation || "não informado"}
- Tom de voz: ${formData.toneOfVoice || "não informado"}
- Já tem Instagram: ${formData.hasInstagram || "não informado"}
- Seguidores: ${formData.followers || "não informado"}
- Frequência de postagem: ${formData.postFrequency || "não informado"}
- Dificuldades: ${formData.difficulties || "não informado"}
${raioXContext}

Com base em TODOS os dados acima (especialmente o Raio-X da persona se disponível), gere um perfil Instagram completo que funcione como um funil estratégico de atração, retenção e conversão. 

Os 9 posts DEVEM ser distribuídos assim:
- 3 posts de ATRAÇÃO (fase "atração"): conteúdo que chama atenção, gera identificação e atrai novos seguidores
- 3 posts de RETENÇÃO (fase "retenção"): conteúdo que gera valor, engajamento e faz a audiência querer voltar
- 3 posts de CONVERSÃO (fase "conversão"): conteúdo que leva à ação, quebra objeções e gera vendas

Cada destaque deve ter explicação detalhada do conteúdo sugerido, estrutura e motivo estratégico.`;

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
              description: "Gera um perfil Instagram completo e otimizado como funil estratégico",
              parameters: {
                type: "object",
                properties: {
                  username_sugestoes: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 sugestões de @username",
                  },
                  nome_perfil: { type: "string", description: "Nome exibido no perfil" },
                  categoria: { type: "string", description: "Categoria do perfil" },
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
                  destaques_detalhados: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string", description: "Nome do destaque" },
                        emoji: { type: "string", description: "Emoji do destaque" },
                        conteudo_sugerido: { type: "string", description: "O que colocar neste destaque (stories, conteúdo)" },
                        estrutura: { type: "string", description: "Quantos stories, formato (ex: 5-8 stories, capa + conteúdo + CTA)" },
                        motivo: { type: "string", description: "Por que esse destaque é estratégico para o perfil" },
                      },
                      required: ["nome", "emoji", "conteudo_sugerido", "estrutura", "motivo"],
                    },
                    description: "5-7 destaques com documento detalhado de cada um",
                  },
                  posts_sugeridos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tipo: { type: "string", enum: ["carrossel", "reels", "stories"] },
                        fase: { type: "string", enum: ["atração", "retenção", "conversão"], description: "Fase do funil" },
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        legenda: { type: "string" },
                      },
                      required: ["tipo", "fase", "titulo", "descricao", "legenda"],
                    },
                    description: "EXATAMENTE 9 posts: 3 atração, 3 retenção, 3 conversão",
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
                  "destaques_detalhados",
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
