import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, niche, business_name, annual_goal, quarterly_goal, current_revenue, main_challenge } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Gere uma carta de compromisso estratégico motivacional e profissional para uma empreendedora que está iniciando o Método ELEVAR de mentoria de vendas. Use os dados reais dela para personalizar:

Nome: ${name || "Empreendedora"}
Negócio: ${business_name || "Não informado"}
Nicho: ${niche || "Não informado"}
Faturamento atual mensal: ${current_revenue || "Não informado"}
Meta anual: ${annual_goal || "Não informada"}
Meta trimestral: ${quarterly_goal || "Não informada"}
Principal desafio: ${main_challenge || "Não informado"}

A carta deve:
1. Começar com uma saudação personalizada usando o nome dela
2. Reconhecer o momento atual do negócio dela
3. Descrever o compromisso com o Método ELEVAR (10 encontros práticos de transformação)
4. Mencionar as metas que ela definiu como norte
5. Incluir 3-4 compromissos específicos (ex: completar todas as missões, aplicar no negócio, medir resultados)
6. Terminar com uma frase motivacional poderosa

Formato: Texto corrido com parágrafos, sem markdown, sem emojis excessivos (máximo 2-3). Tom profissional mas acolhedor. Máximo 300 palavras.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é uma mentora de negócios especializada em vendas para empreendedoras. Gera textos motivacionais e profissionais." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const copy = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ copy }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
