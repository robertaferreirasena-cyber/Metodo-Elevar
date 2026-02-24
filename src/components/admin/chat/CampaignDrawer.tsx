import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Sparkles, Calendar, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CampaignDrawerProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

interface GeneratedPost {
  order: number;
  timing: string;
  objective: string;
  content: string;
  tips?: string;
  expected_reaction?: string;
}

export function CampaignDrawer({ open, onClose, groupId, groupName }: CampaignDrawerProps) {
  const { user } = useAuth();
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState("");
  const [numPosts, setNumPosts] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [sequenceTitle, setSequenceTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [intervalHours, setIntervalHours] = useState(24);
  const [scheduling, setScheduling] = useState(false);

  const handleGenerate = async () => {
    if (!product || !goal) { toast.error("Preencha produto e objetivo"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sequence-generator', {
        body: { product, goal, numPosts, mode: 'grupo', userId: user?.id },
      });
      if (error) throw error;
      const generatedPosts = data?.posts || [];
      setPosts(generatedPosts);
      setSequenceTitle(data?.title || `Campanha ${groupName}`);
      toast.success(`${generatedPosts.length} posts gerados!`);
    } catch {
      toast.error("Erro ao gerar campanha");
    } finally {
      setGenerating(false);
    }
  };

  const handleSchedule = async () => {
    if (!posts.length || !startDate || !user?.id) return;
    setScheduling(true);
    try {
      const { data: seq, error: seqError } = await supabase.from('sequences').insert({
        user_id: user.id,
        title: sequenceTitle || `Campanha ${groupName}`,
        product,
        goal,
        total_posts: posts.length,
        send_mode: 'uazapi',
        whatsapp_group_id: groupId,
        whatsapp_group_name: groupName,
      }).select('id').single();

      if (seqError) throw seqError;

      const start = new Date(startDate);
      const seqPosts = posts.map((p, i) => ({
        sequence_id: seq.id,
        post_order: p.order || i + 1,
        timing: p.timing || `Post ${i + 1}`,
        objective: p.objective || '',
        content: p.content,
        expected_reaction: p.expected_reaction || null,
        tips: p.tips || null,
        send_status: 'pending',
        scheduled_at: new Date(start.getTime() + i * intervalHours * 3600000).toISOString(),
      }));

      const { error: postsError } = await supabase.from('sequence_posts').insert(seqPosts);
      if (postsError) throw postsError;

      toast.success("Campanha agendada com sucesso!");
      onClose();
      setPosts([]);
      setProduct("");
      setGoal("");
    } catch {
      toast.error("Erro ao agendar campanha");
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Campanha para {groupName}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Generator */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Produto/Serviço</label>
              <Input value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: Curso de vendas" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium">Objetivo</label>
              <Textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Ex: Lançamento com 5 dias de aquecimento" rows={2} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium">Quantidade de posts</label>
              <Input type="number" value={numPosts} onChange={e => setNumPosts(Number(e.target.value))} min={2} max={15} className="h-9 text-sm w-24" />
            </div>
            <Button onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              {generating ? 'Gerando...' : 'Gerar com IA'}
            </Button>
          </div>

          {/* Preview */}
          {posts.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-xs font-semibold">Preview ({posts.length} posts)</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {posts.map((p, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Post {p.order || i + 1}</span>
                      <span className="text-muted-foreground">{p.timing}</span>
                    </div>
                    <p className="text-muted-foreground">{p.objective}</p>
                    <p className="whitespace-pre-wrap">{p.content}</p>
                  </div>
                ))}
              </div>

              {/* Schedule */}
              <div className="space-y-3 border-t border-border pt-3">
                <h3 className="text-xs font-semibold flex items-center gap-1"><Calendar className="h-3 w-3" /> Agendamento</h3>
                <div>
                  <label className="text-xs">Título da sequência</label>
                  <Input value={sequenceTitle} onChange={e => setSequenceTitle(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs">Data/hora início</label>
                    <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs">Intervalo (horas)</label>
                    <Input type="number" value={intervalHours} onChange={e => setIntervalHours(Number(e.target.value))} min={1} className="h-9 text-sm" />
                  </div>
                </div>
                <Button onClick={handleSchedule} disabled={scheduling || !startDate} className="w-full">
                  {scheduling ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Agendar Tudo
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
