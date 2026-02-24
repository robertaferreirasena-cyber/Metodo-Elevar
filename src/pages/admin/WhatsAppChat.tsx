import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatList, type ChatItem } from "@/components/admin/chat/ChatList";
import { ChatWindow, type MessageItem } from "@/components/admin/chat/ChatWindow";
import { CampaignDrawer } from "@/components/admin/chat/CampaignDrawer";
import { ContactsDialog } from "@/components/admin/chat/ContactsDialog";
import { CreateGroupDialog } from "@/components/admin/chat/CreateGroupDialog";
import { AiAssistantPanel } from "@/components/admin/chat/AiAssistantPanel";
import { ContactDetailPanel } from "@/components/admin/chat/ContactDetailPanel";
import { InstanceSettingsDialog } from "@/components/admin/chat/InstanceSettingsDialog";
import { ScriptsPanel } from "@/components/admin/chat/ScriptsPanel";
import { TemplatesPanel } from "@/components/admin/chat/TemplatesPanel";
import { RaioXPanel } from "@/components/admin/chat/RaioXPanel";
import { ActiveAgentPanel } from "@/components/admin/chat/ActiveAgentPanel";
import { FollowupAlertsBanner } from "@/components/admin/chat/FollowupAlertsBanner";
import type { AiToolAction } from "@/components/admin/chat/AiToolbar";
import type { LeadTag } from "@/components/admin/chat/LeadTagBadge";
import { MessageSquare, Volume2, VolumeX, Megaphone, UserPlus, UsersRound, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Instance {
  id: string;
  name: string;
  instance_token: string;
  status: string | null;
}

interface ContactItem {
  id: string;
  name: string;
  phone: string;
  profilePic?: string;
}

async function callUazapi(action: string, instanceToken: string, extraData?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('uazapi-manager', {
    body: { action, instanceToken, extraData },
  });
  if (error) throw error;
  return data;
}

type SidePanel = 'ai' | 'scripts' | 'templates' | 'raio-x' | 'detail' | 'active-agent' | null;

export default function WhatsAppChat() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [muted, setMuted] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Copilot state
  const [copilotSuggestion, setCopilotSuggestion] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const copilotAbortRef = useRef<AbortController | null>(null);

  // Contacts & Group
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Instance settings
  const [instanceSettingsOpen, setInstanceSettingsOpen] = useState(false);

  // Side panel state
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [aiPanel, setAiPanel] = useState<{ title: string; content: string; loading: boolean }>({
    title: '', content: '', loading: false,
  });

  // Contact tags
  const [contactTags, setContactTags] = useState<Record<string, LeadTag>>({});

  // Last message timestamp for agent trigger
  const [lastMsgTimestamp, setLastMsgTimestamp] = useState(0);

  const getToken = useCallback(() => {
    return instances.find(i => i.id === selectedInstance)?.instance_token || "";
  }, [instances, selectedInstance]);

  // Init audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Load instances
  useEffect(() => {
    supabase.from('whatsapp_instances').select('*').then(({ data }) => {
      if (data) {
        setInstances(data);
        if (data.length === 1) setSelectedInstance(data[0].id);
      }
    });
  }, []);

  // Load contact tags
  useEffect(() => {
    if (!selectedInstance) return;
    supabase.from('whatsapp_contact_tags' as any)
      .select('contact_phone, tag')
      .eq('instance_id', selectedInstance)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, LeadTag> = {};
          (data as any[]).forEach((d: any) => { map[d.contact_phone] = d.tag as LeadTag; });
          setContactTags(map);
        }
      });
  }, [selectedInstance]);

  const handleTagChange = (phone: string, newTag: LeadTag) => {
    setContactTags(prev => ({ ...prev, [phone]: newTag }));
  };
  useEffect(() => {
    if (!selectedInstance) return;
    const token = getToken();
    if (!token) return;
    setLoadingChats(true);
    setChats([]);
    setSelectedChat(null);
    setMessages([]);
    callUazapi('getChats', token)
      .then((data: unknown) => {
        const response = data as Record<string, unknown>;
        const rawChats = Array.isArray(data) ? data : (response?.chats as unknown[]) || [];
        const mapped: ChatItem[] = rawChats.map((c: unknown) => {
          const chat = c as Record<string, unknown>;
          const phone = (chat.wa_chatid as string) || (chat.phone as string) || (chat.id as string) || '';
          return {
            id: phone, phone,
            name: (chat.wa_name as string) || (chat.name as string) || (chat.wa_contactName as string) || phone,
            lastMessage: (chat.wa_lastMessage as string) || (chat.lastMessage as string) || '',
            lastMessageTime: chat.wa_lastMsgTimestamp ? new Date((chat.wa_lastMsgTimestamp as number) * 1000).toISOString() : (chat.timestamp ? new Date((chat.timestamp as number) * 1000).toISOString() : undefined),
            unreadCount: (chat.wa_unreadCount as number) || (chat.unreadCount as number) || 0,
            isGroup: (chat.wa_isGroup as boolean) || (chat.isGroup as boolean) || false,
          };
        });
        setChats(mapped);
      })
      .catch(() => toast.error('Erro ao buscar conversas'))
      .finally(() => setLoadingChats(false));
  }, [selectedInstance, getToken]);

  // Load messages
  useEffect(() => {
    if (!selectedChat || !selectedInstance) return;
    const token = getToken();
    if (!token) return;
    setLoadingMessages(true);
    callUazapi('getMessages', token, { phone: selectedChat, count: 50 })
      .then((data: unknown) => {
        const response = data as Record<string, unknown>;
        const rawMsgs = Array.isArray(data) ? data : (response?.messages as unknown[]) || [];
        const mapped: MessageItem[] = rawMsgs.map((m: unknown, i: number) => {
          const msg = m as Record<string, unknown>;
          return {
            id: (msg.messageid as string) || (msg.id as string) || String(i),
            body: (msg.body as string) || '',
            isFromMe: (msg.fromMe as boolean) || false,
            timestamp: msg.timestamp ? new Date((msg.timestamp as number) * 1000).toISOString() : new Date().toISOString(),
            messageType: (msg.type as string) || 'text',
            mediaUrl: (msg.mediaUrl as string) || undefined,
          };
        });
        setMessages(mapped.reverse());
      })
      .catch(() => toast.error('Erro ao buscar mensagens'))
      .finally(() => setLoadingMessages(false));
  }, [selectedChat, selectedInstance, getToken]);

  // Realtime
  useEffect(() => {
    if (!selectedInstance) return;
    const channel = supabase
      .channel('whatsapp-chat-realtime')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'whatsapp_messages',
        filter: `instance_id=eq.${selectedInstance}`,
      }, (payload) => {
        const newMsg = payload.new as Record<string, unknown>;
        const phone = (newMsg.is_from_me ? newMsg.to_number : newMsg.from_number) as string;
        if (!newMsg.is_from_me && !muted) audioRef.current?.play().catch(() => {});
        if (phone === selectedChat) {
          const mappedMsg = {
            id: newMsg.id as string, body: (newMsg.body as string) || '',
            isFromMe: (newMsg.is_from_me as boolean) || false,
            timestamp: (newMsg.created_at as string) || new Date().toISOString(),
            messageType: (newMsg.message_type as string) || 'text',
            mediaUrl: (newMsg.media_url as string) || undefined,
          };
          setMessages(prev => [...prev, mappedMsg]);
          setLastMsgTimestamp(Date.now());
          // Trigger copilot for incoming messages
          if (!newMsg.is_from_me && mappedMsg.body) {
            triggerCopilot(mappedMsg.body);
          }
        } else {
          setChats(prev => prev.map(c =>
            c.phone === phone ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: (newMsg.body as string) || '📎 Mídia' } : c
          ));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedInstance, selectedChat, muted]);

  // Copilot: generate suggestion from last messages
  const triggerCopilot = useCallback(async (lastMsg: string) => {
    copilotAbortRef.current?.abort();
    const controller = new AbortController();
    copilotAbortRef.current = controller;
    setCopilotLoading(true);
    setCopilotSuggestion('');
    try {
      const chatContext = messages.slice(-10).map(m =>
        `${m.isFromMe ? 'Vendedor' : 'Cliente'}: ${m.body}`
      ).join('\n');
      const { data: { user } } = await supabase.auth.getUser();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-strategist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Você é um copiloto de vendas. Baseado na conversa abaixo, sugira UMA resposta curta e natural (máx 3 linhas) para o vendedor enviar. Responda APENAS com o texto da sugestão, sem explicações:\n\nConversa:\n${chatContext}\nCliente: ${lastMsg}` }],
          mode: 'private',
          userId: user?.id,
        }),
        signal: controller.signal,
      });
      if (!resp.ok) throw new Error('Erro');
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let full = '', buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { full += content; setCopilotSuggestion(full); }
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setCopilotSuggestion('');
    } finally {
      setCopilotLoading(false);
    }
  }, [messages]);

  const handleCopilotAccept = (text: string) => {
    handleSend(text);
    setCopilotSuggestion('');
  };

  const handleCopilotDismiss = () => {
    copilotAbortRef.current?.abort();
    setCopilotSuggestion('');
    setCopilotLoading(false);
  };

  // Handlers
  const handleSend = async (message: string) => {
    if (!selectedChat || !selectedInstance) return;
    const token = getToken();
    if (!token) return;
    setSending(true);
    try {
      await callUazapi('sendText', token, { phone: selectedChat, message });
      setMessages(prev => [...prev, { id: `sent-${Date.now()}`, body: message, isFromMe: true, timestamp: new Date().toISOString(), messageType: 'text' }]);
    } catch { toast.error('Erro ao enviar mensagem'); } finally { setSending(false); }
  };

  const handleSendMedia = async (type: string, fileUrl: string, fileName: string, caption?: string) => {
    if (!selectedChat || !selectedInstance) return;
    const token = getToken();
    if (!token) return;
    setSending(true);
    try {
      const actionMap: Record<string, { action: string; extra: Record<string, unknown> }> = {
        image: { action: 'sendImage', extra: { phone: selectedChat, image: fileUrl, caption: caption || '' } },
        video: { action: 'sendVideo', extra: { phone: selectedChat, video: fileUrl, caption: caption || '' } },
        audio: { action: 'sendAudio', extra: { phone: selectedChat, audio: fileUrl } },
        document: { action: 'sendDocument', extra: { phone: selectedChat, document: fileUrl, fileName } },
      };
      const { action, extra } = actionMap[type] || actionMap.document;
      await callUazapi(action, token, extra);
      setMessages(prev => [...prev, { id: `sent-${Date.now()}`, body: caption || fileName, isFromMe: true, timestamp: new Date().toISOString(), messageType: type, mediaUrl: fileUrl }]);
    } catch { toast.error('Erro ao enviar mídia'); } finally { setSending(false); }
  };

  const handleSelectChat = (phone: string) => {
    setSelectedChat(phone);
    setCopilotSuggestion('');
    setCopilotLoading(false);
    copilotAbortRef.current?.abort();
    setChats(prev => prev.map(c => c.phone === phone ? { ...c, unreadCount: 0 } : c));
    // Auto mark as read
    const token = getToken();
    if (token) callUazapi('markAsRead', token, { chatId: phone }).catch(() => {});
  };

  // Contacts
  const loadContacts = async () => {
    const token = getToken();
    if (!token) return;
    setLoadingContacts(true);
    setContactsOpen(true);
    try {
      const data = await callUazapi('getContacts', token) as unknown;
      const response = data as Record<string, unknown>;
      const raw = Array.isArray(data) ? data : (response?.contacts as unknown[]) || (response?.data as unknown[]) || [];
      const mapped: ContactItem[] = raw.map((c: unknown) => {
        const contact = c as Record<string, unknown>;
        const phone = (contact.wa_chatid as string) || (contact.phone as string) || (contact.id as string) || '';
        return { id: phone, name: (contact.wa_name as string) || (contact.name as string) || phone, phone, profilePic: (contact.profilePicUrl as string) || undefined };
      }).filter(c => c.phone && !c.phone.includes('g.us'));
      setContacts(mapped);
    } catch { toast.error('Erro ao buscar contatos'); } finally { setLoadingContacts(false); }
  };

  const handleSelectContact = (phone: string, name: string) => {
    const exists = chats.find(c => c.phone === phone);
    if (!exists) setChats(prev => [{ id: phone, phone, name, lastMessage: '', unreadCount: 0, isGroup: false }, ...prev]);
    setSelectedChat(phone);
  };

  const handleCreateGroup = async (name: string, participants: string[]) => {
    const token = getToken();
    if (!token) return;
    try { await callUazapi('createGroup', token, { name, participants }); toast.success('Grupo criado!'); }
    catch { toast.error('Erro ao criar grupo'); }
  };

  // Chat actions (from API)
  const handleChatAction = async (action: string, extra?: Record<string, unknown>) => {
    const token = getToken();
    if (!token) return;
    try {
      const result = await callUazapi(action, token, extra);
      return result;
    } catch { toast.error(`Erro: ${action}`); }
  };

  // Message actions
  const handleMessageAction = async (action: string, messageId: string, extra?: Record<string, unknown>) => {
    const token = getToken();
    if (!token || !selectedChat) return;
    if (action === 'react') {
      const emoji = (extra?.emoji as string) || '👍';
      await callUazapi('sendReaction', token, { phone: selectedChat, messageId, reaction: emoji });
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const existing = m.reactions || [];
        const idx = existing.findIndex(r => r.emoji === emoji);
        if (idx >= 0) {
          const updated = [...existing];
          updated[idx] = { ...updated[idx], count: updated[idx].count + 1 };
          return { ...m, reactions: updated };
        }
        return { ...m, reactions: [...existing, { emoji, count: 1 }] };
      }));
      toast.success('Reação enviada');
    } else if (action === 'delete') {
      await callUazapi('deleteMessage', token, { phone: selectedChat, messageId });
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Mensagem apagada');
    } else if (action === 'edit' && extra?.text) {
      await callUazapi('editMessage', token, { phone: selectedChat, messageId, text: extra.text as string });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, body: extra.text as string } : m));
      toast.success('Mensagem editada');
    }
  };

  // AI Actions
  const selectedChatData = chats.find(c => c.phone === selectedChat);

  const handleAiAction = async (action: AiToolAction) => {
    // Agent panel
    if (action === 'agent') { setSidePanel('active-agent'); return; }
    // Non-AI panels
    if (action === 'scripts') { setSidePanel('scripts'); return; }
    if (action === 'templates') { setSidePanel('templates'); return; }
    if (action === 'raio-x') { setSidePanel('raio-x'); return; }
    if (action === 'copy') {
      setSidePanel('ai');
      setAiPanel({ title: '🎨 Glossário de Copy', loading: false, content: COPY_GLOSSARY });
      return;
    }

    // AI-powered actions
    const titles: Record<string, string> = {
      strategist: '🧠 Estrategista (Roberta)',
      analyzer: '📊 Análise de Conversa',
      sequence: '⚡ Gerador de Sequência',
      'group-content': '📝 Conteúdo de Grupo',
      ideas: '💡 Ideias Criativas',
    };
    const functions: Record<string, string> = {
      strategist: 'sales-strategist',
      analyzer: 'conversation-analyzer',
      sequence: 'sequence-generator',
      'group-content': 'sales-strategist',
      ideas: 'sales-strategist',
    };

    setSidePanel('ai');
    setAiPanel({ title: titles[action] || action, content: '', loading: true });

    const chatContext = messages.slice(-20).map(m =>
      `${m.isFromMe ? 'Vendedor' : 'Cliente'}: ${m.body}`
    ).join('\n');

    const contactName = selectedChatData?.name || selectedChat || '';
    const prompts: Record<string, string> = {
      strategist: `Baseado nesta conversa, sugira a melhor próxima mensagem para enviar:\n${chatContext}`,
      analyzer: `Analise esta conversa de vendas:\n${chatContext}`,
      sequence: `Gere uma sequência de 5 posts para o grupo "${contactName}". Contexto recente:\n${chatContext}`,
      'group-content': `Gere 3 posts curtos e impactantes para postar neste grupo de WhatsApp "${contactName}". Contexto recente:\n${chatContext}`,
      ideas: `Gere 5 ideias criativas de campanhas/ações de marketing baseadas no contexto desta conversa com "${contactName}":\n${chatContext}`,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const funcName = functions[action] || 'sales-strategist';

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${funcName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompts[action] || prompts.strategist }],
          mode: selectedChatData?.isGroup ? 'group' : 'private',
          userId: user?.id,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).error || 'Erro na IA');
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { full += content; setAiPanel(p => ({ ...p, content: full })); }
          } catch { /* partial */ }
        }
      }
      setAiPanel(p => ({ ...p, loading: false }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro';
      toast.error(msg);
      setAiPanel(p => ({ ...p, loading: false, content: `Erro: ${msg}` }));
    }
  };

  const handleAdaptWithAi = (text: string) => {
    const chatContext = messages.slice(-10).map(m =>
      `${m.isFromMe ? 'Vendedor' : 'Cliente'}: ${m.body}`
    ).join('\n');
    setSidePanel('ai');
    setAiPanel({ title: '✨ Adaptar com IA', content: '', loading: true });

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-strategist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            messages: [{ role: 'user', content: `Adapte este script/template para o contexto da conversa atual. Mantenha a essência mas personalize:\n\nScript/Template:\n${text}\n\nContexto:\n${chatContext}` }],
            mode: selectedChatData?.isGroup ? 'group' : 'private',
            userId: user?.id,
          }),
        });
        if (!resp.ok) throw new Error('Erro');
        const reader = resp.body?.getReader();
        if (!reader) throw new Error('No stream');
        const decoder = new TextDecoder();
        let full = '', buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') break;
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) { full += content; setAiPanel(p => ({ ...p, content: full })); }
            } catch { /* partial */ }
          }
        }
        setAiPanel(p => ({ ...p, loading: false }));
      } catch {
        setAiPanel(p => ({ ...p, loading: false, content: 'Erro ao adaptar' }));
      }
    });
  };

  // "Usar como resposta" -> puts text in input box (not send directly)
  const [pendingReplyText, setPendingReplyText] = useState("");

  const handleUseAsReply = (text: string) => {
    if (text) setPendingReplyText(text);
    setSidePanel(null);
  };

  const handleSendDirect = (text: string) => {
    handleSend(text);
  };

  const closeSidePanel = () => setSidePanel(null);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-sm font-semibold">WhatsApp Chat</h1>
        <div className="ml-auto flex items-center gap-2">
          {selectedChatData?.isGroup && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCampaignOpen(true)}>
              <Megaphone className="h-3 w-3 mr-1" /> Campanha
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={loadContacts} disabled={!selectedInstance}>
            <UserPlus className="h-3 w-3 mr-1" /> Nova Conversa
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCreateGroupOpen(true)} disabled={!selectedInstance}>
            <UsersRound className="h-3 w-3 mr-1" /> Criar Grupo
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setInstanceSettingsOpen(true)} disabled={!selectedInstance}>
            <Settings className="h-3 w-3 mr-1" /> Instância
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMuted(!muted)} title={muted ? 'Ativar som' : 'Silenciar'}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Select value={selectedInstance} onValueChange={setSelectedInstance}>
            <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Selecione instância" /></SelectTrigger>
            <SelectContent>
              {instances.map(inst => (<SelectItem key={inst.id} value={inst.id} className="text-xs">{inst.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Follow-up alerts banner */}
      {selectedInstance && (
        <FollowupAlertsBanner instanceId={selectedInstance} onGoToChat={handleSelectChat} />
      )}

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        <div className="w-80 border-r border-border bg-card/30">
          <ChatList
            chats={chats} selectedChat={selectedChat} onSelectChat={handleSelectChat} loading={loadingChats}
            contactTags={contactTags} instanceId={selectedInstance} onTagChange={handleTagChange}
          />
        </div>
        <div className="flex-1 flex">
          <div className="flex-1">
            <ChatWindow
              contactName={selectedChatData?.name || selectedChat || ''}
              contactPhone={selectedChat || ''}
              messages={messages}
              loading={loadingMessages}
              onSendMessage={handleSend}
              onSendMedia={handleSendMedia}
              sending={sending}
              onAiAction={handleAiAction}
              aiLoading={aiPanel.loading}
              onOpenDetail={() => setSidePanel(sidePanel === 'detail' ? null : 'detail')}
              onMessageAction={handleMessageAction}
              copilotSuggestion={copilotSuggestion}
              copilotLoading={copilotLoading}
              onCopilotAccept={handleCopilotAccept}
              onCopilotDismiss={handleCopilotDismiss}
              onSendPoll={() => toast.info('Enquete: use o formato "Pergunta | Opção1 | Opção2" no campo de mensagem')}
              onSendLocation={() => toast.info('Localização: compartilhe via app do WhatsApp')}
              contactTag={contactTags[selectedChat || ''] || 'novo'}
              instanceId={selectedInstance}
              onTagChange={handleTagChange}
              isGroup={selectedChatData?.isGroup}
              onActivateAgent={() => setSidePanel('active-agent')}
              pendingReplyText={pendingReplyText}
              onPendingReplyConsumed={() => setPendingReplyText("")}
            />
          </div>

          {/* Side panels */}
          {sidePanel === 'ai' && (
            <AiAssistantPanel
              open={true}
              onClose={closeSidePanel}
              title={aiPanel.title}
              content={aiPanel.content}
              loading={aiPanel.loading}
              onUseAsReply={handleUseAsReply}
            />
          )}
          {sidePanel === 'scripts' && (
            <ScriptsPanel open={true} onClose={closeSidePanel} onSend={handleSendDirect} onAdapt={handleAdaptWithAi} />
          )}
          {sidePanel === 'templates' && (
            <TemplatesPanel open={true} onClose={closeSidePanel} onSend={handleSendDirect} onAdapt={handleAdaptWithAi} />
          )}
          {sidePanel === 'raio-x' && (
            <RaioXPanel open={true} onClose={closeSidePanel} />
          )}
          {sidePanel === 'detail' && selectedChat && (
            <ContactDetailPanel
              open={true}
              onClose={closeSidePanel}
              chatId={selectedChat}
              chatName={selectedChatData?.name || ''}
              isGroup={selectedChatData?.isGroup || false}
              onAction={(action, extra) => handleChatAction(action, extra)}
            />
          )}
          {sidePanel === 'active-agent' && selectedInstance && (
            <ActiveAgentPanel
              open={true}
              onClose={closeSidePanel}
              instanceId={selectedInstance}
              messages={messages}
              contactName={selectedChatData?.name || selectedChat || ''}
              contactPhone={selectedChat || ''}
              isGroup={selectedChatData?.isGroup || false}
              onUseAsReply={(text) => { setPendingReplyText(text); setSidePanel(null); }}
              lastMessageTimestamp={lastMsgTimestamp}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ContactsDialog open={contactsOpen} onClose={() => setContactsOpen(false)} contacts={contacts} loading={loadingContacts} onSelectContact={handleSelectContact} />
      <CreateGroupDialog open={createGroupOpen} onClose={() => setCreateGroupOpen(false)} onCreateGroup={handleCreateGroup} />
      <InstanceSettingsDialog open={instanceSettingsOpen} onClose={() => setInstanceSettingsOpen(false)} onAction={(action, extra) => handleChatAction(action, extra)} />
      {selectedChatData?.isGroup && (
        <CampaignDrawer open={campaignOpen} onClose={() => setCampaignOpen(false)} groupId={selectedChat || ''} groupName={selectedChatData?.name || ''} />
      )}
    </div>
  );
}

// Copy glossary content
const COPY_GLOSSARY = `# 📋 Glossário de Formatos de Copy

## 5 Níveis de Consciência
1. **Inconsciente** - Não sabe que tem um problema
2. **Consciente do Problema** - Sabe que tem um problema
3. **Consciente da Solução** - Sabe que existem soluções
4. **Consciente do Produto** - Conhece seu produto
5. **Mais Consciente** - Pronto para comprar

## 10 Formatos Core

### 1. 🎯 PAS (Problema-Agitação-Solução)
Apresente o problema, agite a dor, ofereça a solução.

### 2. 🌟 AIDA (Atenção-Interesse-Desejo-Ação)
Capture atenção, gere interesse, crie desejo, chame à ação.

### 3. 💪 BAB (Before-After-Bridge)
Mostre o antes, o depois, e a ponte (seu produto).

### 4. ⚡ 4 U's (Útil-Urgente-Único-Ultra-específico)
Mensagem que entrega valor, urgência e especificidade.

### 5. 🎪 Storytelling
Conte uma história com herói, vilão e transformação.

### 6. 📊 Prova Social
Use depoimentos, números e resultados reais.

### 7. 🔥 Escassez/Urgência
Limite de vagas, prazo, preço especial temporário.

### 8. ❓ Pergunta Retórica
Inicie com pergunta que gera identificação.

### 9. 🎁 Valor Primeiro
Entregue conteúdo valioso antes de pedir algo.

### 10. 🔄 Loop Aberto
Crie curiosidade que só se resolve ao continuar lendo.

## Pesos Emocionais
- **Dor**: 40% - O que o cliente sofre
- **Desejo**: 30% - O que o cliente quer
- **Prova**: 20% - Evidência de que funciona
- **Urgência**: 10% - Por que agir agora
`;
