import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCommunity, CommunityMessage } from '@/hooks/useCommunity';
import { VimeoPlayer, isVimeoUrl } from '@/components/community/VimeoPlayer';
import { useCommunityNewMaterials } from '@/hooks/useCommunityNewMaterials';
import { PlayCircle, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Pin, Trash2, FileText, Link as LinkIcon, Download, Plus, Paperclip, X, Loader2, Reply, BarChart3, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { EmojiReactions } from '@/components/community/EmojiReactions';
import { PollMessage } from '@/components/community/PollMessage';
import { CreatePollDialog } from '@/components/community/CreatePollDialog';
import { ReplyPreview } from '@/components/community/ReplyPreview';

export default function Community() {
  const { 
    messages, 
    materials, 
    loading, 
    sendMessage, 
    deleteMessage, 
    togglePinMessage,
    addReaction,
    removeReaction,
    createPoll,
    votePoll,
    uploadMaterial,
    deleteMaterial,
    isAdmin, 
    currentUserId 
  } = useCommunity();
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Material dialog state
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialType, setMaterialType] = useState('link');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Reply state
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; authorName: string } | null>(null);
  
  // Poll dialog state
  const [pollDialogOpen, setPollDialogOpen] = useState(false);

  // Vimeo player and Universal Viewer dialog
  const [vimeoMaterial, setVimeoMaterial] = useState<{ url: string; title: string; type?: string } | null>(null);

  // Tab via query string + mark materials seen
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'materials' ? 'materials' : 'chat';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { markAllSeen } = useCommunityNewMaterials();

  useEffect(() => {
    if (activeTab === 'materials') {
      markAllSeen();
    }
  }, [activeTab, markAllSeen]);

  // Auto-detect Vimeo URL in the add-material dialog
  const detectedVimeo = useMemo(() => isVimeoUrl(materialUrl), [materialUrl]);
  useEffect(() => {
    if (detectedVimeo && materialType !== 'vimeo') setMaterialType('vimeo');
  }, [detectedVimeo]);

  const normalizeUrl = (rawUrl: string) => {
    let normalizedUrl = rawUrl.trim();
    if (!normalizedUrl) return '';
    
    // Remote spaces and common invalid characters for a URL
    normalizedUrl = normalizedUrl.replace(/\s+/g, '');
    
    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://') || normalizedUrl.startsWith('blob:') || normalizedUrl.startsWith('data:')) {
      // Valid protocol
    } else if (normalizedUrl.startsWith('//')) {
      normalizedUrl = `https:${normalizedUrl}`;
    } else if (normalizedUrl.startsWith('/')) {
      normalizedUrl = `${window.location.origin}${normalizedUrl}`;
    } else {
      const domainMatch = normalizedUrl.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/);
      if (domainMatch || (normalizedUrl.includes('.') && !normalizedUrl.includes(' '))) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
    }

    try {
      new URL(normalizedUrl);
      return normalizedUrl;
    } catch (e) {
      console.warn("URL inválida após normalização:", normalizedUrl);
      return normalizedUrl; // Fallback to raw normalized if URL constructor fails (e.g. relative paths in dev)
    }
  };

  const handleOpenUrl = (url: string) => {
    const finalUrl = normalizeUrl(url);
    if (!finalUrl) {
      toast.error("URL inválida ou vazia");
      return;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `chat/${fileName}`;

    const { error } = await supabase.storage
      .from('community-materials')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('community-materials')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    
    setSending(true);
    
    let messageContent = newMessage.trim();
    let messageType = 'text';
    
    // If admin has a file, upload it first
    if (selectedFile && isAdmin) {
      setUploading(true);
      const fileUrl = await uploadFile(selectedFile);
      setUploading(false);
      
      if (fileUrl) {
        const isImage = selectedFile.type.startsWith('image/');
        messageType = isImage ? 'image' : 'file';
        messageContent = messageContent 
          ? `${messageContent}\n\n📎 ${selectedFile.name}: ${fileUrl}`
          : `📎 ${selectedFile.name}: ${fileUrl}`;
      }
      setSelectedFile(null);
    }
    
    if (messageContent) {
      const result = await sendMessage(messageContent, messageType, replyTo?.id);
      if (result.success) {
        setNewMessage('');
        setReplyTo(null);
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    }
    
    setSending(false);
  };

  const handleCreatePoll = async (question: string, options: string[]) => {
    await createPoll(question, options);
  };

  const handleReply = (msg: CommunityMessage) => {
    const authorName = msg.profile?.full_name || msg.profile?.email?.split('@')[0] || 'Usuário';
    setReplyTo({
      id: msg.id,
      content: msg.content,
      authorName
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddMaterial = async () => {
    if (!materialTitle.trim() || !materialUrl.trim()) {
      toast.error('Preencha título e URL');
      return;
    }

    // Ensure URL has protocol
    let finalUrl = materialUrl.trim();
    if (!finalUrl.startsWith('http') && !finalUrl.startsWith('blob:')) {
      finalUrl = `https://${finalUrl}`;
    }

    const result = await uploadMaterial(materialTitle, materialDescription, finalUrl, materialType);
    if (result.success) {
      setMaterialDialogOpen(false);
      setMaterialTitle('');
      setMaterialDescription('');
      setMaterialUrl('');
    }
  };

  const pinnedMessages = messages.filter(m => m.is_pinned);
  const regularMessages = messages.filter(m => !m.is_pinned);

  // Component to render message content with inline images
  const MessageContent = ({ content, isOwn, onImageClick }: { content: string; isOwn: boolean; onImageClick: (url: string) => void }) => {
    // Regex to find image URLs (common image extensions)
    const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi;
    // Regex to find file attachments with format: 📎 filename: url
    const attachmentRegex = /📎\s*([^:]+):\s*(https?:\/\/[^\s]+)/g;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    // Find all image URLs and attachments
    const allMatches: { index: number; length: number; type: 'image' | 'attachment'; url: string; filename?: string }[] = [];
    
    // Reset regex
    imageUrlRegex.lastIndex = 0;
    while ((match = imageUrlRegex.exec(content)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        type: 'image',
        url: match[0]
      });
    }
    
    attachmentRegex.lastIndex = 0;
    while ((match = attachmentRegex.exec(content)) !== null) {
      const existingMatch = allMatches.find(m => m.index <= match.index && m.index + m.length >= match.index + match[0].length);
      if (!existingMatch) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          type: 'attachment',
          url: match[2],
          filename: match[1].trim()
        });
      }
    }
    
    // Sort by index
    allMatches.sort((a, b) => a.index - b.index);
    
    if (allMatches.length === 0) {
      return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    }
    
    allMatches.forEach((m, i) => {
      // Add text before this match
      if (m.index > lastIndex) {
        const textBefore = content.slice(lastIndex, m.index);
        if (textBefore.trim()) {
          parts.push(<span key={`text-${i}`} className="whitespace-pre-wrap">{textBefore}</span>);
        }
      }
      
      const isImage = m.url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i);
      
      if (isImage) {
        parts.push(
          <button 
            key={`img-${i}`} 
            onClick={() => onImageClick(m.url)}
            className="block my-2 cursor-zoom-in"
            type="button"
          >
            <img 
              src={m.url} 
              alt={m.filename || 'Imagem compartilhada'} 
              className="max-w-full max-h-64 rounded-lg object-cover hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          </button>
        );
      } else if (m.type === 'attachment') {
        parts.push(
          <a 
            key={`file-${i}`}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 my-2 p-2 rounded-lg ${isOwn ? 'bg-primary-foreground/10' : 'bg-background/50'}`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="text-sm underline truncate">{m.filename}</span>
            <Download className="h-4 w-4 shrink-0" />
          </a>
        );
      }
      
      lastIndex = m.index + m.length;
    });
    
    // Add remaining text
    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex);
      if (remaining.trim()) {
        parts.push(<span key="text-end" className="whitespace-pre-wrap">{remaining}</span>);
      }
    }
    
    return <div className="text-sm">{parts}</div>;
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between shrink-0 mb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 truncate">
            💬 Comunidade
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Conecte-se com outras empreendedoras</p>
        </div>
        {isAdmin && (
          <Badge variant="default" className="gap-1 shrink-0">
            🎓 Admin
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchParams(v === 'materials' ? { tab: 'materials' } : {}, { replace: true }); }} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="materials">Materiais ({materials.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 min-h-0 mt-2">
          <Card className="h-full flex flex-col">
            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
              <div className="border-b bg-muted/50 p-3">
                {pinnedMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2 text-sm">
                    <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{msg.profile?.full_name || 'Usuário'}:</span>
                      <span className="ml-1 text-muted-foreground">{msg.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                {regularMessages.map((msg) => {
                  const isOwn = msg.user_id === currentUserId;
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.profile?.avatar_url || ''} />
                        <AvatarFallback className={msg.isAdmin ? 'bg-primary text-primary-foreground' : ''}>
                          {getInitials(msg.profile?.full_name || null, msg.profile?.email || null)}
                        </AvatarFallback>
                      </Avatar>

                      <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {msg.profile?.full_name || msg.profile?.email?.split('@')[0] || 'Usuário'}
                          </span>
                          {msg.isAdmin && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              Admin
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>

                        {/* Reply reference */}
                        {msg.replyTo && (
                          <div className={`text-xs mb-1 px-2 py-1 rounded border-l-2 border-primary/50 bg-muted/50 ${isOwn ? 'ml-auto' : ''}`}>
                            <span className="text-primary font-medium">{msg.replyTo.authorName}</span>
                            <p className="text-muted-foreground truncate">{msg.replyTo.content}</p>
                          </div>
                        )}

                        <div className={`rounded-lg p-3 ${
                          isOwn 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          {/* Poll content */}
                          {msg.poll ? (
                            <PollMessage
                              question={msg.poll.question}
                              options={msg.poll.options}
                              userVote={msg.poll.userVote}
                              totalVotes={msg.poll.totalVotes}
                              onVote={(index) => votePoll(msg.poll!.id, index)}
                              endsAt={msg.poll.endsAt}
                            />
                          ) : (
                            <MessageContent content={msg.content} isOwn={isOwn} onImageClick={setLightboxImage} />
                          )}
                        </div>

                        {/* Reactions */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`mt-1 ${isOwn ? 'flex justify-end' : ''}`}>
                            <EmojiReactions
                              reactions={msg.reactions}
                              onReact={(emoji) => addReaction(msg.id, emoji)}
                              onRemoveReaction={(emoji) => removeReaction(msg.id, emoji)}
                            />
                          </div>
                        )}

                        {/* Actions */}
                        <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                          {/* Add reaction button (when no reactions yet) */}
                          {(!msg.reactions || msg.reactions.length === 0) && (
                            <EmojiReactions
                              reactions={[]}
                              onReact={(emoji) => addReaction(msg.id, emoji)}
                              onRemoveReaction={(emoji) => removeReaction(msg.id, emoji)}
                            />
                          )}
                          
                          {isAdmin && !msg.is_pinned && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => togglePinMessage(msg.id, msg.is_pinned)}
                            >
                              <Pin className="h-3 w-3 mr-1" />
                              Fixar
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-destructive"
                              onClick={() => deleteMessage(msg.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area - Admin only */}
            {isAdmin ? (
              <>
                {/* Reply preview */}
                {replyTo && (
                  <div className="border-t p-3">
                    <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />
                  </div>
                )}

                {/* File preview */}
                {selectedFile && (
                  <div className="border-t p-3 bg-muted/50">
                    <div className="flex items-center gap-2">
                      {selectedFile.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2 items-end">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploading}
                      title="Anexar arquivo"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setPollDialogOpen(true)}
                      disabled={sending || uploading}
                      title="Criar enquete"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending || uploading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={(sending || uploading) || (!newMessage.trim() && !selectedFile)}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="border-t p-4 text-center text-sm text-muted-foreground">
                📢 Somente administradores podem enviar mensagens neste canal.
              </div>
            )}
          </Card>

          {/* Poll Dialog */}
          <CreatePollDialog
            open={pollDialogOpen}
            onOpenChange={setPollDialogOpen}
            onCreatePoll={handleCreatePoll}
          />
        </TabsContent>

        <TabsContent value="materials" className="h-[calc(100%-3rem)]">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Materiais Complementares</CardTitle>
              {isAdmin && (
                <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Adicionar Material
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Material</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={materialTitle}
                          onChange={(e) => setMaterialTitle(e.target.value)}
                          placeholder="Ex: Guia de Copy para Instagram"
                        />
                      </div>
                      <div>
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                          value={materialDescription}
                          onChange={(e) => setMaterialDescription(e.target.value)}
                          placeholder="Breve descrição do material..."
                        />
                      </div>
                      <div>
                        <Label>URL do Material</Label>
                        <Input
                          value={materialUrl}
                          onChange={(e) => setMaterialUrl(e.target.value)}
                          placeholder="Cole o link (Vimeo, PDF, drive...)"
                        />
                        {detectedVimeo && (
                          <p className="text-xs text-primary mt-1 flex items-center gap-1">
                            <Video className="h-3 w-3" /> Vídeo Vimeo detectado — será reproduzido dentro do app.
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <select
                          value={materialType}
                          onChange={(e) => setMaterialType(e.target.value)}
                          className="w-full border rounded-md p-2"
                        >
                          <option value="link">Link</option>
                          <option value="pdf">PDF</option>
                          <option value="vimeo">Vídeo Vimeo (player embutido)</option>
                          <option value="video">Vídeo (link externo)</option>
                          <option value="image">Imagem</option>
                        </select>
                        {materialType === 'vimeo' && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Para vídeos privados, cole a URL com o hash (ex.: vimeo.com/123/abc) ou autorize o domínio do app no painel do Vimeo.
                          </p>
                        )}
                      </div>
                      <Button onClick={handleAddMaterial} className="w-full">
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {materials.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum material disponível ainda</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {materials.map((material) => {
                    const isVimeo = material.file_type === 'vimeo' || isVimeoUrl(material.file_url);
                    return (
                    <Card key={material.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                              {isVimeo ? (
                                <Video className="h-5 w-5 text-primary" />
                              ) : material.file_type === 'pdf' ? (
                                <FileText className="h-5 w-5 text-primary" />
                              ) : material.file_type === 'video' ? (
                                <Video className="h-5 w-5 text-primary" />
                              ) : (
                                <LinkIcon className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium truncate">{material.title}</h4>
                                {isVimeo && (
                                  <Badge variant="secondary" className="text-[10px]">Vimeo</Badge>
                                )}
                              </div>
                              {material.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {material.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDate(material.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-2"
                              onClick={() => setVimeoMaterial({ 
                                url: material.file_url, 
                                title: material.title, 
                                type: material.file_type || (material.file_url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ? 'image' : material.file_url.toLowerCase().includes('.pdf') ? 'pdf' : 'link')
                              })}
                            >
                              <PlayCircle className="h-4 w-4" />
                              Visualizar
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="gap-2"
                            >
                              <button 
                                onClick={() => handleOpenUrl(material.file_url)}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                              >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Baixar</span>
                              </button>
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => deleteMaterial(material.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none">
          <div className="relative flex items-center justify-center">
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setLightboxImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {lightboxImage && (
              <img 
                src={lightboxImage} 
                alt="Imagem ampliada" 
                className="max-w-full max-h-[85vh] rounded-lg object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Universal Content Viewer (Vimeo, PDF, Images) */}
      <Dialog open={!!vimeoMaterial} onOpenChange={(open) => !open && setVimeoMaterial(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-4 sm:p-6 overflow-hidden flex flex-col max-h-[90vh]">
          {(() => {
            if (!vimeoMaterial) return null;
            const normalizedUrl = normalizeUrl(vimeoMaterial.url);

            return (
              <>
                <DialogHeader className="shrink-0">
                  <DialogTitle className="flex items-center justify-between gap-2 pr-6">
                    <div className="flex items-center gap-2 truncate">
                      {vimeoMaterial.type === 'vimeo' || isVimeoUrl(normalizedUrl) ? (
                        <Video className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <span className="truncate">{vimeoMaterial.title}</span>
                    </div>
                    {!isVimeoUrl(normalizedUrl) && (
                      <Button variant="outline" size="sm" onClick={() => handleOpenUrl(normalizedUrl)} className="ml-auto mr-4 flex items-center gap-2">
                        <Download className="h-4 w-4" /> Baixar
                      </Button>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4 flex-1 min-h-0 overflow-auto flex items-center justify-center bg-black/5 rounded-lg relative group">
                  {isVimeoUrl(normalizedUrl) ? (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <VimeoPlayer url={normalizedUrl} title={vimeoMaterial.title} />
                    </div>
                  ) : vimeoMaterial.type === 'pdf' || normalizedUrl.toLowerCase().includes('.pdf') ? (
                    <iframe 
                      src={`${normalizedUrl}#toolbar=0`} 
                      className="w-full h-[70vh] rounded-lg border-none bg-white"
                      title={vimeoMaterial.title}
                    />
                  ) : vimeoMaterial.type === 'image' || normalizedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ? (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                      <img 
                        src={normalizedUrl} 
                        alt={vimeoMaterial.title} 
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" 
                      />
                      <a 
                        href={normalizedUrl} 
                        download 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute top-4 right-4 bg-background/80 hover:bg-background p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="mb-4 text-muted-foreground font-medium">Este conteúdo pode exigir abertura em nova aba para visualização completa.</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild variant="default">
                          <a href={normalizedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" /> Abrir em nova aba
                          </a>
                        </Button>
                        <Button asChild variant="outline">
                          <a href={normalizedUrl} download className="flex items-center gap-2">
                            <Download className="h-4 w-4" /> Baixar arquivo
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
