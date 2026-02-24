import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, RefreshCw, Send, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScheduledPost {
  id: string;
  post_order: number;
  content: string;
  timing: string;
  objective: string;
  send_status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  send_error: string | null;
  sequence_id: string;
  sequence_title?: string;
  sequence_group?: string;
}

export default function WhatsAppSchedule() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sequence_posts')
      .select(`*, sequences!inner(title, whatsapp_group_name, whatsapp_group_id)`)
      .not('sequences.whatsapp_group_id', 'is', null)
      .order('scheduled_at', { ascending: true });

    if (data) {
      setPosts(data.map((p: Record<string, unknown>) => {
        const seq = p.sequences as Record<string, unknown>;
        return {
          ...p,
          sequence_title: seq?.title as string || '',
          sequence_group: seq?.whatsapp_group_name as string || seq?.whatsapp_group_id as string || '',
        } as ScheduledPost;
      }));
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return posts;
    return posts.filter(p => p.send_status === statusFilter);
  }, [posts, statusFilter]);

  const stats = useMemo(() => ({
    total: posts.length,
    pending: posts.filter(p => p.send_status === 'pending').length,
    sent: posts.filter(p => p.send_status === 'sent').length,
    failed: posts.filter(p => p.send_status === 'failed').length,
    draft: posts.filter(p => p.send_status === 'draft').length,
  }), [posts]);

  const handleResend = async (postId: string) => {
    setResending(postId);
    try {
      await supabase.from('sequence_posts').update({
        send_status: 'pending',
        send_error: null,
        scheduled_at: new Date().toISOString(),
      }).eq('id', postId);
      toast.success('Post reagendado para envio');
      loadPosts();
    } catch {
      toast.error('Erro ao reagendar');
    } finally {
      setResending(null);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground', icon: <Clock className="h-3 w-3" /> },
    pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-600', icon: <Clock className="h-3 w-3" /> },
    sent: { label: 'Enviado', color: 'bg-green-500/20 text-green-600', icon: <CheckCircle className="h-3 w-3" /> },
    failed: { label: 'Falhou', color: 'bg-red-500/20 text-red-600', icon: <XCircle className="h-3 w-3" /> },
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Agenda de Postagens</h1>
        </div>
        <Button variant="outline" size="sm" onClick={loadPosts}><RefreshCw className="h-3 w-3 mr-1" /> Atualizar</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Total', value: stats.total, icon: <Calendar className="h-4 w-4" /> },
          { label: 'Pendentes', value: stats.pending, icon: <Clock className="h-4 w-4 text-yellow-500" /> },
          { label: 'Enviados', value: stats.sent, icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
          { label: 'Falhou', value: stats.failed, icon: <XCircle className="h-4 w-4 text-red-500" /> },
          { label: 'Rascunho', value: stats.draft, icon: <AlertCircle className="h-4 w-4 text-muted-foreground" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center gap-2">
              {s.icon}
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos</SelectItem>
            <SelectItem value="pending" className="text-xs">Pendentes</SelectItem>
            <SelectItem value="sent" className="text-xs">Enviados</SelectItem>
            <SelectItem value="failed" className="text-xs">Falhou</SelectItem>
            <SelectItem value="draft" className="text-xs">Rascunho</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} posts</span>
      </div>

      {/* Posts list */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum post agendado</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(post => {
            const cfg = statusConfig[post.send_status] || statusConfig.draft;
            return (
              <Card key={post.id}>
                <CardHeader className="py-2 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xs">{post.sequence_title}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">{post.sequence_group}</Badge>
                      <Badge className={`text-[10px] ${cfg.color} border-0`}>
                        {cfg.icon}
                        <span className="ml-1">{cfg.label}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.scheduled_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(post.scheduled_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      )}
                      {post.send_status === 'failed' && (
                        <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => handleResend(post.id)} disabled={resending === post.id}>
                          {resending === post.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                          Reenviar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-0">
                  <p className="text-xs whitespace-pre-wrap line-clamp-3">{post.content}</p>
                  {post.send_error && (
                    <p className="text-[10px] text-red-500 mt-1">Erro: {post.send_error}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
