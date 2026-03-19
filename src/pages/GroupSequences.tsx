import { useState, useEffect } from "react";
import { Calendar, ArrowLeft, Loader2, Copy, Check, ChevronDown, ChevronUp, Trash2, Save, Play, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PersonaSummary } from "@/components/PersonaSummary";
import { SessionIndicator } from "@/components/SessionIndicator";
import { PostStatusBadge } from "@/components/sequences/PostStatusBadge";

import { ScheduleConfig } from "@/components/sequences/ScheduleConfig";
import { useAuth } from "@/hooks/useAuth";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SequencePost {
  order: number;
  timing: string;
  objective: string;
  content: string;
  expectedReaction: string;
  tips: string;
  // scheduling fields
  scheduledAt?: string;
  sendStatus?: string;
  sendError?: string;
  sentAt?: string;
  dbId?: string;
}

interface Sequence {
  id?: string;
  title: string;
  description: string;
  totalPosts: number;
  duration: string;
  posts: SequencePost[];
  product?: string;
  goal?: string;
  created_at?: string;
}

interface SavedSequence {
  id: string;
  title: string;
  description: string | null;
  product: string;
  goal: string;
  total_posts: number;
  duration: string | null;
  created_at: string;
  sequence_posts: {
    id: string;
    post_order: number;
    timing: string;
    objective: string;
    content: string;
    expected_reaction: string | null;
    tips: string | null;
    scheduled_at: string | null;
    send_status: string;
    send_error: string | null;
    sent_at: string | null;
  }[];
}

interface SequenceFormSession {
  product: string;
  goal: string;
  numPosts: string;
  sequence: Sequence | null;
}

const SESSION_KEY = "session_sequences";

