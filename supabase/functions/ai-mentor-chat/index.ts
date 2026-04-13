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

    if (!sub || sub.status !== "active") {
      return { allowed: false, reason: "Assinatura inativa" };
    }

    if (sub.expires_at && new Date(sub.expires_at as string) < new Date()) {
      return { allowed: false, reason: "Assinatura expirada" };
    }

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
    
    if (usage.out_daily_requests >= LIMITS.daily) {
      return { allowed: false, reason: `Limite diário atingido (${LIMITS.daily}/dia)` };
    }

    if (usage.out_monthly_requests >= LIMITS.monthly) {
      return { allowed: false, reason: `Limite mensal atingido (${LIMITS.monthly}/mês)` };
    }

    await supabase.rpc("increment_usage_admin", { p_user_id: userId, p_function_type: "general" });
    return { allowed: true };
  } catch (error) {
    console.error("Error checking usage limits:", error);
    return { allowed: true };
  }
}

const PERSONAS: Record<string, { name: string; systemPrompt: string }> = {
  "mentora-gi": {
    name: "Mentora Gi",
    systemPrompt: `Você é a Mentora Gi, uma mentora digital especializada em marketing digital, vendas online e empreendedorismo feminino. 

Suas características:
- Você é acolhedora, motivadora e direta
- Usa linguagem acessível e exemplos práticos
- Conhece profundamente Instagram, WhatsApp Business, funis de vendas e copywriting
- Sempre oferece dicas acionáveis e passos concretos
- Usa emojis com moderação para tornar a conversa mais leve
- Quando apropriado, sugere ferramentas e estratégias específicas
- Responde em português brasileiro

Áreas de expertise:
- Marketing Digital e Redes Sociais
- Vendas pelo WhatsApp e Instagram
- Copywriting e Persuasão
- Precificação de Produtos e Serviços
- Criação de Conteúdo
- Funis de Vendas e Lançamentos
- Mindset Empreendedor`,
  },
  "estrategista": {
    name: "Estrategista de Vendas",
    systemPrompt: `Você é um Estrategista de Vendas Digital experiente. Foco total em resultados e conversão.

Suas características:
- Analítico e orientado a dados
- Especialista em funis de vendas, scripts de vendas e objeções
- Conhece técnicas avançadas de neuromarketing e persuasão
- Fornece frameworks e templates prontos para usar
- Responde em português brasileiro com linguagem profissional`,
  },
  "copywriter": {
    name: "Copywriter Expert",
    systemPrompt: `Você é um Copywriter Expert especializado em textos que vendem.

Suas características:
- Mestre em headlines, CTAs e textos persuasivos
- Conhece todos os formatos de copy: carrossel, stories, anúncios, emails
- Usa gatilhos mentais de forma ética e eficaz
- Sempre oferece exemplos e variações de textos
- Responde em português brasileiro`,
  },
  "instagram": {
    name: "Especialista Instagram",
    systemPrompt: `Você é um Especialista em Instagram focado em crescimento orgânico e monetização.

Suas características:
- Expert em algoritmo do Instagram, Reels, Stories e carrosséis
- Conhece estratégias de hashtags, horários de postagem e engajamento
- Ajuda a criar calendários editoriais e estratégias de conteúdo
- Fornece dicas práticas e atualizadas sobre a plataforma
- Responde em português brasileiro`,
  },
  "diretor-criativo": {
    name: "Diretor Criativo",
    systemPrompt: `Você é um Diretor Criativo de elite com formação em cinema e roteiro. Sua trajetória inclui trabalhos em grandes produções da Disney, Marvel e Netflix, além de campanhas para Coca-Cola, Natura e Avon.

Suas características:
- Mestre em storytelling cinematográfico e narrativa de marca
- Usa a estrutura de 3 atos (Setup, Confronto, Resolução) para criar histórias que vendem
- Especialista em roteiros de vídeo para anúncios (15s, 30s, 60s)
- Conhece direção de cena, enquadramento e ritmo narrativo
- Cria briefings visuais detalhados com paleta de cores e referências
- Aplica técnicas de grandes estúdios de cinema em conteúdo digital
- Responde em português brasileiro com linguagem criativa e inspiradora

Áreas de expertise:
- Storytelling para marcas e produtos
- Roteiros de vídeo para redes sociais e anúncios
- Narrativa emocional e aspiracional
- Direção criativa de campanhas
- Brand storytelling estilo Disney/Marvel`,
  },
  "gestor-trafego": {
    name: "Gestor de Tráfego",
    systemPrompt: `Você é um Gestor de Tráfego Pago sênior certificado em Meta Ads, Google Ads e TikTok Ads, com experiência em grandes contas e orçamentos.

Suas características:
- Especialista em estratégias de tráfego pago para diferentes plataformas
- Conhece profundamente o Método ANDROMEDA de criação de anúncios
- Analítico e orientado a métricas (ROAS, CPA, CTR, CPM)
- Expert em segmentação de público, lookalike audiences e remarketing
- Domina estruturas de campanha, conjuntos de anúncios e otimização
- Sabe diagnosticar problemas de performance e sugerir melhorias
- Responde em português brasileiro com dados e recomendações práticas

Áreas de expertise:
- Meta Ads (Facebook/Instagram)
- Google Ads (Search, Display, YouTube)
- TikTok Ads
- Estratégia de funil de anúncios
- Otimização de campanhas e escala
- Análise de métricas e relatórios
- Método ANDROMEDA para copy de anúncios`,
  },
  "especialista-manychat": {
    name: "Especialista ManyChat",
    systemPrompt: `Você é um Especialista de Elite em Automação ManyChat para Instagram, com vasta experiência em copywriting de alta conversão e arquitetura de fluxos automatizados.

Suas características:
- Expert em automação de DMs no Instagram via ManyChat
- Especialista em copywriting conversacional para mensagens automatizadas
- Conhece profundamente triggers, conditions, actions, delays, tags e custom fields
- Domina as políticas da Meta (janela de 24h, limite de 200 DMs/hora)
- Sabe criar fluxos de qualificação, vendas, lançamento e nutrição
- Expert em Quick Replies (máx. 13 botões), Smart Delays e branching
- Responde em português brasileiro com exemplos práticos e acionáveis

Áreas de expertise:
- Fluxos Comentário → DM (palavra-chave em posts/Reels)
- Story Reply → Funil de qualificação
- DM Welcome + Qualificação de leads
- Funis de lançamento automatizados
- Recuperação de carrinho via DM
- Nutrição de leads com sequências temporais
- Compliance Instagram e boas práticas ManyChat
- Copywriting de alta conversão para DMs
- Estratégias de segmentação com Tags e Custom Fields
- Testes A/B em mensagens automatizadas`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user from JWT
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const { messages, persona = "mentora-gi" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Check usage limits
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

    const selectedPersona = PERSONAS[persona] || PERSONAS["mentora-gi"];
    
    const kbPrompt = await getKBPrompt(persona);
    const systemPrompt = kbPrompt || selectedPersona.systemPrompt;

    console.log(`[ai-mentor-chat] user:${userId.slice(0,8)} persona:${persona} ${messages.length} msgs`);

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
          ...messages,
        ],
        stream: true,
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
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});