import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCommunity, CommunityMessage } from '@/hooks/useCommunity';
import { VimeoPlayer, isVimeoUrl } from '@/components/community/VimeoPlayer';
import { useCommunityNewMaterials } from '@/hooks/useCommunityNewMaterials';
import { PlayCircle, Video, Download, X, Loader2, FileText, Link as LinkIcon, Plus, Send, Pin, Trash2, Paperclip, Reply, BarChart3, ImageIcon, Search, ExternalLink, Play, Lock, AlertCircle, Heart, Share2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { logPopupBlocked, logInvalidUrl, logViniPlayerError } from "@/lib/appLogs";

function formatDate(date: string) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

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
  
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialType, setMaterialType] = useState('link');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; authorName: string } | null>(null);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [vimeoMaterial, setVimeoMaterial] = useState<{ url: string; title: string; type?: string } | null>(null);

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'materials' ? 'materials' : 'chat';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { markAllSeen } = useCommunityNewMaterials();

  useEffect(() => {
    if (activeTab === 'materials') {
      markAllSeen();
    }
  }, [activeTab, markAllSeen]);

  const normalizeUrl = (rawUrl: string) => {
    let normalizedUrl = rawUrl.trim();
    if (!normalizedUrl) return '';
    normalizedUrl = normalizedUrl.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, '');
    if (!normalizedUrl.startsWith('http') && !normalizedUrl.startsWith('//')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    return normalizedUrl;
  };

  const handleOpenUrl = useCallback((url: string) => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      logInvalidUrl(url);
      return;
    }
    const win = window.open(normalized, '_blank');
    if (!win) {
      logPopupBlocked();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const result = await sendMessage(newMessage, 'text', replyTo?.id);
    if (result.success) {
      setNewMessage('');
      setReplyTo(null);
    }
    setSending(false);
  };

  const handleAddMaterial = async () => {
    if (!materialTitle || !materialUrl) {
      toast.error('Preencha título e URL');
      return;
    }
    const result = await uploadMaterial(materialTitle, materialDescription, materialUrl, materialType);
    if (result.success) {
      setMaterialTitle('');
      setMaterialDescription('');
      setMaterialUrl('');
      setMaterialDialogOpen(false);
    }
  };

  const detectedVimeo = useMemo(() => isVimeoUrl(materialUrl), [materialUrl]);
  useEffect(() => {
    if (detectedVimeo && materialType !== 'vimeo') setMaterialType('vimeo');
  }, [detectedVimeo, materialType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Comunidade</h1>
          <p className="text-muted-foreground">Troque experiências e acesse materiais exclusivos</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="chat">Chat da Comunidade</TabsTrigger>
          <TabsTrigger value="materials">Materiais e Aulas</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b py-3 px-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Mural da Comunidade
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.user_id === currentUserId ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.profile?.avatar_url || ''} />
                        <AvatarFallback>{msg.profile?.full_name?.substring(0, 2) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col max-w-[80%] ${msg.user_id === currentUserId ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">{msg.profile?.full_name || 'Usuário'}</span>
                          {msg.isAdmin && <Badge variant="secondary" className="text-[10px] py-0">Admin</Badge>}
                          <span className="text-[10px] text-muted-foreground">{formatDate(msg.created_at)}</span>
                        </div>
                        <div className={`p-3 rounded-lg text-sm ${msg.user_id === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {msg.replyTo && (
                            <div className="mb-2 p-2 rounded bg-black/10 text-xs italic border-l-2 border-primary/50">
                              Respondendo a {msg.replyTo.authorName}: {msg.replyTo.content}
                            </div>
                          )}
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                           <EmojiReactions 
                             reactions={msg.reactions || []} 
                             onReact={(emoji) => addReaction(msg.id, emoji)}
                             onRemoveReaction={(emoji) => removeReaction(msg.id, emoji)}
                           />
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo({ id: msg.id, content: msg.content, authorName: msg.profile?.full_name || 'Usuário' })}>
                             <Reply className="h-3 w-3" />
                           </Button>
                           {isAdmin && (
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteMessage(msg.id)}>
                               <Trash2 className="h-3 w-3" />
                             </Button>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t space-y-2">
                {replyTo && (
                  <ReplyPreview 
                    replyTo={replyTo}
                    onCancel={() => setReplyTo(null)} 
                  />
                )}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Sua mensagem..." 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {isAdmin && (
            <div className="flex justify-end gap-2">
               <Button onClick={() => setPollDialogOpen(true)} variant="outline" className="gap-2">
                 <BarChart3 className="h-4 w-4" /> Criar Enquete
               </Button>
               <CreatePollDialog 
                 open={pollDialogOpen} 
                 onOpenChange={setPollDialogOpen} 
                 onCreatePoll={async (q, o) => { await createPoll(q, o); }} 
               />
            </div>
          )}
        </TabsContent>


        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Materiais e Aulas</CardTitle>
              {isAdmin && (
                <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" /> Novo Material
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Material</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="Ex: Masterclass de Vendas" />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} placeholder="Breve descrição do conteúdo" />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input value={materialUrl} onChange={(e) => setMaterialUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <select className="w-full p-2 border rounded" value={materialType} onChange={(e) => setMaterialType(e.target.value)}>
                          <option value="link">Link</option>
                          <option value="vimeo">Vimeo (Aula)</option>
                          <option value="pdf">PDF</option>
                          <option value="image">Imagem</option>
                        </select>
                      </div>
                      <Button onClick={handleAddMaterial} className="w-full">Salvar Material</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map((m) => {
                  const isVimeo = m.file_type === 'vimeo' || isVimeoUrl(m.file_url);
                  return (
                    <Card key={m.id} className="flex flex-col">
                      <CardContent className="p-4 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {isVimeo ? <Video className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{m.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{m.description}</p>
                            <span className="text-[10px] text-muted-foreground mt-2 block">{formatDate(m.created_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-3 border-t bg-muted/20 flex gap-2">
                        <Button size="sm" variant="default" className="flex-1 gap-2" onClick={() => setVimeoMaterial({ url: m.file_url, title: m.title, type: m.file_type || 'link' })}>
                          {isVimeo ? <PlayCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          {isVimeo ? 'Assistir' : 'Ver'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleOpenUrl(m.file_url)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMaterial(m.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Viewer */}
      <Dialog open={!!vimeoMaterial} onOpenChange={(open) => !open && setVimeoMaterial(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-4 flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{vimeoMaterial?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
             {vimeoMaterial && (
               isVimeoUrl(vimeoMaterial.url) ? (
                 <VimeoPlayer url={vimeoMaterial.url} title={vimeoMaterial.title} />
               ) : (vimeoMaterial.url.toLowerCase().includes('vini.video') || vimeoMaterial.url.toLowerCase().includes('vini.')) ? (
                 <div className="w-full aspect-video">
                   <iframe
                     src={vimeoMaterial.url.includes('/embed/') ? vimeoMaterial.url : vimeoMaterial.url.replace('vini.video/', 'vini.video/embed/')}
                     title={vimeoMaterial.title}
                     className="w-full h-full"
                     allowFullScreen
                     onError={() => logViniPlayerError()}
                   />
                 </div>
               ) : vimeoMaterial.type === 'pdf' ? (
                 <iframe src={vimeoMaterial.url} className="w-full h-[60vh]" />
               ) : (
                 <div className="p-12 text-center space-y-4">
                   <p>Este material deve ser aberto em uma nova aba.</p>
                   <Button onClick={() => handleOpenUrl(vimeoMaterial.url)}>Abrir agora</Button>
                 </div>
               )
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-[90vw] p-0 border-none bg-transparent">
          {lightboxImage && <img src={lightboxImage} className="max-w-full max-h-[85vh] rounded-lg mx-auto" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
