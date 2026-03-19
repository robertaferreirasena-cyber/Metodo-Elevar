import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
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

    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
      return new Response(JSON.stringify({ valid: false, error: "API Key inválida ou muito curta" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[manychat-validate] user:${user.id.slice(0, 8)} validating key`);

    // Call ManyChat API to validate
    const mcResponse = await fetch("https://api.manychat.com/fb/page/getInfo", {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: "application/json",
      },
    });

    if (!mcResponse.ok) {
      const errorText = await mcResponse.text();
      console.error(`[manychat-validate] ManyChat API error: ${mcResponse.status} ${errorText}`);
      return new Response(JSON.stringify({
        valid: false,
        error: mcResponse.status === 401 ? "API Key inválida ou expirada" : "Erro ao conectar com ManyChat",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mcData = await mcResponse.json();

    if (mcData.status !== "success" || !mcData.data) {
      return new Response(JSON.stringify({
        valid: false,
        error: "Resposta inesperada do ManyChat",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pageData = mcData.data;

    // Try to get subscriber count
    let subscribersCount = 0;
    try {
      const subsResp = await fetch("https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=0", {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          Accept: "application/json",
        },
      });
      // This will likely fail for subscriber_id=0 but we just want to check connectivity
      // Instead, use page data which may have subscriber info
      subscribersCount = pageData.subscribers_count || pageData.total_subscribers || 0;
    } catch {
      // Ignore subscriber count errors
    }

    return new Response(JSON.stringify({
      valid: true,
      account: {
        name: pageData.name || pageData.page_name || "Conta ManyChat",
        category: pageData.category || pageData.page_category || "N/A",
        subscribersCount,
        status: pageData.status || "active",
      },
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[manychat-validate] error:", e);
    return new Response(JSON.stringify({
      valid: false,
      error: e instanceof Error ? e.message : "Erro desconhecido",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