export default function GroupSequences() {
  const { user } = useAuth();
  
  const [sessionState, setSessionState, clearSession, hasRestoredSession] = useSessionPersistence<SequenceFormSession>(
    SESSION_KEY,
    { product: "", goal: "", numPosts: "5", sequence: null }
  );
  
  const [product, setProduct] = useState(sessionState.product);
  const [goal, setGoal] = useState(sessionState.goal);
  const [numPosts, setNumPosts] = useState(sessionState.numPosts);
  const [sequence, setSequence] = useState<Sequence | null>(sessionState.sequence);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSequences, setSavedSequences] = useState<SavedSequence[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    setSessionState({ product, goal, numPosts, sequence });
  }, [product, goal, numPosts, sequence, setSessionState]);

  useEffect(() => {
    if (user) {
      loadSavedSequences();
    }
  }, [user]);

  const loadSavedSequences = async () => {
    setIsLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from("sequences")
        .select(`
          *,
          sequence_posts (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedSequences((data as unknown as SavedSequence[]) || []);
    } catch (error) {
      console.error("Error loading sequences:", error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleGenerate = async () => {
    if (!product.trim() || !goal.trim()) {
      toast.error("Preencha o produto e o objetivo");
      return;
    }

    setIsLoading(true);
    setSequence(null);

    try {
      const { data, error } = await supabase.functions.invoke("sequence-generator", {
        body: { product, goal, numPosts: parseInt(numPosts), userId: user?.id },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSequence({ ...data, product, goal });
      setExpandedPosts([0]);
      toast.success("Sequência gerada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar sequência. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sequence || !user) return;

    setIsSaving(true);
    try {
      const { data: seqData, error: seqError } = await supabase
        .from("sequences")
        .insert({
          user_id: user.id,
          title: sequence.title,
          description: sequence.description,
          product: sequence.product || product,
          goal: sequence.goal || goal,
          total_posts: sequence.totalPosts,
          duration: sequence.duration,
        })
        .select()
        .single();

      if (seqError) throw seqError;

      const postsToInsert = sequence.posts.map(post => ({
        sequence_id: seqData.id,
        post_order: post.order,
        timing: post.timing,
        objective: post.objective,
        content: post.content,
        expected_reaction: post.expectedReaction,
        tips: post.tips,
        scheduled_at: post.scheduledAt || null,
        send_status: post.scheduledAt ? "draft" : "draft",
      }));

      const { error: postsError } = await supabase
        .from("sequence_posts")
        .insert(postsToInsert);

      if (postsError) throw postsError;

      toast.success("Sequência salva com sucesso!");
      setSequence({ ...sequence, id: seqData.id });
      loadSavedSequences();
    } catch (error) {
      console.error("Error saving sequence:", error);
      toast.error("Erro ao salvar sequência");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("sequences").delete().eq("id", id);
      if (error) throw error;
      toast.success("Sequência excluída");
      setSavedSequences(prev => prev.filter(s => s.id !== id));
      if (sequence?.id === id) setSequence(null);
    } catch (error) {
      console.error("Error deleting sequence:", error);
      toast.error("Erro ao excluir sequência");
    }
  };

  const handleCopy = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success("Copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const togglePost = (index: number) => {
    setExpandedPosts(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSchedulePost = async (postDbId: string, date: string, time: string) => {
    if (!date || !time) return;
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    
    try {
      const { error } = await supabase
        .from("sequence_posts")
        .update({ scheduled_at: scheduledAt, send_status: "draft" })
        .eq("id", postDbId);
      if (error) throw error;
      toast.success("Data de envio definida!");
      loadSavedSequences();
      // Update local sequence state if viewing
      if (sequence) {
        setSequence({
          ...sequence,
          posts: sequence.posts.map(p =>
            p.dbId === postDbId ? { ...p, scheduledAt, sendStatus: "draft" } : p
          ),
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao agendar post");
    }
  };

  const handleScheduleAll = async (startDate: string, startTime: string, intervalHours: number) => {
    if (!sequence?.id) return;
    const saved = savedSequences.find(s => s.id === sequence.id);
    if (!saved) return;

    const start = new Date(`${startDate}T${startTime}:00`);
    const updates = saved.sequence_posts
      .sort((a, b) => a.post_order - b.post_order)
      .map((post, i) => {
        const scheduledAt = new Date(start.getTime() + i * intervalHours * 60 * 60 * 1000);
        return { id: post.id, scheduled_at: scheduledAt.toISOString(), send_status: "draft" as const };
      });

    try {
      for (const u of updates) {
        const { error } = await supabase
          .from("sequence_posts")
          .update({ scheduled_at: u.scheduled_at, send_status: u.send_status })
          .eq("id", u.id);
        if (error) throw error;
      }
      toast.success("Todos os posts agendados!");
      loadSavedSequences();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao agendar posts");
    }
  };

  const handleActivateSchedule = async (sequenceId: string) => {
    try {
      const { error } = await supabase
        .from("sequence_posts")
        .update({ send_status: "pending" })
        .eq("sequence_id", sequenceId)
        .not("scheduled_at", "is", null)
        .eq("send_status", "draft");
      if (error) throw error;
      toast.success("Agendamento ativado! Os posts serão enviados nos horários definidos.");
      loadSavedSequences();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao ativar agendamento");
    }
  };

  const handleRetryPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("sequence_posts")
        .update({ send_status: "pending", send_error: null })
        .eq("id", postId);
      if (error) throw error;
      toast.success("Post reagendado para envio!");
      loadSavedSequences();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao reagendar");
    }
  };

  const loadSavedSequence = (saved: SavedSequence) => {
    const loadedSequence: Sequence = {
      id: saved.id,
      title: saved.title,
      description: saved.description || "",
      totalPosts: saved.total_posts,
      duration: saved.duration || "",
      product: saved.product,
      goal: saved.goal,
      created_at: saved.created_at,
      posts: saved.sequence_posts
        .sort((a, b) => a.post_order - b.post_order)
        .map(post => ({
          order: post.post_order,
          timing: post.timing,
          objective: post.objective,
          content: post.content,
          expectedReaction: post.expected_reaction || "",
          tips: post.tips || "",
          scheduledAt: post.scheduled_at || undefined,
          sendStatus: post.send_status,
          sendError: post.send_error || undefined,
          sentAt: post.sent_at || undefined,
          dbId: post.id,
        })),
    };
    setSequence(loadedSequence);
    setProduct(saved.product);
    setGoal(saved.goal);
    setExpandedPosts([0]);
    setActiveTab("create");
  };

  const getScheduledCount = (saved: SavedSequence) => {
    return saved.sequence_posts.filter(p => p.scheduled_at).length;
  };

  const getPendingCount = (saved: SavedSequence) => {
    return saved.sequence_posts.filter(p => p.send_status === "pending").length;
  };

  const getSentCount = (saved: SavedSequence) => {
    return saved.sequence_posts.filter(p => p.send_status === "sent").length;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 touch-target">
          <Link to="/grupo">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            <span className="truncate">Sequências de Engajamento</span>
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Gere e agende posts automáticos com IA
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="touch-target">Criar / Editar</TabsTrigger>
          <TabsTrigger value="saved" className="touch-target">
            Salvas ({savedSequences.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <SessionIndicator
            show={hasRestoredSession && (!!product || !!goal || !!sequence)}
            onClear={clearSession}
            message="Sessão anterior restaurada"
          />
          <PersonaSummary compact className="mb-0" />

          {/* Generator Form */}
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Sequência</CardTitle>
              <CardDescription>
                A IA vai criar uma série de posts estratégicos para aquecer seu grupo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produto ou Serviço</Label>
                <Input
                  id="product"
                  placeholder="Ex: Curso de confeitaria online"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo da Sequência</Label>
                <Textarea
                  id="goal"
                  placeholder="Ex: Lançar uma promoção de Black Friday com 50% de desconto"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numPosts">Quantidade de Posts</Label>
                <Select value={numPosts} onValueChange={setNumPosts}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 posts</SelectItem>
                    <SelectItem value="5">5 posts</SelectItem>
                    <SelectItem value="7">7 posts</SelectItem>
                    <SelectItem value="10">10 posts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando sequência...
                  </>
                ) : (
                  "Gerar Sequência com IA"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated/Loaded Sequence */}
          {sequence && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{sequence.title}</CardTitle>
                    <CardDescription>
                      {sequence.description} • {sequence.totalPosts} posts • {sequence.duration}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!sequence.id && (
                      <Button onClick={handleSave} disabled={isSaving} size="sm">
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>
                    )}
                    {sequence.id && (
                      <Button
                        onClick={() => handleActivateSchedule(sequence.id!)}
                        size="sm"
                        variant="default"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Ativar Agendamento
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Webhook & Schedule Config (only for saved sequences) */}
                {sequence.id && (
                  <ScheduleConfig
                    totalPosts={sequence.totalPosts}
                    onScheduleAll={handleScheduleAll}
                  />
                )}

                {/* Posts */}
                {sequence.posts.map((post, index) => (
                  <Collapsible
                    key={index}
                    open={expandedPosts.includes(index)}
                    onOpenChange={() => togglePost(index)}
                  >
                    <Card className="border-border">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                {post.order}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm">{post.timing}</p>
                                <p className="text-xs text-muted-foreground">{post.objective}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {post.sendStatus && <PostStatusBadge status={post.sendStatus} />}
                              {post.scheduledAt && (
                                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                  {format(new Date(post.scheduledAt), "dd/MM HH:mm")}
                                </span>
                              )}
                              {expandedPosts.includes(index) ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <div className="bg-secondary/50 rounded-lg p-4">
                            <pre className="text-sm whitespace-pre-wrap font-sans">
                              {post.content}
                            </pre>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">Reação Esperada</p>
                              <p className="text-foreground">{post.expectedReaction}</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">Dica</p>
                              <p className="text-foreground">{post.tips}</p>
                            </div>
                          </div>

                          {/* Scheduling controls for saved posts */}
                          {post.dbId && (
                            <div className="border-t pt-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="date"
                                  className="h-8 text-xs w-36"
                                  defaultValue={post.scheduledAt ? post.scheduledAt.split("T")[0] : ""}
                                  id={`date-${post.dbId}`}
                                />
                                <Input
                                  type="time"
                                  className="h-8 text-xs w-28"
                                  defaultValue={
                                    post.scheduledAt
                                      ? format(new Date(post.scheduledAt), "HH:mm")
                                      : ""
                                  }
                                  id={`time-${post.dbId}`}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() => {
                                    const dateEl = document.getElementById(`date-${post.dbId}`) as HTMLInputElement;
                                    const timeEl = document.getElementById(`time-${post.dbId}`) as HTMLInputElement;
                                    handleSchedulePost(post.dbId!, dateEl.value, timeEl.value);
                                  }}
                                >
                                  Definir
                                </Button>
                                {post.sendStatus === "failed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() => handleRetryPost(post.dbId!)}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Reenviar
                                  </Button>
                                )}
                              </div>
                              {post.sendError && (
                                <p className="text-xs text-destructive">{post.sendError}</p>
                              )}
                              {post.sentAt && (
                                <p className="text-xs text-muted-foreground">
                                  Enviado em {format(new Date(post.sentAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(post.content, index)}
                            className="w-full"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Post
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {isLoadingSaved ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : savedSequences.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">Nenhuma sequência salva</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie e salve sequências para acessá-las depois
                </p>
                <Button onClick={() => setActiveTab("create")}>
                  Criar Primeira Sequência
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {savedSequences.map((saved) => (
                <Card key={saved.id} className="group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => loadSavedSequence(saved)}
                      >
                        <CardTitle className="text-base hover:text-primary transition-colors">
                          {saved.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {saved.product} • {saved.total_posts} posts • {saved.duration}
                        </CardDescription>
                        <div className="flex gap-2 mt-2">
                          {getScheduledCount(saved) > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              📅 {getScheduledCount(saved)} agendados
                            </span>
                          )}
                          {getPendingCount(saved) > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              ⏳ {getPendingCount(saved)} pendentes
                            </span>
                          )}
                          {getSentCount(saved) > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              ✅ {getSentCount(saved)} enviados
                            </span>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir sequência?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A sequência e todos os posts serão excluídos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(saved.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      Criada em {format(new Date(saved.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
