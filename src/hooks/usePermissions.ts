import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';

export type ModuleKey = 
  | 'module_private'
  | 'module_group'
  | 'module_sequences'
  | 'module_persona'
  | 'module_ideas'
  | 'module_favorites'
  | 'module_history'
  | 'module_community'
  | 'module_photoboss'
  | 'module_conversation_analysis'
  | 'module_traffic_ads';

interface UserPermissions {
  module_private: boolean;
  module_group: boolean;
  module_sequences: boolean;
  module_persona: boolean;
  module_ideas: boolean;
  module_favorites: boolean;
  module_history: boolean;
  module_community: boolean;
  module_photoboss: boolean;
  module_conversation_analysis: boolean;
  module_traffic_ads: boolean;
  custom_daily_limit: number | null;
  custom_monthly_limit: number | null;
  custom_persona_limit: number | null;
  custom_sequence_limit: number | null;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  module_private: true,
  module_group: true,
  module_sequences: true,
  module_persona: true,
  module_ideas: true,
  module_favorites: true,
  module_history: true,
  module_community: true,
  module_photoboss: true,
  module_conversation_analysis: true,
  module_traffic_ads: true,
  custom_daily_limit: null,
  custom_monthly_limit: null,
  custom_persona_limit: null,
  custom_sequence_limit: null,
};

export function usePermissions() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPermissions = async () => {
      if (!user) {
        setPermissions(DEFAULT_PERMISSIONS);
        setLoading(false);
        return;
      }

      // Admins have all permissions
      if (isAdmin) {
        setPermissions(DEFAULT_PERMISSIONS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_feature_permissions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error('Error fetching permissions:', error);
          // Fall back to defaults if error
          setPermissions(DEFAULT_PERMISSIONS);
        } else if (data) {
          // Merge with defaults (null values from DB mean "use default" = true)
          setPermissions({
            module_private: data.module_private ?? true,
            module_group: data.module_group ?? true,
            module_sequences: data.module_sequences ?? true,
            module_persona: data.module_persona ?? true,
            module_ideas: data.module_ideas ?? true,
            module_favorites: data.module_favorites ?? true,
            module_history: data.module_history ?? true,
            module_community: data.module_community ?? true,
            module_photoboss: data.module_photoboss ?? true,
            module_conversation_analysis: data.module_conversation_analysis ?? true,
            custom_daily_limit: data.custom_daily_limit,
            custom_monthly_limit: data.custom_monthly_limit,
            custom_persona_limit: data.custom_persona_limit,
            custom_sequence_limit: data.custom_sequence_limit,
          });
        } else {
          // No custom permissions set - use defaults (all enabled)
          setPermissions(DEFAULT_PERMISSIONS);
        }
      } catch (err) {
        console.error('Error in permissions check:', err);
        if (isMounted) {
          setPermissions(DEFAULT_PERMISSIONS);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (!authLoading && !adminLoading) {
      fetchPermissions();
    }

    return () => {
      isMounted = false;
    };
  }, [user, isAdmin, authLoading, adminLoading]);

  const hasModuleAccess = (module: ModuleKey): boolean => {
    // Admins always have access
    if (isAdmin) return true;
    return permissions[module] ?? true;
  };

  const getCustomLimit = (type: 'daily' | 'monthly' | 'persona' | 'sequence'): number | null => {
    switch (type) {
      case 'daily':
        return permissions.custom_daily_limit;
      case 'monthly':
        return permissions.custom_monthly_limit;
      case 'persona':
        return permissions.custom_persona_limit;
      case 'sequence':
        return permissions.custom_sequence_limit;
      default:
        return null;
    }
  };

  return {
    permissions,
    loading: loading || authLoading || adminLoading,
    hasModuleAccess,
    getCustomLimit,
    isAdmin,
  };
}

// Map routes to their required module permission
export const ROUTE_MODULE_MAP: Record<string, ModuleKey> = {
  '/privado': 'module_private',
  '/privado/estrategias': 'module_private',
  '/privado/analise': 'module_conversation_analysis',
  '/privado/scripts': 'module_private',
  '/grupo': 'module_group',
  '/grupo/conteudo': 'module_group',
  '/grupo/sequencias': 'module_sequences',
  '/grupo/templates': 'module_group',
  '/favoritos': 'module_favorites',
  '/historico': 'module_history',
  '/ideias': 'module_ideas',
  '/persona': 'module_persona',
  '/comunidade': 'module_community',
  '/ensaio-fotografico': 'module_photoboss',
};
