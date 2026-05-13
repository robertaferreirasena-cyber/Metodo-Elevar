import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MaterialLite {
  id: string;
  title: string;
  created_at: string;
}

export function useCommunityNewMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<MaterialLite[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLatest = useCallback(async () => {
    const { data } = await supabase
      .from('community_materials')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    setMaterials((data || []) as MaterialLite[]);
  }, []);

  const fetchLastSeen = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('community_last_seen_at')
      .eq('id', user.id)
      .single();
    
    if (data && !error) {
      setLastSeenAt(data.community_last_seen_at);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    fetchLatest();
    fetchLastSeen();

    const channel = supabase
      .channel('community-materials-watch')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'community_materials' 
      }, (payload) => {
        const newMaterial = payload.new as MaterialLite;
        setMaterials(prev => [newMaterial, ...prev].slice(0, 20));
        
        // Show real-time toast
        toast.info(`Novo conteúdo na comunidade: ${newMaterial.title}`, {
          description: 'Acesse a aba de Materiais para conferir!',
          action: {
            label: 'Ver agora',
            onClick: () => {
              // We could navigate here, but just showing the info is good
            }
          }
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_materials'
      }, () => {
        // Fallback for updates/deletes
        fetchLatest();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLatest, fetchLastSeen]);

  const markAllSeen = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('profiles')
      .update({ community_last_seen_at: now })
      .eq('id', user.id);

    if (!error) {
      setLastSeenAt(now);
    }
  }, [user]);

  const newMaterials = materials.filter(m => !lastSeenAt || m.created_at > lastSeenAt);

  return {
    count: newMaterials.length,
    latest: newMaterials[0] || null,
    materials,
    loading,
    markAllSeen,
    refresh: fetchLatest,
  };
}
