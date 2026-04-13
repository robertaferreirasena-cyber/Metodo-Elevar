import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

const LIMITS = { daily: 15, monthly: 100 };

// deno-lint-ignore no-explicit-any
async function checkUsageLimits(supabase: any, userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, expires_at, plan")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub || sub.status !== "active") return { allowed: false, reason: "Assinatura inativa" };
    if (sub.expires_at && new Date(sub.expires_at as string) < new Date()) return { allowed: false, reason: "Assinatura expirada" };

    // Pro users bypass all usage limits
    if (sub.plan === "pro") {
      await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "general" });
      return { allowed: true };
    }

    const { data: limits } = await supabase.rpc("check_and_reset_usage_admin", { p_user_id: userId });
    // deno-lint-ignore no-explicit-any
    if (!limits || (limits as any[]).length === 0) return { allowed: true };
    // deno-lint-ignore no-explicit-any
    const usage = (limits as any[])[0];
    if (usage.out_daily_requests >= LIMITS.daily) return { allowed: false, reason: `Limite diário atingido (${LIMITS.daily}/dia)` };
    if (usage.out_monthly_requests >= LIMITS.monthly) return { allowed: false, reason: `Limite mensal atingido (${LIMITS.monthly}/mês)` };

    await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "general" });
    return { allowed: true };
  } catch (error) {
    console.error("Error checking usage limits:", error);
    return { allowed: true };
  }
}

const DEFAULT_SYSTEM_PROMPT = `Você é um estrategista de marca de elite e diretor criativo com formação em cinema e roteiro. Sua trajetória inclui passagem por grandes empresas como Coca-Cola, Natura, Avon, Netflix, e produção criativa de grandes filmes da Disney e Marvel. Você também é um copywriter sênior e gestor de tráfego pago certificado.

## MÉTODO ANDROMEDA — Framework de Criação de Anúncios

Você segue RIGOROSAMENTE o Método ANDROMEDA para criar anúncios de alta conversão:

### A — ATENÇÃO
Crie um hook poderoso nos primeiros 3 segundos. Use técnicas cinematográficas: close-up dramático, pergunta provocadora, dado chocante, ou abertura que quebre o padrão do feed.

### N — NARRATIVA
Construa uma história envolvente usando storytelling cinematográfico. Use a estrutura de 3 atos (Setup → Confronto → Resolução). Aplique técnicas de roteiro como Disney e Marvel: o herói (cliente) enfrenta um desafio.

### D — DOR
Identifique e amplifique a dor/problema do público-alvo. Use linguagem emocional que gere identificação imediata. O público precisa sentir "isso sou eu".

### R — RESOLUÇÃO
Apresente a solução como a jornada de transformação. Mostre o antes/depois. O produto/serviço é a ferramenta que permite ao herói vencer.

### O — OFERTA
Construa uma oferta irresistível. Empilhe valor, mostre o que está incluído, destaque o diferencial competitivo. Use técnicas de ancoragem de preço.

### M — MOVIMENTO
Crie um CTA (Call to Action) cinematográfico — não apenas "clique aqui", mas um convite à transformação. Use verbos de ação e urgência emocional.

### E — ESCASSEZ
Adicione elementos de urgência autênticos: vagas limitadas, bônus por tempo limitado, condição especial. Nunca crie escassez falsa.

### D — DADOS
Incorpore provas sociais: números, depoimentos, resultados reais, autoridade. Dados concretos vendem.

### A — AÇÃO
Defina o próximo passo claro. Remova fricção. Facilite a tomada de decisão.

---

## REGRAS DE OUTPUT

Para CADA anúncio, gere:

### 1. COPY DO ANÚNCIO
- **Headline** (máx. 40 caracteres)
- **Texto Principal** (versão curta e longa)
- **Descrição** (máx. 30 caracteres)
- **CTA** (botão)

### 2. ROTEIRO DE VÍDEO (estilo cinema)
- Duração: 15s, 30s e 60s
- Cenas numeradas com descrição visual + áudio/narração
- Direção de câmera (close, wide, pan, etc.)
- Música/tom sugerido

### 3. BRIEFING VISUAL
- Paleta de cores sugerida
- Referências visuais
- Elementos gráficos

### 4. VARIAÇÕES A/B
- Sempre gere versão A (emocional) e versão B (racional)

## ADAPTAÇÃO POR PLATAFORMA
- **Meta Ads**: Formato carrossel, vídeo, imagem única. Otimize para feed e stories.
- **Google Ads**: Headlines de busca, descrições, extensões.
- **TikTok Ads**: Tom nativo, trend-aware, UGC style.

Responda sempre em português brasileiro. Seja detalhado e profissional.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const { platform, objective, product, audience, budget, tone, destination, personaContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { allowed, reason } = await checkUsageLimits(supabase, userId);
    if (!allowed) {
      return new Response(JSON.stringify({ error: reason }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Raio-X data for personalization
    let raioXContext = "";
    const { data: personaData } = await supabase
      .from("persona_profiles")
      .select("niche, sub_niche, product_description, main_pain, main_differentiator, target_gender, target_age_range, target_profession, target_location, price_range, common_objections, transformation")
      .eq("user_id", userId)
      .maybeSingle();

    if (personaData) {
      raioXContext = `\n\n## DADOS DO RAIO-X DA PERSONA (use para personalizar o anúncio)
