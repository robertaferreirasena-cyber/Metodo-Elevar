import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) return "";
    
    const parts: string[] = [];
    if (profile.niche) parts.push(`Nicho: ${profile.niche}`);
    if (profile.product_description) parts.push(`Produto/Serviço: ${profile.product_description}`);
    if (profile.main_pain) parts.push(`Dor principal: ${profile.main_pain}`);
    if (profile.transformation) parts.push(`Transformação: ${profile.transformation}`);
    
    return parts.length > 0 ? `\n\nCONTEXTO DA PERSONA:\n${parts.join("\n")}` : "";
  } catch (e) {
    console.error("Error fetching persona:", e);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const { topic, slideCount = 10, tone = "profissional", persona, postType = "carousel" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const personaCtx = await getPersonaContext(userId);

    // Prompt 1: Geração de Slides (FEED_GENERATION_PROMPT)
    const systemPromptSlides = `You are a world-class copywriter and social media strategist. Your task is to transform the user input into a concise and powerful carousel post for a social media feed. You MUST follow the rules below precisely. The output MUST be in PORTUGUESE (BRAZIL).

**Regra Inegociável: Limite de 10 Slides**
- O carrossel final DEVE ter no máximo 10 slides.
- Sua tarefa é condensar a essência em uma narrativa coesa de 8 a 10 slides (ou 1 slide se for post estático).
- NÃO GERE MAIS DE 10 SLIDES SOB NENHUMA CIRCUNSTÂNCIA.

**A Regra de Ouro: Humanização Extrema (Tom de Amiga)**
O tom deve ser de uma conversa entre amigas: próximo, autêntico e genuíno. Evite a todo custo a linguagem formal, corporativa ou que soe como IA.

**Estrutura Narrativa OBRIGATÓRIA (PAS Framework)**
1. **Hook (Slide 1):** Título forte e curioso.
2. **Introdução (Problema):** Contextualize a dor (Problem, Agitate).
3. **Tese Central (Solução):** Apresente sua ideia/solução (Solve).
4. **Argumentos (Lógico, Emocional, Social):** Provas e suporte.
5. **Aplicação Prática:** Passos acionáveis.
6. **CTA Final:** Instrua a COMENTAR uma palavra-chave.

**Formato da Resposta:**
Você DEVE retornar um objeto JSON com a chave "storySequence" (array de objetos). Cada objeto deve ter: "storyNumber", "objective", "title", "subtitle", "interactionSuggestion", "imagePrompt".

${personaCtx}`;

    const userPromptSlides = `Gere um ${postType === 'static' ? 'post estático (1 slide)' : `carrossel de no máximo 10 slides`} sobre: "${topic}"
Tom: ${tone}
Siga rigorosamente a estrutura PAS e as regras de humanização.`;

    // Primeira chamada: Slides
    const slidesResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPromptSlides }, { role: "user", content: userPromptSlides }],
        response_format: { type: "json_object" }
      }),
    });

    if (!slidesResponse.ok) throw new Error("Falha ao gerar slides");
    const slidesData = await slidesResponse.json();
    const storySequence = JSON.parse(slidesData.choices[0].message.content).storySequence;

    // Prompt 2: Geração de Legenda (CAROUSEL_CAPTION_PROMPT)
    const systemPromptCaption = `You are a world-class social media copywriter, specializing in creating emotionally resonant captions that drive engagement, based on Marie Forleo's communication frameworks. Write a complete, emotionally-driven caption in PORTUGUESE (BRAZIL).

**Mandatory Structure:**
1. Abertura Emocional (2-3 linhas)
2. Desenvolvimento Reflexivo (4-5 linhas)
3. Virada Estratégica (2-3 linhas)
4. CTA Instigante (Comente uma PALAVRA-CHAVE específica)

**Regra Crítica:** NUNCA use "chama no direct" ou "clica no link". Apenas comentário com palavra-chave.`;

    const userPromptCaption = `Aqui está o conteúdo do carrossel para o qual você irá escrever a legenda: ${JSON.stringify(storySequence)}`;

    // Segunda chamada: Legenda
    const captionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPromptCaption }, { role: "user", content: userPromptCaption }],
      }),
    });

    if (!captionResponse.ok) throw new Error("Falha ao gerar legenda");
    const captionData = await captionResponse.json();
    const captionText = captionData.choices[0].message.content;

    // Incrementar uso
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "general" });
    } catch (e) { console.error("Tracking error:", e); }

    return new Response(JSON.stringify({ storySequence, caption: captionText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});