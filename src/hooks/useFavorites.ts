import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  content: string;
  type: "strategy" | "analysis";
  title: string | null;
  message_id: string | null;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites((data as Favorite[]) || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addFavorite = useCallback(async (
    content: string,
    type: "strategy" | "analysis",
    title?: string,
    messageId?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error("Você precisa estar logado para favoritar");
      return false;
    }

    try {
      const insertData = {
        user_id: user.id,
        content,
        type,
        title: title || null,
        message_id: messageId || null,
      };

      const { error } = await supabase
        .from("favorites")
        .insert(insertData as any);

      if (error) throw error;
      
      toast.success("Adicionado aos favoritos!");
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error("Error adding favorite:", error);
      toast.error("Erro ao adicionar favorito");
      return false;
    }
  }, [user, fetchFavorites]);

  const removeFavorite = useCallback(async (favoriteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;
      
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      toast.success("Removido dos favoritos");
      return true;
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Erro ao remover favorito");
      return false;
    }
  }, []);

  const isFavorited = useCallback((messageId: string): boolean => {
    return favorites.some(f => f.message_id === messageId);
  }, [favorites]);

  const getFavoriteByMessageId = useCallback((messageId: string): Favorite | undefined => {
    return favorites.find(f => f.message_id === messageId);
  }, [favorites]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    isFavorited,
    getFavoriteByMessageId,
  };
}
