import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .rpc('is_admin', { check_user_id: caller.id });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can manage users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, userId, ...params } = await req.json();

    console.log(`Admin action: ${action} for user: ${userId}`);

    switch (action) {
      case 'block': {
        const { reason } = params;
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ 
            blocked_at: new Date().toISOString(),
            block_reason: reason || 'Bloqueado pelo administrador',
            status: 'blocked'
          })
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Usuário bloqueado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unblock': {
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ 
            blocked_at: null,
            block_reason: null,
            status: 'active'
          })
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Usuário desbloqueado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'soft_delete': {
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ 
            is_soft_deleted: true,
            deleted_at: new Date().toISOString(),
            status: 'deleted'
          })
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Usuário desativado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'restore': {
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ 
            is_soft_deleted: false,
            deleted_at: null,
            status: 'active'
          })
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Usuário restaurado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'hard_delete': {
        // Delete user from auth (cascades to other tables)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Usuário excluído permanentemente' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_subscription': {
        const { plan, status, expiresAt } = params;
        const updateData: Record<string, any> = {};
        if (plan) updateData.plan = plan;
        if (status) updateData.status = status;
        if (expiresAt) updateData.expires_at = expiresAt;

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Assinatura atualizada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_profile': {
        const { fullName, email } = params;
        const updateData: Record<string, any> = {};
        if (fullName) updateData.full_name = fullName;
        if (email) updateData.email = email;

        const { error } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Perfil atualizado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_permissions': {
        const { permissions } = params;
        
        // Upsert permissions
        const { error } = await supabaseAdmin
          .from('user_feature_permissions')
          .upsert({
            user_id: userId,
            ...permissions
          }, { onConflict: 'user_id' });

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Permissões atualizadas' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_permissions': {
        const { data, error } = await supabaseAdmin
          .from('user_feature_permissions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, permissions: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add_tag': {
        const { tagId } = params;
        const { error } = await supabaseAdmin
          .from('user_tag_assignments')
          .insert({ user_id: userId, tag_id: tagId });

        if (error && !error.message.includes('duplicate')) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Tag adicionada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'remove_tag': {
        const { tagId } = params;
        const { error } = await supabaseAdmin
          .from('user_tag_assignments')
          .delete()
          .eq('user_id', userId)
          .eq('tag_id', tagId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Tag removida' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_user_tags': {
        const { data, error } = await supabaseAdmin
          .from('user_tag_assignments')
          .select('tag_id, user_tags(id, name, color)')
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, tags: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_all_tags': {
        const { data, error } = await supabaseAdmin
          .from('user_tags')
          .select('*')
          .order('name');

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, tags: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_tag': {
        const { name, color } = params;
        const { data, error } = await supabaseAdmin
          .from('user_tags')
          .insert({ name, color: color || '#6366f1' })
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, tag: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'link_email': {
        const { purchaseEmail, notes } = params;
        
        // Check if email is already linked
        const { data: existing } = await supabaseAdmin
          .from('linked_emails')
          .select('id, user_id')
          .eq('purchase_email', purchaseEmail.toLowerCase().trim())
          .maybeSingle();
        
        if (existing) {
          return new Response(
            JSON.stringify({ error: 'Este email já está vinculado a outro usuário' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Link the email
        const { error: linkError } = await supabaseAdmin
          .from('linked_emails')
          .insert({
            user_id: userId,
            purchase_email: purchaseEmail.toLowerCase().trim(),
            linked_by: caller.id,
            notes: notes || null
          });

        if (linkError) throw linkError;

        // Check if there's a paid order for this email to auto-activate subscription
        const { data: paidOrder } = await supabaseAdmin
          .from('kiwify_orders')
          .select('*')
          .eq('customer_email', purchaseEmail.toLowerCase().trim())
          .in('status', ['paid', 'approved', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let subscriptionActivated = false;
        if (paidOrder) {
          // Auto-activate subscription
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              plan: 'pro',
              status: 'active',
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              kiwify_order_id: paidOrder.kiwify_order_id,
              payment_source: 'kiwify'
            })
            .eq('user_id', userId);

          if (!subError) {
            subscriptionActivated = true;
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: subscriptionActivated 
              ? 'Email vinculado e assinatura ativada automaticamente!' 
              : 'Email vinculado com sucesso',
            subscriptionActivated,
            order: paidOrder
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unlink_email': {
        const { linkedEmailId } = params;
        const { error } = await supabaseAdmin
          .from('linked_emails')
          .delete()
          .eq('id', linkedEmailId)
          .eq('user_id', userId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Email desvinculado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_linked_emails': {
        const { data, error } = await supabaseAdmin
          .from('linked_emails')
          .select('*')
          .eq('user_id', userId)
          .order('linked_at', { ascending: false });

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, linkedEmails: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_pending_orders': {
        // Get orders that haven't been matched to any user
        const { data: allOrders, error: ordersError } = await supabaseAdmin
          .from('kiwify_orders')
          .select('customer_email, customer_name, status, created_at, kiwify_order_id')
          .in('status', ['paid', 'approved', 'active'])
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Get all linked emails
        const { data: linkedEmails } = await supabaseAdmin
          .from('linked_emails')
          .select('purchase_email');

        // Get all user emails from profiles
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('email');

        const linkedSet = new Set(linkedEmails?.map(l => l.purchase_email.toLowerCase()) || []);
        const profileSet = new Set(profiles?.map(p => p.email?.toLowerCase()).filter(Boolean) || []);

        // Filter orders that don't have a matching user
        const pendingOrders = allOrders?.filter(order => {
          const email = order.customer_email.toLowerCase();
          return !linkedSet.has(email) && !profileSet.has(email);
        }) || [];

        return new Response(
          JSON.stringify({ success: true, pendingOrders }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'provision_user': {
        const { email, fullName } = params;
        
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            email: email?.toLowerCase(),
            full_name: fullName || email,
          }, { onConflict: 'id' });

        if (profileError) throw profileError;

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const { error: subError } = await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: 'pro',
            status: 'active',
            payment_source: 'manual',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          }, { onConflict: 'user_id' });

        if (subError) throw subError;

        return new Response(
          JSON.stringify({ success: true, message: 'Usuário provisionado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_admin': {
        const { data, error } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, isAdmin: !!data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'promote_admin': {
        // Prevent duplicates with ON CONFLICT
        const { error } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error && error.message.includes('duplicate')) {
          return new Response(
            JSON.stringify({ success: true, message: 'Usuário já é administrador' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Usuário promovido a administrador' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'reset_password': {
        const defaultPassword = 'mentoragi123';
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: defaultPassword,
        });
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Senha resetada para padrão', tempPassword: defaultPassword }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'demote_admin': {
        // Prevent self-demotion
        if (userId === caller.id) {
          return new Response(
            JSON.stringify({ error: 'Você não pode remover seu próprio cargo de administrador' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Cargo de administrador removido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'confirm_email': {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: 'Email confirmado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
