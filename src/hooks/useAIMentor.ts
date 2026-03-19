import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MentorMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MentorConversation {
  id: string;
  persona: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor-chat`;

export function useAIMentor() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<MentorConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [persona, setPersona] = useState('mentora-gi');
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('mentor_conversations' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);
    if (data) setConversations(data as any);
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('mentor_messages' as any)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (data) setMessages((data as any).map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
    setCurrentConversationId(conversationId);
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) setPersona(conv.persona);
    setLoadingHistory(false);
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const sendMessage = useCallback(async (input: string) => {
    if (!user || !input.trim() || isStreaming) return;

    const userMsg: MentorMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);

    let convId = currentConversationId;

    try {
      // Create conversation if new
      if (!convId) {
        const { data: newConv } = await (supabase.from('mentor_conversations' as any) as any)
          .insert({ user_id: user.id, persona, title: input.slice(0, 80) })
          .select()
          .single();
        if (newConv) {
          convId = newConv.id;
          setCurrentConversationId(convId);
          setConversations(prev => [newConv as any, ...prev]);
        }
      }

      // Save user message
      if (convId) {
        await (supabase.from('mentor_messages' as any) as any)
          .insert({ conversation_id: convId, role: 'user', content: input });
      }

      // Stream AI response
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          persona,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('Stream não disponível');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (convId && assistantContent) {
        await (supabase.from('mentor_messages' as any) as any)
          .insert({ conversation_id: convId, role: 'assistant', content: assistantContent });
      }
    } catch (error: any) {
      console.error('Mentor chat error:', error);
      toast.error(error.message || 'Erro ao enviar mensagem');
      // Remove the failed user message if no response
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsStreaming(false);
    }
  }, [user, messages, isStreaming, currentConversationId, persona]);

  const deleteConversation = async (id: string) => {
    await (supabase.from('mentor_conversations' as any) as any).delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) startNewConversation();
    toast.success('Conversa excluída');
  };

  return {
    conversations,
    currentConversationId,
    messages,
    isStreaming,
    persona,
    setPersona,
    loadingHistory,
    loadMessages,
    startNewConversation,
    sendMessage,
    deleteConversation,
  };
}
