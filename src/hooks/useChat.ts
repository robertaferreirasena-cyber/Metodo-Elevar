import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { buildOptimizedContext, type Message } from "@/lib/context-optimizer";
import { useChatSessionPersistence, type ChatSessionState } from "./useSessionPersistence";
import { useThrottle } from "./useThrottledChat";
import { getCachedResponse, cacheResponse, isCacheable } from "@/lib/response-cache";

export type ChatMode = "private" | "group";

export type { Message };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-strategist`;

// Session keys for different chat contexts
const getSessionKey = (mode: ChatMode) => `session_chat_${mode}`;

export function useChat(initialMode: ChatMode = "private") {
  const mode = useRef<ChatMode>(initialMode);
  const { user } = useAuth();
  const sessionKey = getSessionKey(initialMode);
  
  // Use session persistence for messages
  const [sessionState, setSessionState, clearSession, hasRestoredSession] = useChatSessionPersistence(sessionKey);
  
  const [messages, setMessages] = useState<Message[]>(sessionState.messages);
  const [isLoading, setIsLoading] = useState(false);
  const conversationIdRef = useRef<string | null>(sessionState.conversationId);
  const { canSend, getRemainingTime } = useThrottle();
  const lastSendTimeRef = useRef<number>(0);
  
  // Sync messages to session storage
  useEffect(() => {
    setSessionState({
      messages,
      conversationId: conversationIdRef.current,
    });
  }, [messages, setSessionState]);

  const createConversation = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          type: "strategy",
          title: null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const saveMessage = async (
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role,
          content,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  };

  const updateMessage = async (messageId: string, content: string) => {
    try {
      await supabase
        .from("messages")
        .update({ content })
        .eq("id", messageId);
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const updateConversationTitle = async (conversationId: string, userMessage: string) => {
    // Generate title from first user message (first 50 chars)
    const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : "");
    
    try {
      await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error updating conversation title:", error);
    }
  };

  const sendMessage = useCallback(async (input: string) => {
    // Throttle check - 3 seconds between messages
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTimeRef.current;
    const THROTTLE_MS = 3000;
    
    if (timeSinceLastSend < THROTTLE_MS && lastSendTimeRef.current !== 0) {
      const remaining = Math.ceil((THROTTLE_MS - timeSinceLastSend) / 1000);
      toast.info(`Aguarde ${remaining}s para enviar outra mensagem`);
      return;
    }
    
    lastSendTimeRef.current = now;
    
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Check cache for common queries
    const cachedResponse = getCachedResponse(input);
    if (cachedResponse) {
      console.log("[Cache] Using cached response");
      setMessages((prev) => [...prev, { role: "assistant", content: cachedResponse }]);
      setIsLoading(false);
      
      // Still save to database for history
      if (!conversationIdRef.current && user) {
        conversationIdRef.current = await createConversation();
        if (conversationIdRef.current) {
          await updateConversationTitle(conversationIdRef.current, input);
        }
      }
      if (conversationIdRef.current) {
        await saveMessage(conversationIdRef.current, "user", input);
        await saveMessage(conversationIdRef.current, "assistant", cachedResponse);
      }
      return;
    }

    let assistantSoFar = "";
    let assistantMessageId: string | null = null;
    
    // Create conversation if it doesn't exist
    if (!conversationIdRef.current && user) {
      conversationIdRef.current = await createConversation();
      if (conversationIdRef.current) {
        await updateConversationTitle(conversationIdRef.current, input);
      }
    }

    // Save user message to database
    if (conversationIdRef.current) {
      await saveMessage(conversationIdRef.current, "user", input);
    }
    
    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      // Build optimized context with sliding window (saves ~70% tokens)
      const fullMessages = [...messages, userMsg];
      const optimizedMessages = buildOptimizedContext(fullMessages);
      
      console.log(`Context optimization: ${fullMessages.length} msgs -> ${optimizedMessages.length} msgs sent`);

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: optimizedMessages, 
          mode: mode.current,
          userId: user?.id 
        }),
      });

      if (resp.status === 429) {
        toast.error("Limite de requisições excedido. Tente novamente em alguns segundos.");
        setIsLoading(false);
        return;
      }

      if (resp.status === 402) {
        toast.error("Créditos esgotados. Por favor, adicione mais créditos.");
        setIsLoading(false);
        return;
      }

      if (!resp.ok || !resp.body) {
        throw new Error("Falha ao conectar com a IA");
      }

      // Create assistant message placeholder in database
      if (conversationIdRef.current) {
        assistantMessageId = await saveMessage(conversationIdRef.current, "assistant", "");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Update assistant message in database with final content
      if (assistantMessageId && assistantSoFar) {
        await updateMessage(assistantMessageId, assistantSoFar);
      }
      
      // Cache response if it's a cacheable query
      if (isCacheable(input) && assistantSoFar) {
        cacheResponse(input, assistantSoFar);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao processar sua mensagem. Tente novamente.");
      // Remove user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, user]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
    clearSession();
  }, [clearSession]);

  const setMode = useCallback((newMode: ChatMode) => {
    mode.current = newMode;
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      conversationIdRef.current = conversationId;
      setMessages((data || []).map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      })));
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }, []);

  return { 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages, 
    loadConversation, 
    conversationId: conversationIdRef.current, 
    setMode, 
    currentMode: mode.current,
    hasRestoredSession,
  };
}
