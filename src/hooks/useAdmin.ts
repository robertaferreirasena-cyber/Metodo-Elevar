import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_admin');

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        console.error('Error in admin check:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}

interface CreateManualUserParams {
  email: string;
  fullName: string;
}

interface CreateManualUserResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    tempPassword: string;
  };
  warning?: string;
}

export function useAdminData() {
  const { isAdmin } = useAdmin();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [usersWithLinkedEmails, setUsersWithLinkedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .rpc('get_all_subscriptions');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchOrders = async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('kiwify_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchPendingOrders = async () => {
    if (!isAdmin) return;

    try {
      const { data } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'get_pending_orders', userId: '' }
      });
      if (data?.pendingOrders) {
        setPendingOrders(data.pendingOrders);
      }
    } catch (err) {
      console.error('Error fetching pending orders:', err);
    }
  };

  const fetchUsersWithLinkedEmails = async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('linked_emails')
        .select('user_id');

      if (error) throw error;
      const userIds = new Set((data || []).map(d => d.user_id));
      setUsersWithLinkedEmails(userIds);
    } catch (err) {
      console.error('Error fetching linked emails:', err);
    }
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'canceled', expiresAt?: string) => {
    if (!isAdmin) return { error: 'Not authorized' };

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status,
          expires_at: expiresAt || null
        })
        .eq('user_id', userId);

      if (error) throw error;
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error updating user:', err);
      return { error: err };
    }
  };

  const createManualUser = async ({ email, fullName }: CreateManualUserParams): Promise<CreateManualUserResult> => {
    if (!isAdmin) return { success: false, error: 'Not authorized' };

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email, fullName }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        return { success: false, error: error.message };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }

      // Refresh user list after successful creation
      await fetchUsers();

      return {
        success: true,
        user: data.user,
        warning: data.warning
      };
    } catch (err: any) {
      console.error('Error creating manual user:', err);
      return { success: false, error: err.message || 'Erro ao criar usuário' };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchOrders(), fetchPendingOrders(), fetchUsersWithLinkedEmails()]);
      setLoading(false);
    };

    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  return { 
    users, 
    orders, 
    pendingOrders,
    usersWithLinkedEmails,
    loading, 
    fetchUsers, 
    fetchOrders,
    fetchPendingOrders,
    fetchUsersWithLinkedEmails,
    updateUserStatus,
    createManualUser
  };
}
