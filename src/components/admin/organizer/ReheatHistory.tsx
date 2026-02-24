import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PostStatusBadge } from "@/components/sequences/PostStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, History, Trash2, Loader2 } from "lucide-react";

interface SequenceWithPosts {
  id: string;
  title: string;
  created_at: string;
  product: string;
  sequence_posts: {
    id: string;
    content: string;
    send_status: string;
    scheduled_at: string | null;
    sent_at: string | null;
    post_order: number;
    objective: string;
  }[];
}

function getOverallStatus(posts: SequenceWithPosts["sequence_posts"]) {
  if (posts.every(p => p.send_status === "sent")) return "done";
  if (posts.some(p => p.send_status === "failed")) return "failed";
  return "pending";
}

export function ReheatHistory() {
  const [sequences, setSequences] = useState<SequenceWithPosts[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("sequences")
        .select("id, title, created_at, product, sequence_posts(id, content, send_status, scheduled_at, sent_at, post_order, objective)")
        .eq("user_id", user.id)
        .like("title", "Reaquecimento%")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setSequences((data as unknown as SequenceWithPosts[]) || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const cancelReheat = async (seqId: string) => {
    setDeletingId(seqId);
    try {
      await supabase.from("sequence_posts").delete().eq("sequence_id", seqId);
      await supabase.from("sequences").delete().eq("id", seqId);
      setSequences(prev => prev.filter(s => s.id !== seqId));
      toast.success("Reaquecimento cancelado");
    } catch {
      toast.error("Erro ao cancelar");
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "done":
        return <Badge variant="outline" className="text-[10px] border-green-500/30 bg-green-500/10 text-green-600">Concluído</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-[10px] border-destructive/30 bg-destructive/10 text-destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] border-yellow-500/30 bg-yellow-500/10 text-yellow-600">Em andamento</Badge>;
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-4 pb-4 cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Histórico de Reaquecimentos</span>
              {!loading && <Badge variant="secondary" className="text-[10px]">{sequences.length}</Badge>}
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {loading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : sequences.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum reaquecimento agendado ainda</p>
            ) : (
              sequences.map(seq => {
                const posts = [...seq.sequence_posts].sort((a, b) => a.post_order - b.post_order);
                const status = getOverallStatus(posts);
                const contactName = seq.title.replace("Reaquecimento - ", "");
                const sentCount = posts.filter(p => p.send_status === "sent").length;

                return (
                  <div key={seq.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-sm font-medium truncate">{contactName}</span>
                        {statusBadge(status)}
                        <span className="text-[10px] text-muted-foreground">{sentCount}/{posts.length} enviados</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(seq.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                        {status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => cancelReheat(seq.id)}
                            disabled={deletingId === seq.id}
                          >
                            {deletingId === seq.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    {posts.map(post => (
                      <div key={post.id} className="flex items-start gap-2 pl-2 border-l-2 border-muted">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground truncate">{post.content.slice(0, 60)}...</p>
                          {post.scheduled_at && (
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(post.scheduled_at), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                        <PostStatusBadge status={post.send_status} />
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
