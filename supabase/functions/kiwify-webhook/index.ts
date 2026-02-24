import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const KIWIFY_TOKEN = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate webhook token
    const webhookToken = req.headers.get("x-webhook-token") || req.headers.get("authorization");
    
    // Parse the body first to check for signature in body
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Kiwify sometimes sends token in body
    const tokenFromBody = body.signature || body.token;
    const providedToken = webhookToken || tokenFromBody;

    if (KIWIFY_TOKEN && providedToken !== KIWIFY_TOKEN && providedToken !== `Bearer ${KIWIFY_TOKEN}`) {
      console.error("Invalid webhook token");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse Kiwify webhook payload
    const {
      order_id,
      order_status,
      customer,
      product,
      created_at,
      Subscription // Kiwify uses capital S
    } = body;

    // Determine event type
    const status = order_status?.toLowerCase() || Subscription?.status?.toLowerCase() || 'unknown';
    const customerEmail = customer?.email?.toLowerCase().trim();
    const customerName = customer?.name || customer?.full_name;
    const orderId = order_id || body.id;
    const productId = product?.id;
    const productName = product?.name;

    if (!customerEmail) {
      console.error("No customer email provided");
      return new Response(
        JSON.stringify({ error: "Customer email required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing order ${orderId} for ${customerEmail} with status ${status}`);

    // Check for idempotency - don't process same order twice
    if (orderId) {
      const { data: existingOrder } = await supabase
        .from('kiwify_orders')
        .select('id, status')
        .eq('kiwify_order_id', orderId)
        .maybeSingle();

      if (existingOrder && existingOrder.status === status) {
        console.log(`Order ${orderId} already processed with status ${status}`);
        return new Response(
          JSON.stringify({ success: true, message: "Already processed" }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Record the order
    const { error: orderError } = await supabase
      .from('kiwify_orders')
      .upsert({
        kiwify_order_id: orderId || `manual_${Date.now()}`,
        customer_email: customerEmail,
        customer_name: customerName,
        product_id: productId,
        product_name: productName,
        status: status,
        raw_payload: body,
        processed_at: new Date().toISOString()
      }, {
        onConflict: 'kiwify_order_id'
      });

    if (orderError) {
      console.error("Error recording order:", orderError);
    }

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to lookup users" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, try to find user by direct email match
    let user = userData.users.find(u => u.email?.toLowerCase() === customerEmail);

    // If not found, check linked_emails table for associated email
    if (!user) {
      console.log(`Direct email match not found for ${customerEmail}, checking linked emails...`);
      
      const { data: linkedData, error: linkedError } = await supabase
        .from('linked_emails')
        .select('user_id')
        .eq('purchase_email', customerEmail)
        .maybeSingle();

      if (linkedError) {
        console.error("Error checking linked emails:", linkedError);
      } else if (linkedData) {
        console.log(`Found linked email for user_id: ${linkedData.user_id}`);
        user = userData.users.find(u => u.id === linkedData.user_id);
      }
    }

    if (!user) {
      console.log(`User ${customerEmail} not found - they need to sign up first or admin needs to link email`);
      // We still recorded the order, so when they sign up or admin links the email, we can activate
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Order recorded. User needs to sign up with this email or admin can link it to an existing account.",
          email: customerEmail 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different statuses
    if (status === 'paid' || status === 'approved' || status === 'active') {
      // Calculate expiration date (1 year from now)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Update or create subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: 'pro',
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          kiwify_order_id: orderId,
          payment_source: 'kiwify'
        }, {
          onConflict: 'user_id'
        });

      if (subError) {
        console.error("Error updating subscription:", subError);
        return new Response(
          JSON.stringify({ error: "Failed to update subscription" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Subscription activated for ${customerEmail} until ${expiresAt.toISOString()}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Subscription activated",
          expires_at: expiresAt.toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (status === 'refunded' || status === 'chargeback' || status === 'canceled') {
      // Revoke access
      const { error: revokeError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          plan: 'free'
        })
        .eq('user_id', user.id);

      if (revokeError) {
        console.error("Error revoking subscription:", revokeError);
      }

      console.log(`Subscription revoked for ${customerEmail} due to ${status}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Subscription revoked"
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Status ${status} acknowledged`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
