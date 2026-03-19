import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedFile {
  type: "text" | "image";
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
}

async function extractFiles(supabase: any, filePaths: string[]): Promise<ExtractedFile[]> {
  const results: ExtractedFile[] = [];

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
      const name = path.split("/").pop() || path;

      if (["txt", "csv"].includes(ext)) {
        const text = await data.text();
        results.push({ type: "text", name, content: text.slice(0, 2000) });
      } else if (ext === "pdf") {
        const text = await data.text();
        const readable = text.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, " ").replace(/\s+/g, " ").trim();
        results.push({ type: "text", name, content: readable.slice(0, 2000) });
      } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        const arrayBuffer = await data.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        // Check size - skip images > 4MB for base64
        if (bytes.length > 4 * 1024 * 1024) {
          results.push({ type: "text", name, content: `[Imagem ${name} muito grande para análise visual]` });
          continue;
        }
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const mimeType = ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        results.push({ type: "image", name, base64: btoa(binary), mimeType });
      }
    } catch (err) {
      console.error("Error processing file:", path, err);
    }
  }

  return results;
}

function buildMessages(files: ExtractedFile[], niche: string) {
  // Build multimodal user message content parts
  const parts: any[] = [];

  // Text instruction
  const textFiles = files.filter(f => f.type === "text");
  const imageFiles = files.filter(f => f.type === "image");

  let textContent = "";
  if (textFiles.length > 0) {
    textContent = textFiles.map(f => `[${f.name}]:\n${f.content}`).join("\n\n").slice(0, 3000);
  }

  parts.push({
    type: "text",
    text: `Você é um especialista em precificação e análise de catálogos.

Analise os materiais enviados (textos e/ou fotos de catálogos/produtos) e extraia:

1. **Lista de produtos/serviços** com nome, preço detectado, categoria
2. **Preço sugerido** com base no mercado do nicho "${niche || 'geral'}"
3. **Custo estimado** e margem percentual
4. **Insights** de precificação (comparação com mercado, oportunidades)
5. **Recomendações** estratégicas de preço

${textContent ? `CONTEÚDO TEXTUAL DOS MATERIAIS:\n${textContent}` : ""}
${imageFiles.length > 0 ? `\n${imageFiles.length} IMAGEM(NS) DO CATÁLOGO ANEXADA(S) - Analise visualmente cada produto visível: nomes, preços, descrições, embalagens, etc.` : ""}

Retorne APENAS JSON válido:
{
  "products": [{"name": "...", "detected_price": number|null, "suggested_price": number|null, "estimated_cost": number|null, "margin_percent": number|null, "category": "..."}],
  "insights": ["insight 1", "insight 2", ...],
  "pricing_recommendations": ["rec 1", "rec 2", ...]
}`
  });

  // Add images as vision content
  for (const img of imageFiles.slice(0, 4)) {
    parts.push({
      type: "image_url",
      image_url: {
        url: `data:${img.mimeType};base64,${img.base64}`
      }
    });
  }

  return [
    { role: "system", content: "Você é um especialista em precificação, análise de catálogos e neuromarketing. Analise materiais (textos E imagens) e extraia informações detalhadas de produtos, preços e custos. Para imagens de catálogos físicos, identifique cada produto visível, leia preços nas etiquetas/tabelas, e descreva categorias. Retorne APENAS JSON válido." },
    { role: "user", content: parts }
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

    // Check subscription
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

    if (sub.expires_at && new Date(sub.expires_at as string) < new Date()) {
      return new Response(JSON.stringify({ error: "Assinatura expirada" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.rpc("increment_usage_admin", { p_user_id: user.id, p_function_type: "general" });

    // Extract all files (text + images)
    const extractedFiles = await extractFiles(supabase, filePaths);
    const imageCount = extractedFiles.filter(f => f.type === "image").length;

    console.log("[catalog-price-analyzer] user:", user.id.slice(0, 8), "files:", filePaths.length, "images:", imageCount);

    // Use vision-capable model when images are present
    const model = imageCount > 0 ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite";
    const messages = buildMessages(extractedFiles, niche || "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
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
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("Erro no processamento da IA");
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

    console.log("[catalog-price-analyzer] Success, model:", model, "tokens:", tokensUsed, "products:", analysis.products?.length || 0);

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