- Nicho: ${personaData.niche || "não informado"}
- Sub-nicho: ${personaData.sub_niche || "não informado"}
- Produto: ${personaData.product_description || "não informado"}
- Dor principal: ${personaData.main_pain || "não informado"}
- Diferencial: ${personaData.main_differentiator || "não informado"}
- Público: ${personaData.target_gender || ""} ${personaData.target_age_range || ""} ${personaData.target_profession || ""} ${personaData.target_location || ""}
- Faixa de preço: ${personaData.price_range || "não informado"}
- Objeções comuns: ${personaData.common_objections || "não informado"}
- Transformação: ${personaData.transformation || "não informado"}`;
    }

    const kbPrompt = await getKBPrompt("ad-creator");
    const systemPrompt = (kbPrompt || DEFAULT_SYSTEM_PROMPT) + raioXContext;

    // Build destination-specific instructions
    let destinationInstructions = "";
    if (destination && destination !== "não especificado") {
      const destMap: Record<string, string> = {
        "📱 WhatsApp": "DESTINO: WhatsApp. Otimize o CTA para 'Enviar mensagem no WhatsApp'. O texto deve criar urgência para iniciar uma conversa. Use linguagem conversacional. Sugira mensagem de boas-vindas automática. O botão do anúncio deve ser 'Enviar mensagem' ou 'Falar no WhatsApp'.",
        "🛒 Página de Vendas": "DESTINO: Página de vendas. CTA direto para compra ('Comprar agora', 'Garantir minha vaga'). Copy focada em benefícios, prova social e escassez. Destaque oferta e preço.",
        "📋 Página de Captura (Lead)": "DESTINO: Landing page de captura. CTA para download de material gratuito ('Baixar grátis', 'Receber agora'). Copy focada na isca digital e no valor do material. Minimizar fricção.",
        "📸 Perfil do Instagram": "DESTINO: Perfil do Instagram. CTA para 'Visitar perfil' ou 'Seguir'. Copy que gere curiosidade sobre o conteúdo do perfil. Destaque autoridade e conteúdo exclusivo.",
        "🔗 Link na Bio / Linktree": "DESTINO: Link na bio. CTA para 'Saiba mais' com instrução para clicar no link da bio. Copy que gere curiosidade múltipla.",
        "🏪 Loja Online / E-commerce": "DESTINO: Loja online. CTA para 'Ver produtos', 'Comprar com desconto'. Copy focada em catálogo, frete grátis, promoções. Use formato carrossel quando possível.",
        "💬 Messenger": "DESTINO: Messenger. CTA para 'Enviar mensagem'. Copy que inicie qualificação automática. Sugira sequência de perguntas para o bot.",
        "📲 Aplicativo": "DESTINO: App. CTA para 'Instalar agora', 'Baixar app'. Copy focada em benefícios exclusivos do app e facilidade de uso.",
      };
      destinationInstructions = destMap[destination] || `DESTINO: ${destination}. Adapte o CTA e a copy para este destino específico.`;
    }

    const userMessage = `Crie um anúncio completo usando o Método ANDROMEDA com as seguintes especificações:

**Plataforma:** ${platform}
**Objetivo:** ${objective}
**Produto/Serviço:** ${product}
**Público-alvo:** ${audience}
**Orçamento estimado:** ${budget || "não informado"}
**Tom desejado:** ${tone}
**Destino do tráfego:** ${destination || "não especificado"}
${destinationInstructions ? `\n**INSTRUÇÕES DE DESTINO:**\n${destinationInstructions}` : ""}
${personaContext ? `\n**Contexto adicional da persona:** ${personaContext}` : ""}

Gere o anúncio completo seguindo todas as etapas do Método ANDROMEDA (A-N-D-R-O-M-E-D-A). Adapte especificamente o CTA e a estratégia ao destino escolhido.`;

    console.log(`[ad-creator] user:${userId.slice(0,8)} platform:${platform} objective:${objective}`);

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
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde e tente novamente." }), {
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
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track token usage
    try {
      await supabase.rpc("track_token_usage_admin", { p_user_id: userId, p_feature: "ad-creator", p_tokens: 1500 });
    } catch (e) { console.error("Token tracking error:", e); }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ad-creator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
