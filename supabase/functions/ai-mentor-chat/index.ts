import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, persona = "mentora-gi" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const selectedPersona = PERSONAS[persona] || PERSONAS["mentora-gi"];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: selectedPersona.systemPrompt },
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
