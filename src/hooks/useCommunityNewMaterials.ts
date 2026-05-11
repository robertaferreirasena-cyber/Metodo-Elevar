import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { scopedLocal } from '@/lib/userScopedKey';
import { useAuth } from '@/hooks/useAuth';

const SEEN_KEY = 'community_materials_last_seen_at';

interface MaterialLite {
  id: string;
  title: string;
  created_at: string;
}

export function useCommunityNewMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<MaterialLite[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => scopedLocal.get(SEEN_KEY));

  const fetchLatest = useCallback(async () => {
    const { data } = await supabase
      .from('community_materials')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    setMaterials((data || []) as MaterialLite[]);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchLatest();
    const channel = supabase
      .channel('community-materials-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_materials' }, () => {
        fetchLatest();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLatest]);

  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString();
    scopedLocal.set(SEEN_KEY, now);
    setLastSeenAt(now);
  }, []);

  const newMaterials = materials.filter(m => !lastSeenAt || m.created_at > lastSeenAt);

  return {
    count: newMaterials.length,
    latest: newMaterials[0] || null,
    materials,
    markAllSeen,
    refresh: fetchLatest,
  };
}
