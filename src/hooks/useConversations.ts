import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ConversationType = "strategy" | "analysis";

export interface Conversation {
  id: string;
  title: string | null;
  type: ConversationType;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations((data as Conversation[]) || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createConversation = useCallback(async (type: ConversationType, title?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          type,
          title: title || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  }, [user]);

  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating conversation title:", error);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  }, []);

  const deleteAllConversations = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    
    try {
      const count = conversations.length;
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      setConversations([]);
      return count;
    } catch (error) {
      console.error("Error deleting all conversations:", error);
      return 0;
    }
  }, [user, conversations]);

  const addMessage = useCallback(async (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> => {
    try {
      const insertData = {
        conversation_id: conversationId,
        role,
        content,
        metadata: metadata || {},
      };
      
      const { data, error } = await supabase
        .from("messages")
        .insert(insertData as any)
        .select("id")
        .single();

      if (error) throw error;
      
      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data.id;
    } catch (error) {
      console.error("Error adding message:", error);
      return null;
    }
  }, []);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ content })
        .eq("id", messageId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating message:", error);
    }
  }, []);

  const getConversationMessages = useCallback(async (conversationId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as Message[]) || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    fetchConversations,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    deleteAllConversations,
    addMessage,
    updateMessage,
    getConversationMessages,
  };
}
