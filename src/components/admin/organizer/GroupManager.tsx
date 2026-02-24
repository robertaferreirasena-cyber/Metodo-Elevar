import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { callUazapi } from "@/pages/admin/WhatsAppOrganizer";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, Sparkles, Loader2, CheckSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface GroupItem {
  id: string;
  name: string;
  memberCount: number;
  description?: string;
}

interface Props {
  token: string;
}

export function GroupManager({ token }: Props) {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    loadGroups();
    return () => { abortRef.current?.abort(); };
  }, [token]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await callUazapi('getGroups', token);
      const raw = Array.isArray(data) ? data : ((data as any)?.groups || (data as any)?.data || []);
      const mapped: GroupItem[] = raw.map((g: any) => ({
        id: g.wa_chatid || g.id || g.groupId || '',
        name: g.wa_name || g.name || g.subject || '',
        memberCount: g.wa_participantsCount || g.participants?.length || g.size || 0,
        description: g.wa_description || g.description || '',
      }));
      setGroups(mapped);
    } catch { toast.error('Erro ao buscar grupos'); }
    finally { setLoading(false); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    selected.size === groups.length ? setSelected(new Set()) : setSelected(new Set(groups.map(g => g.id)));
  };

  const leaveGroups = async () => {
    if (selected.size === 0) return;
    setProcessing(true);
    let success = 0, fail = 0;
    for (const groupId of selected) {
      try { await callUazapi('leaveGroup', token, { groupId }); success++; }
      catch { fail++; }
    }
    toast.success(`Saiu de ${success} grupo(s) | Erros: ${fail}`);
    setSelected(new Set());
    setProcessing(false);
    loadGroups();
  };

  const analyzeGroups = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAiLoading(true);
    setAiSuggestion("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const groupList = groups.map(g => `- "${g.name}" (${g.memberCount} membros)`).join('\n');
      const prompt = `Analise esses grupos de WhatsApp e sugira quais NÃO agregam valor para um profissional de vendas/marketing. Considere grupos com nomes genéricos, muitos membros sem interação e grupos duplicados.

Grupos:
${groupList}

Responda com:
## 🔍 Análise dos Grupos

### ❌ Sugestões para sair
- Nome do grupo → motivo

### ✅ Vale manter
- Nome do grupo → motivo

Seja objetivo e direto.`;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-strategist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], mode: 'private', userId: user?.id }),
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
            if (content) { full += content; setAiSuggestion(full); }
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setAiSuggestion('Erro ao analisar. Tente novamente.');
    } finally { setAiLoading(false); }
  };

  if (loading) return <div className="space-y-2 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>;

  return (
    <div className="space-y-4 mt-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              {selected.size === groups.length ? 'Desmarcar' : 'Selecionar'} Todos
            </Button>
            <Button variant="outline" size="sm" onClick={analyzeGroups} disabled={aiLoading || groups.length === 0}>
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              IA Analisar
            </Button>

            {selected.size > 0 && (
              <>
                <Badge variant="secondary">{selected.size} selecionado(s)</Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={processing}>
                      {processing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <LogOut className="h-3.5 w-3.5 mr-1" />}
                      Sair dos Grupos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sair de {selected.size} grupo(s)?</AlertDialogTitle>
                      <AlertDialogDescription>Você não poderá voltar sem ser adicionado novamente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={leaveGroups}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Sugestão da IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{aiSuggestion}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{groups.length} grupos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Nenhum grupo encontrado</p>
            ) : (
              groups.map(group => (
                <div key={group.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <Checkbox checked={selected.has(group.id)} onCheckedChange={() => toggleSelect(group.id)} />
                  <Users className="h-4 w-4 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{group.name}</span>
                    {group.description && <p className="text-xs text-muted-foreground truncate">{group.description}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{group.memberCount} membros</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
