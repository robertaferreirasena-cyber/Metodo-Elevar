import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UsageLimits {
  daily_requests: number;
  monthly_requests: number;
  persona_requests_month: number;
  sequence_requests_month: number;
  reset_daily_at: string;
  reset_monthly_at: string;
}

interface UsageLimitsConfig {
  daily_limit: number;
  monthly_limit: number;
  persona_limit: number;
  sequence_limit: number;
}

const DEFAULT_LIMITS: UsageLimitsConfig = {
  daily_limit: 50,
  monthly_limit: 500,
  persona_limit: 3,
  sequence_limit: 20,
};

export function useUsageLimits() {
  const { user, subscription } = useAuth();
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = useCallback(async () => {
    if (!user?.id) {
      setLimits(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching usage limits:', fetchError);
        setError(fetchError.message);
      } else if (data) {
        setLimits(data);
      } else {
        // Record not found, will be created on first use
        setLimits({
          daily_requests: 0,
          monthly_requests: 0,
          persona_requests_month: 0,
          sequence_requests_month: 0,
          reset_daily_at: new Date().toISOString().split('T')[0],
          reset_monthly_at: new Date().toISOString().slice(0, 7) + '-01',
        });
      }
    } catch (err) {
      console.error('Error in fetchLimits:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // Check if subscription is valid
  const isSubscriptionValid = useCallback(() => {
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    if (subscription.expires_at) {
      return new Date(subscription.expires_at) > new Date();
    }
    return true;
  }, [subscription]);

  // Calculate days remaining in subscription
  const getDaysRemaining = useCallback(() => {
    if (!subscription?.expires_at) return null;
    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscription?.expires_at]);

  // Check if user can make a request
  const canMakeRequest = useCallback((type: 'general' | 'persona' | 'sequence' = 'general') => {
    if (!isSubscriptionValid()) {
      return { allowed: false, reason: 'Assinatura expirada ou inativa' };
    }

    if (!limits) {
      return { allowed: true, reason: null }; // Will be checked on backend
    }

    // Check daily limit
    if (limits.daily_requests >= DEFAULT_LIMITS.daily_limit) {
      return { allowed: false, reason: `Limite diário atingido (${DEFAULT_LIMITS.daily_limit}/dia)` };
    }

    // Check monthly limit
    if (limits.monthly_requests >= DEFAULT_LIMITS.monthly_limit) {
      return { allowed: false, reason: `Limite mensal atingido (${DEFAULT_LIMITS.monthly_limit}/mês)` };
    }

    // Check specific limits
    if (type === 'persona' && limits.persona_requests_month >= DEFAULT_LIMITS.persona_limit) {
      return { allowed: false, reason: `Limite de Raio-X atingido (${DEFAULT_LIMITS.persona_limit}/mês)` };
    }

    if (type === 'sequence' && limits.sequence_requests_month >= DEFAULT_LIMITS.sequence_limit) {
      return { allowed: false, reason: `Limite de sequências atingido (${DEFAULT_LIMITS.sequence_limit}/mês)` };
    }

    return { allowed: true, reason: null };
  }, [limits, isSubscriptionValid]);

  // Get usage percentages
  const getUsagePercentages = useCallback(() => {
    if (!limits) return null;

    return {
      daily: Math.min(100, (limits.daily_requests / DEFAULT_LIMITS.daily_limit) * 100),
      monthly: Math.min(100, (limits.monthly_requests / DEFAULT_LIMITS.monthly_limit) * 100),
      persona: Math.min(100, (limits.persona_requests_month / DEFAULT_LIMITS.persona_limit) * 100),
      sequence: Math.min(100, (limits.sequence_requests_month / DEFAULT_LIMITS.sequence_limit) * 100),
    };
  }, [limits]);

  // Get time until reset
  const getTimeUntilDailyReset = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diffMs = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }, []);

  return {
    limits,
    loading,
    error,
    config: DEFAULT_LIMITS,
    isSubscriptionValid,
    canMakeRequest,
    getUsagePercentages,
    getDaysRemaining,
    getTimeUntilDailyReset,
    refetch: fetchLimits,
  };
}
