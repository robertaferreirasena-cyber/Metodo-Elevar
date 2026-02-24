import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateTempPassword(length: number = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header to verify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's token to verify they're an admin
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the current user using the token directly
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !caller) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the caller is an admin using the is_admin function
    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .rpc('is_admin', { check_user_id: caller.id });

    if (adminError || !isAdmin) {
      console.error('Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Only admins can create users manually' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, fullName } = await req.json();

    if (!email || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists in profiles
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing email:', checkError);
    }

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Este email já está cadastrado no sistema' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword(10);

    console.log(`Creating user with email: ${email}, name: ${fullName}`);

    // Create user with admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      
      // Check for duplicate email
      if (createError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Este email já está cadastrado no sistema' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User created successfully with ID: ${newUser.user.id}`);

    // Wait a moment for the trigger to create the profile and subscription
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the subscription to pro with 1 year expiration and manual source
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan: 'pro',
        status: 'active',
        payment_source: 'manual',
        expires_at: expiresAt.toISOString()
      })
      .eq('user_id', newUser.user.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      // User was created, but subscription update failed
      // We should still return success with a warning
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: 'User created but subscription update failed. Please update manually.',
          user: {
            id: newUser.user.id,
            email: newUser.user.email,
            tempPassword
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Subscription updated to pro for user: ${newUser.user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          fullName,
          tempPassword
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
