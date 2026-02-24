import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, X, Image, FileText, Music, Video, Info, Bot } from "lucide-react";
import { LeadTagBadge, type LeadTag } from "./LeadTagBadge";
import { useState, useRef, useEffect } from "react";
import { ChatBubble } from "./ChatBubble";
import { AttachmentMenu } from "./AttachmentMenu";
import { AiToolbar, type AiToolAction } from "./AiToolbar";
import { MessageActions } from "./MessageActions";
import { CopilotSuggestion } from "./CopilotSuggestion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MessageItem {
  id: string;
  body: string;
  isFromMe: boolean;
  timestamp: string;
  messageType?: string;
  mediaUrl?: string;
  reactions?: { emoji: string; count: number }[];
}

interface ChatWindowProps {
  contactName: string;
  contactPhone: string;
  messages: MessageItem[];
  loading?: boolean;
  onSendMessage: (message: string) => void;
  onSendMedia?: (type: string, fileUrl: string, fileName: string, caption?: string) => void;
  sending?: boolean;
  onAiAction?: (action: AiToolAction) => void;
  aiLoading?: boolean;
  onOpenDetail?: () => void;
  onMessageAction?: (action: string, messageId: string, extra?: Record<string, unknown>) => void;
  onSendLocation?: () => void;
  onSendContact?: () => void;
  onSendSticker?: () => void;
  onSendLink?: () => void;
  onSendPoll?: () => void;
  copilotSuggestion?: string;
  copilotLoading?: boolean;
  onCopilotAccept?: (text: string) => void;
  onCopilotDismiss?: () => void;
  contactTag?: LeadTag;
  instanceId?: string;
  onTagChange?: (phone: string, newTag: LeadTag) => void;
  isGroup?: boolean;
  onActivateAgent?: () => void;
  pendingReplyText?: string;
  onPendingReplyConsumed?: () => void;
}

export function ChatWindow({ contactName, contactPhone, messages, loading, onSendMessage, onSendMedia, sending, onAiAction, aiLoading, onOpenDetail, onMessageAction, onSendLocation, onSendContact, onSendSticker, onSendLink, onSendPoll, copilotSuggestion, copilotLoading, onCopilotAccept, onCopilotDismiss, contactTag, instanceId, onTagChange, isGroup, onActivateAgent, pendingReplyText, onPendingReplyConsumed }: ChatWindowProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Consume pendingReplyText from parent (agent suggestion -> input box)
  useEffect(() => {
    if (pendingReplyText) {
      setText(pendingReplyText);
      onPendingReplyConsumed?.();
    }
  }, [pendingReplyText]);

  useEffect(() => {
    if (!selectedFile) { setFilePreview(null); return; }
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreview(null);
  }, [selectedFile]);

  const getMediaType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendFile = async () => {
    if (!selectedFile || !onSendMedia) return;
    setUploading(true);
    try {
      const ext = selectedFile.name.split('.').pop() || 'bin';
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(path, selectedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(path);
      const mediaType = getMediaType(selectedFile);
      onSendMedia(mediaType, publicUrl, selectedFile.name, text || undefined);
      setText("");
      setSelectedFile(null);
    } catch {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = () => {
    if (selectedFile) { handleSendFile(); return; }
    if (!text.trim() || sending) return;
    onSendMessage(text.trim());
    setText("");
  };

  if (!contactPhone) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <MessageSquare className="h-12 w-12 opacity-30" />
        <p className="text-sm">Selecione uma conversa</p>
      </div>
    );
  }

  const mediaTypeIcon = selectedFile ? {
    image: <Image className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
    audio: <Music className="h-4 w-4" />,
    document: <FileText className="h-4 w-4" />,
  }[getMediaType(selectedFile)] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header with detail button */}
      <div className="px-4 py-2 border-b border-border flex items-center gap-2 bg-card/50">
        <button className="flex items-center gap-2 flex-1 min-w-0 hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors" onClick={onOpenDetail}>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">{contactName.substring(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">{contactName}</p>
              {!isGroup && instanceId && contactTag && (
                <LeadTagBadge tag={contactTag} instanceId={instanceId} contactPhone={contactPhone} onTagChange={onTagChange} compact />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{contactPhone}</p>
          </div>
        </button>
        {onActivateAgent && (
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 shrink-0" onClick={onActivateAgent}>
            <Bot className="h-3 w-3" /> Agente
          </Button>
        )}
        {onOpenDetail && (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onOpenDetail}>
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhuma mensagem</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="group relative">
              {editingId === msg.id ? (
                <div className={`flex mb-1 ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[70%] flex flex-col gap-1 bg-primary/10 border border-primary/30 rounded-lg p-2">
                    <Input
                      ref={editInputRef}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey && editText.trim()) {
                          onMessageAction?.('edit', msg.id, { text: editText.trim() });
                          setEditingId(null);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                      <Button size="sm" className="h-6 text-[10px]" onClick={() => {
                        if (editText.trim()) {
                          onMessageAction?.('edit', msg.id, { text: editText.trim() });
                          setEditingId(null);
                        }
                      }}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                <ChatBubble
                    body={msg.body}
                    isFromMe={msg.isFromMe}
                    timestamp={msg.timestamp}
                    messageType={msg.messageType}
                    mediaUrl={msg.mediaUrl}
                    reactions={msg.reactions}
                  />
                  {onMessageAction && (
                    <div className={`absolute top-0 ${msg.isFromMe ? 'left-0' : 'right-0'}`}>
                      <MessageActions
                        messageId={msg.id}
                        body={msg.body}
                        isFromMe={msg.isFromMe}
                        onReact={(id, emoji) => onMessageAction('react', id, { emoji })}
                        onReply={(id, body) => onMessageAction('reply', id, { body })}
                        onEdit={() => { setEditingId(msg.id); setEditText(msg.body); }}
                        onDelete={(id) => onMessageAction('delete', id)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* File preview */}
      {selectedFile && (
        <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center gap-2">
          {filePreview ? (
            <img src={filePreview} alt="preview" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">{mediaTypeIcon}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{selectedFile.name}</p>
            <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(0)} KB</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedFile(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* AI Toolbar */}
      {onAiAction && contactPhone && (
        <AiToolbar onAction={onAiAction} disabled={aiLoading} />
      )}

      {/* Copilot Suggestion */}
      {(copilotSuggestion || copilotLoading) && onCopilotAccept && onCopilotDismiss && (
        <CopilotSuggestion
          suggestion={copilotSuggestion || ''}
          loading={copilotLoading || false}
          onAccept={onCopilotAccept}
          onDismiss={onCopilotDismiss}
        />
      )}

      {/* Input area */}
      <div className="p-2 border-t border-border flex gap-2">
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,audio/*,video/*" className="hidden" onChange={handleFileSelect} />
        <AttachmentMenu
          onFileClick={() => fileInputRef.current?.click()}
          onLocation={onSendLocation}
          onContact={onSendContact}
          onSticker={onSendSticker}
          onLink={onSendLink}
          onPoll={onSendPoll}
          disabled={sending || uploading}
        />
        <Input
          placeholder={selectedFile ? "Legenda (opcional)..." : "Digite uma mensagem..."}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          className="h-9 text-sm"
          disabled={sending || uploading}
        />
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={(!text.trim() && !selectedFile) || sending || uploading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
