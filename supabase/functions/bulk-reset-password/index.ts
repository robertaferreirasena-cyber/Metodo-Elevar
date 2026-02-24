import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsError } =
      await callerClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub as string;
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", {
      check_user_id: userId,
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { emails, newPassword } = await req.json();

    if (!emails?.length || !newPassword) {
      return new Response(
        JSON.stringify({ error: "emails and newPassword required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: Array<{
      email: string;
      status: string;
      error?: string;
    }> = [];
    let success = 0;
    let errors = 0;

    for (const email of emails) {
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        if (!profile) {
          results.push({ email, status: "not_found", error: "User not found" });
          errors++;
          continue;
        }

        const { error: updateError } =
          await supabaseAdmin.auth.admin.updateUserById(profile.id, {
            password: newPassword,
          });

        if (updateError) {
          results.push({ email, status: "error", error: updateError.message });
          errors++;
        } else {
          results.push({ email, status: "updated" });
          success++;
        }
      } catch (err: any) {
        results.push({ email, status: "error", error: err.message });
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        summary: { total: emails.length, success, errors },
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
