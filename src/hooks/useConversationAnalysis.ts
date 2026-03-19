import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { buildOptimizedContext, type Message } from "@/lib/context-optimizer";
import { useChatSessionPersistence } from "./useSessionPersistence";
import { useThrottle } from "./useThrottledChat";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conversation-analyzer`;
const SESSION_KEY = "session_conversation_analysis";

export function useConversationAnalysis() {
  const { user } = useAuth();
  const [sessionState, setSessionState, clearSession, hasRestoredSession] = useChatSessionPersistence(SESSION_KEY);

  const [messages, setMessages] = useState<Message[]>(sessionState.messages);
  const [isLoading, setIsLoading] = useState(false);
  const conversationIdRef = useRef<string | null>(sessionState.conversationId);
  const { canSend, getRemainingTime } = useThrottle();

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
    clearSession();
  }, [clearSession]);

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      const loaded: Message[] = data.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setMessages(loaded);
      conversationIdRef.current = conversationId;
    }
  }, [user]);

  const sendMessage = useCallback(async (input: string) => {
    if (!user || !input.trim() || isLoading) return;

    if (!canSend()) {
      const remaining = getRemainingTime();
      toast.error(`Aguarde ${remaining}s antes de enviar outra mensagem`);
      return;
    }

    const userMsg: Message = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    try {
      let convId = conversationIdRef.current;
      if (!convId) {
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, type: "analysis", title: input.slice(0, 60) })
          .select()
          .single();
        if (conv) {
          convId = conv.id;
          conversationIdRef.current = convId;
        }
      }

      if (convId) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "user",
          content: input,
        });
      }

      const optimized = buildOptimizedContext(updated);

      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: optimized }),
      });

      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const data = await resp.json();
      const reply = data.reply || data.content || "";

      const assistantMsg: Message = { role: "assistant", content: reply };
      const final = [...updated, assistantMsg];
      setMessages(final);

      if (convId) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: reply,
        });
      }

      setSessionState({ messages: final, conversationId: convId });
    } catch (err: any) {
      toast.error(err.message || "Erro ao analisar conversa");
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  }, [user, messages, isLoading, canSend, getRemainingTime, setSessionState]);

  return { messages, isLoading, sendMessage, clearMessages, loadConversation, hasRestoredSession };
}
