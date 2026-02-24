import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendViaUazap(
  content: string,
  groupId: string,
  uazapiUrl: string,
  uazapiToken: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const phone = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    const response = await fetch(`${uazapiUrl}/message/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${uazapiToken}`,
      },
      body: JSON.stringify({ phone, message: content }),
    });

    if (response.ok) {
      return { ok: true };
    }
    const errorText = await response.text().catch(() => "Unknown error");
    return { ok: false, error: `UAZap retornou status ${response.status}: ${errorText.substring(0, 200)}` };
  } catch (err) {
    return { ok: false, error: `Erro ao enviar via UAZap: ${(err as Error).message}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const uazapiUrl = Deno.env.get("UAZAPI_URL");
    const uazapiToken = Deno.env.get("UAZAPI_TOKEN");
    const hasUazapi = !!(uazapiUrl && uazapiToken);

    // Fetch pending posts that are due
    const { data: pendingPosts, error: fetchError } = await supabase
      .from("sequence_posts")
      .select(`
        id, content, post_order, timing, objective, scheduled_at, sequence_id,
        sequences!inner (id, title, webhook_url, whatsapp_group_id, whatsapp_group_name, product, goal, send_mode)
      `)
      .eq("send_status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching pending posts:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingPosts || pendingPosts.length === 0) {
      return new Response(JSON.stringify({ message: "No pending posts", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${pendingPosts.length} pending posts to send`);

    let sent = 0;
    let failed = 0;

    for (const post of pendingPosts) {
      const sequence = post.sequences as any;
      const sendMode = sequence?.send_mode || "uazapi";
      const webhookUrl = sequence?.webhook_url;
      const groupId = sequence?.whatsapp_group_id || "";

      // Decide send method
      if (sendMode === "webhook" && webhookUrl) {
        // Mode: Webhook (existing logic)
        try {
          const payload = {
            content: post.content,
            group_id: groupId,
            group_name: sequence.whatsapp_group_name || "",
            post_order: post.post_order,
            sequence_title: sequence.title,
            product: sequence.product,
            goal: sequence.goal,
            timing: post.timing,
            objective: post.objective,
            scheduled_at: post.scheduled_at,
          };

          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            await supabase
              .from("sequence_posts")
              .update({ send_status: "sent", sent_at: new Date().toISOString(), send_error: null })
              .eq("id", post.id);
            sent++;
          } else {
            const errorText = await response.text().catch(() => "Unknown error");
            await supabase
              .from("sequence_posts")
              .update({ send_status: "failed", send_error: `Webhook retornou status ${response.status}: ${errorText.substring(0, 200)}` })
              .eq("id", post.id);
            failed++;
          }
        } catch (err) {
          await supabase
            .from("sequence_posts")
            .update({ send_status: "failed", send_error: `Erro ao enviar: ${(err as Error).message}` })
            .eq("id", post.id);
          failed++;
        }
      } else if (sendMode === "uazapi" && hasUazapi && groupId) {
        // Mode: UAZap direct API
        const result = await sendViaUazap(post.content, groupId, uazapiUrl!, uazapiToken!);
        if (result.ok) {
          await supabase
            .from("sequence_posts")
            .update({ send_status: "sent", sent_at: new Date().toISOString(), send_error: null })
            .eq("id", post.id);
          sent++;
        } else {
          await supabase
            .from("sequence_posts")
            .update({ send_status: "failed", send_error: result.error })
            .eq("id", post.id);
          failed++;
        }
      } else {
        // No valid send method configured
        let errorMsg = "Nenhum método de envio configurado. ";
        if (sendMode === "uazapi" && !hasUazapi) {
          errorMsg += "Configure UAZAPI_TOKEN e UAZAPI_URL no backend.";
        } else if (sendMode === "uazapi" && !groupId) {
          errorMsg += "Informe o ID do grupo WhatsApp na configuração da sequência.";
        } else if (sendMode === "webhook" && !webhookUrl) {
          errorMsg += "Configure a URL do webhook na sequência.";
        }
        await supabase
          .from("sequence_posts")
          .update({ send_status: "failed", send_error: errorMsg })
          .eq("id", post.id);
        failed++;
      }
    }

    console.log(`Processed: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ processed: pendingPosts.length, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
