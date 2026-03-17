import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStatus {
  completed: boolean;
  current_step: number;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchStatus(user.id);
  }, [user]);

  const fetchStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('onboarding_status')
        .select('completed, current_step')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStatus(data);
      } else {
        // Auto-create for existing users who don't have a row yet
        const { error: insertError } = await supabase
          .from('onboarding_status')
          .insert({ user_id: userId });

        if (!insertError) {
          setStatus({ completed: false, current_step: 0 });
        }
      }
    } catch (err) {
      console.error('Error fetching onboarding status:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStep = async (step: number) => {
    if (!user) return;
    const { error } = await supabase
      .from('onboarding_status')
      .update({ current_step: step })
      .eq('user_id', user.id);

    if (!error) {
      setStatus(prev => prev ? { ...prev, current_step: step } : null);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('onboarding_status')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (!error) {
      setStatus(prev => prev ? { ...prev, completed: true } : null);
    }
  };

  return {
    showOnboarding: status !== null && !status.completed,
    currentStep: status?.current_step ?? 0,
    loading,
    updateStep,
    completeOnboarding,
  };
}
