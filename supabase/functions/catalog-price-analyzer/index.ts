import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function extractFileContents(supabase: any, filePaths: string[]): Promise<string> {
  const contents: string[] = [];

  for (const path of filePaths.slice(0, 5)) {
    try {
      const { data, error } = await supabase.storage
        .from("product-catalogs")
        .download(path);

      if (error || !data) {
        console.error("Download error for", path, error);
        continue;
      }

      const ext = path.split(".").pop()?.toLowerCase() || "";

      if (["txt", "csv"].includes(ext)) {
        const text = await data.text();
        contents.push(`[Arquivo: ${path.split("/").pop()}]\n${text.slice(0, 2000)}`);
      } else if (ext === "pdf") {
        // For PDFs, extract raw text bytes
        const text = await data.text();
        // Basic text extraction from PDF - get readable strings
        const readable = text.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, " ").replace(/\s+/g, " ").trim();
        contents.push(`[PDF: ${path.split("/").pop()}]\n${readable.slice(0, 2000)}`);
      } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        // For images, convert to base64 and use vision
        const arrayBuffer = await data.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        contents.push(`[IMAGE_BASE64:${ext}:${path.split("/").pop()}]${base64}`);
      }
    } catch (err) {
      console.error("Error processing file:", path, err);
    }
  }

  return contents.filter(c => !c.startsWith("[IMAGE_BASE64:")).join("\n\n").slice(0, 3000);
}

function buildMessages(textContent: string, imageContents: { base64: string; ext: string; name: string }[], niche: string) {
  const userParts: any[] = [];

  userParts.push({
    type: "text",
    text: `Analise os materiais de catálogo/produtos a seguir e extraia:
1. Lista de produtos/serviços com preços detectados
2. Preços sugeridos com base no mercado do nicho "${niche || 'geral'}"
3. Custos estimados e margens
4. Insights de precificação
5. Recomendações estratégicas

MATERIAIS:
${textContent || "(sem texto extraído, analise as imagens)"}

Retorne APENAS JSON válido no formato:
{
  "products": [{"name": "...", "detected_price": null, "suggested_price": null, "estimated_cost": null, "margin_percent": null, "category": "..."}],
  "insights": ["insight 1", "insight 2"],
  "pricing_recommendations": ["rec 1", "rec 2"]
}`
  });

  for (const img of imageContents.slice(0, 3)) {
    userParts.push({
      type: "image_url",
      image_url: { url: `data:image/${img.ext};base64,${img.base64}` }
    });
  }

  return [
    { role: "system", content: "Você é um especialista em precificação e análise de catálogos de produtos. Analise materiais enviados e extraia informações de produtos, preços e custos. Retorne APENAS JSON válido." },
    { role: "user", content: userParts }
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { filePaths, niche } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!filePaths || filePaths.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check usage
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub || sub.status !== "active") {
      return new Response(JSON.stringify({ error: "Assinatura inativa" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.rpc("increment_usage_admin", { p_user_id: user.id, p_function_type: "general" });

    // Extract file contents
    const rawContents = await extractFileContents(supabase, filePaths);

    // Separate image base64 from text
    const allContents: string[] = [];
    const imageContents: { base64: string; ext: string; name: string }[] = [];

    for (const path of filePaths.slice(0, 5)) {
      try {
        const ext = path.split(".").pop()?.toLowerCase() || "";
        if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
          const { data } = await supabase.storage.from("product-catalogs").download(path);
          if (data) {
            const arrayBuffer = await data.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            imageContents.push({
              base64: btoa(binary),
              ext: ext === "jpg" ? "jpeg" : ext,
              name: path.split("/").pop() || path
            });
          }
        }
      } catch { /* skip */ }
    }

    const messages = buildMessages(rawContents, imageContents, niche || "");

    console.log("[catalog-price-analyzer] user:", user.id.slice(0, 8), "files:", filePaths.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 4000,
        messages,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    let analysis;
    try {
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(clean);
    } catch {
      console.error("Failed to parse:", content);
      throw new Error("Falha ao processar resposta da IA");
    }

    const tokensUsed = data.usage?.total_tokens || 2000;
    await supabase.rpc("track_token_usage_admin", {
      p_user_id: user.id, p_feature: "catalog-analyzer", p_tokens: tokensUsed
    });

    return new Response(JSON.stringify({ analysis }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("catalog-price-analyzer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
