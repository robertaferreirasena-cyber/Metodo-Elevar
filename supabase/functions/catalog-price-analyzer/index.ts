import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";
import * as XLSX from "https://esm.sh/xlsx@0.18.5?target=deno";
import mammoth from "https://esm.sh/mammoth@1.7.2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedFile {
  type: "text" | "image" | "pdf";
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}

async function extractFiles(supabase: any, filePaths: string[]): Promise<ExtractedFile[]> {
  const results: ExtractedFile[] = [];

  for (const path of filePaths.slice(0, 8)) {
    try {
      const { data, error } = await supabase.storage.from("product-catalogs").download(path);
      if (error || !data) {
        console.error("Download error for", path, error);
        continue;
      }

      const ext = path.split(".").pop()?.toLowerCase() || "";
      const name = path.split("/").pop() || path;
      const buffer = await data.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (["txt", "csv"].includes(ext)) {
        const text = new TextDecoder().decode(bytes);
        results.push({ type: "text", name, content: text.slice(0, 8000) });
      } else if (ext === "pdf") {
        if (bytes.length > 12 * 1024 * 1024) {
          results.push({ type: "text", name, content: `[PDF ${name} muito grande]` });
          continue;
        }
        results.push({
          type: "pdf",
          name,
          base64: bytesToBase64(bytes),
          mimeType: "application/pdf",
        });
      } else if (["xlsx", "xls"].includes(ext)) {
        try {
          const wb = XLSX.read(bytes, { type: "array" });
          let text = "";
          for (const sheetName of wb.SheetNames) {
            const sheet = wb.Sheets[sheetName];
            text += `\n=== Planilha: ${sheetName} ===\n`;
            text += XLSX.utils.sheet_to_csv(sheet);
          }
          results.push({ type: "text", name, content: text.slice(0, 12000) });
        } catch (err) {
          console.error("xlsx parse error:", err);
          results.push({ type: "text", name, content: `[Erro lendo planilha ${name}]` });
        }
      } else if (["docx"].includes(ext)) {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: buffer });
          results.push({ type: "text", name, content: (result.value || "").slice(0, 8000) });
        } catch (err) {
          console.error("docx parse error:", err);
          results.push({ type: "text", name, content: `[Erro lendo docx ${name}]` });
        }
      } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        if (bytes.length > 6 * 1024 * 1024) {
          results.push({ type: "text", name, content: `[Imagem ${name} muito grande]` });
          continue;
        }
        const mimeType =
          ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        results.push({
          type: "image",
          name,
          base64: bytesToBase64(bytes),
          mimeType,
        });
      } else {
        // unknown — try as text
        const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        const clean = text.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, " ").replace(/\s+/g, " ").trim();
        if (clean.length > 50) {
          results.push({ type: "text", name, content: clean.slice(0, 4000) });
        }
      }
    } catch (err) {
      console.error("Error processing file:", path, err);
    }
  }

  return results;
}

function buildMessages(files: ExtractedFile[], niche: string) {
  const parts: any[] = [];

  const textFiles = files.filter(f => f.type === "text");
  const imageFiles = files.filter(f => f.type === "image");
  const pdfFiles = files.filter(f => f.type === "pdf");

  let textContent = "";
  if (textFiles.length > 0) {
    textContent = textFiles.map(f => `[${f.name}]:\n${f.content}`).join("\n\n").slice(0, 16000);
  }

  parts.push({
    type: "text",
    text: `Você é um especialista em precificação e análise de catálogos para pequenas empresas brasileiras (lojistas, esteticistas, cabeleireiras, artesãos, prestadoras de serviço).

Analise TODOS os materiais enviados e extraia TODOS os produtos/serviços mencionados (sem limite — se houver 30, 50, 100 produtos, extraia todos).

Para cada produto retorne:
- name (string, obrigatório)
- sku (string, opcional)
- category (string — ex: "Esmalte", "Tintura", "Roupa", "Acessório", "Cosmético")
- detected_price (number ou null) — preço encontrado no material
- suggested_price (number ou null) — preço sugerido com base no nicho "${niche || 'geral'}"
- estimated_cost (number ou null) — custo unitário (compra/produção)
- cost_source ("detected" se veio explícito no material, "estimated" se você inferiu)
- freight_estimate (number, OBRIGATÓRIO para produto físico — nunca null/0). Se não mencionado, estime: 5% do preço sugerido com piso de R$ 2,00 (produtos pequenos) ou R$ 8–15 (eletrônicos/grandes). Use 0 SOMENTE para serviços/digitais.
- freight_source ("detected" ou "estimated")
- packaging_estimate (number, OBRIGATÓRIO para produto físico — nunca null/0). Padrão R$ 1–3 (sacola/caixinha simples), R$ 4–8 (caixa + papel de seda + adesivos), 0 SOMENTE para digital/serviço.
- margin_percent (number) — margem percentual sobre o preço sugerido
- expected_monthly_units (number ou null) — estimativa razoável de quantas unidades/mês esse tipo de produto vende em pequeno negócio (5–100)
- notes (string opcional) — observação curta

${textContent ? `\nCONTEÚDO TEXTUAL DOS MATERIAIS:\n${textContent}\n` : ""}
${pdfFiles.length > 0 ? `\n${pdfFiles.length} PDF(s) ANEXADO(S) — leia cada página e extraia produtos das tabelas/listas de preços.\n` : ""}
${imageFiles.length > 0 ? `\n${imageFiles.length} IMAGEM(NS) ANEXADA(S) — analise visualmente: nomes, preços em etiquetas/tabelas, descrições.\n` : ""}

Retorne APENAS JSON válido (sem markdown, sem texto extra):
{
  "products": [{...}, {...}],
  "insights": ["insight curto 1", "insight curto 2"],
  "pricing_recommendations": ["recomendação curta 1", "recomendação curta 2"]
}`
  });

  for (const pdf of pdfFiles.slice(0, 4)) {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${pdf.mimeType};base64,${pdf.base64}` },
    });
  }

  for (const img of imageFiles.slice(0, 6)) {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    });
  }

  return [
    {
      role: "system",
      content:
        "Você é um analista de catálogos e precificação. Extraia TODOS os produtos visíveis (nada de limite arbitrário). Sempre preencha frete e embalagem (estimando se necessário). Retorne JSON válido apenas."
    },
    { role: "user", content: parts },
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

    const extractedFiles = await extractFiles(supabase, filePaths);
    const imageCount = extractedFiles.filter(f => f.type === "image").length;
    const pdfCount = extractedFiles.filter(f => f.type === "pdf").length;

    console.log(
      "[catalog-price-analyzer] user:", user.id.slice(0, 8),
      "files:", filePaths.length, "images:", imageCount, "pdfs:", pdfCount
    );

    // Always use vision-capable model when PDFs/images present
    const model = (imageCount > 0 || pdfCount > 0) ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite";
    const messages = buildMessages(extractedFiles, niche || "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 16000,
        messages,
        temperature: 0.4,
        response_format: { type: "json_object" },
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
      p_user_id: user.id, p_feature: "catalog-analyzer", p_tokens: tokensUsed,
    });

    console.log(
      "[catalog-price-analyzer] OK model:", model, "tokens:", tokensUsed,
      "products:", analysis.products?.length || 0
    );

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
