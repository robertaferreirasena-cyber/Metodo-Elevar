import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface UserToImport {
  email: string;
  fullName: string;
  kiwifyOrderId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Auth: check Authorization header OR x-admin-key matching service role
    const authHeader = req.headers.get('Authorization');
    
    // Parse body first
    const body = await req.json() as { users: UserToImport[], adminKey?: string };
    const { users, adminKey } = body;
    
    if (adminKey === supabaseServiceKey) {
      console.log('Auth via admin key');
    } else if (authHeader) {
      const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data: { user: caller } } = await supabaseClient.auth.getUser();
      if (!caller) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { check_user_id: caller.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Only admins can bulk import' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      return new Response(JSON.stringify({ error: 'No authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const results: any[] = [];
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    for (const u of users) {
      const email = u.email.toLowerCase().trim();
      try {
        // Check if email already exists
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existing) {
          results.push({ email, status: 'skipped', reason: 'already_exists' });
          continue;
        }

        const tempPassword = generateTempPassword(10);

        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: u.fullName }
        });

        if (createError) {
          if (createError.message.includes('already been registered')) {
            results.push({ email, status: 'skipped', reason: 'already_registered' });
            continue;
          }
          results.push({ email, status: 'error', reason: createError.message });
          continue;
        }

        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 800));

        // Update subscription to pro
        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan: 'pro',
            status: 'active',
            payment_source: 'kiwify',
            kiwify_order_id: u.kiwifyOrderId,
            expires_at: expiresAt.toISOString()
          })
          .eq('user_id', newUser.user.id);

        // Register kiwify order
        await supabaseAdmin
          .from('kiwify_orders')
          .upsert({
            kiwify_order_id: u.kiwifyOrderId,
            customer_email: email,
            customer_name: u.fullName,
            status: 'paid',
            product_name: 'WhatsPro Diamond',
            processed_at: new Date().toISOString()
          }, { onConflict: 'kiwify_order_id' });

        results.push({
          email,
          status: 'created',
          userId: newUser.user.id,
          tempPassword,
          fullName: u.fullName
        });

      } catch (err: any) {
        results.push({ email, status: 'error', reason: err.message });
      }
    }

    const created = results.filter(r => r.status === 'created').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;

    return new Response(JSON.stringify({
      summary: { total: users.length, created, skipped, errors },
      results
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Bulk import error:', error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
