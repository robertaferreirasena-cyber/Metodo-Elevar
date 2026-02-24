import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { callUazapi } from "@/pages/admin/WhatsAppOrganizer";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, Clock, Loader2, ThermometerSun, User, CalendarPlus } from "lucide-react";
import { ReheatHistory } from "./ReheatHistory";

interface DormantContact {
  id: string;
  name: string;
  phone: string;
  lastMessageTime: number;
  daysSinceContact: number;
  temperature: 'quente' | 'morno' | 'frio';
}

interface Props {
  token: string;
  instanceId: string;
}

export function DormantContacts({ token, instanceId }: Props) {
  const [contacts, setContacts] = useState<DormantContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'30' | '60' | '90'>('30');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, string>>({});
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);
  const [scheduledContacts, setScheduledContacts] = useState<Set<string>>(new Set());
  const [intervalHours, setIntervalHours] = useState<number>(24);
  const [historyKey, setHistoryKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    loadDormantContacts();
    return () => { abortRef.current?.abort(); };
  }, [token, periodFilter]);

  const loadDormantContacts = async () => {
    setLoading(true);
    try {
      const data = await callUazapi('getChats', token);
      const rawChats = Array.isArray(data) ? data : ((data as any)?.chats || []);
      const now = Date.now() / 1000;
      const periodDays = parseInt(periodFilter);

      const dormant: DormantContact[] = rawChats
        .filter((c: any) => {
          const isGroup = c.wa_isGroup || c.isGroup || false;
          if (isGroup) return false;
          const ts = c.wa_lastMsgTimestamp || 0;
          if (!ts) return false;
          const daysSince = (now - ts) / 86400;
          return daysSince >= 7 && daysSince <= periodDays + 30;
        })
        .map((c: any) => {
          const ts = c.wa_lastMsgTimestamp || 0;
          const daysSince = Math.floor((now - ts) / 86400);
          return {
            id: c.wa_chatid || c.phone || c.id || '',
            name: c.wa_name || c.name || c.wa_contactName || c.wa_chatid || '',
            phone: c.wa_chatid || c.phone || c.id || '',
            lastMessageTime: ts,
            daysSinceContact: daysSince,
            temperature: daysSince <= 14 ? 'quente' as const : daysSince <= 30 ? 'morno' as const : 'frio' as const,
          };
        })
        .sort((a: DormantContact, b: DormantContact) => a.daysSinceContact - b.daysSinceContact);

      setContacts(dormant);
    } catch { toast.error('Erro ao buscar contatos'); }
    finally { setLoading(false); }
  };

  const generateMessage = async (contact: DormantContact) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGeneratingFor(contact.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Try to get persona data for context
      let personaContext = '';
      if (user) {
        const { data: persona } = await supabase.from('persona_profiles').select('*').eq('user_id', user.id).maybeSingle();
        if (persona) {
          personaContext = `\nContexto do negócio: ${persona.niche || ''} - ${persona.product_description || ''} - Dor principal: ${persona.main_pain || ''}`;
        }
      }

      const prompt = `Gere UMA mensagem curta e natural de reativação para um contato do WhatsApp. A mensagem deve ser pessoal, sem parecer robótica.

Dados do contato:
- Nome: ${contact.name}
- Último contato: ${contact.daysSinceContact} dias atrás
- Temperatura: ${contact.temperature}
${personaContext}

Regras:
- Máximo 3 linhas
- Tom informal e amigável
- Não seja invasivo
- Use o nome da pessoa
- Gere curiosidade ou ofereça valor

Responda APENAS com o texto da mensagem, sem explicações.`;

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
            if (content) { full += content; setGeneratedMessages(prev => ({ ...prev, [contact.id]: full })); }
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error('Erro ao gerar mensagem');
    } finally { setGeneratingFor(null); }
  };

  const sendMessage = async (contact: DormantContact) => {
    const message = generatedMessages[contact.id];
    if (!message) return;
    setSendingFor(contact.id);
    try {
      await callUazapi('sendText', token, { phone: contact.phone, message });
      toast.success(`Mensagem enviada para ${contact.name}!`);
      setGeneratedMessages(prev => { const next = { ...prev }; delete next[contact.id]; return next; });
      setContacts(prev => prev.filter(c => c.id !== contact.id));
    } catch { toast.error('Erro ao enviar mensagem'); }
    finally { setSendingFor(null); }
  };

  const scheduleReheat = async (contact: DormantContact) => {
    setSchedulingFor(contact.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Usuário não autenticado'); return; }

      let personaContext = '';
      const { data: persona } = await supabase.from('persona_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (persona) {
        personaContext = `\nContexto do negócio: ${persona.niche || ''} - ${persona.product_description || ''} - Dor principal: ${persona.main_pain || ''} - Transformação: ${persona.transformation || ''}`;
      }

      const prompt = `Gere exatamente 3 mensagens de reaquecimento para um contato do WhatsApp. Cada mensagem deve ter um objetivo diferente.
${personaContext}

Contato: ${contact.name} (${contact.daysSinceContact} dias sem contato, temperatura: ${contact.temperature})

MENSAGEM 1 (Dia 0 - Saudação casual): Mensagem curta e pessoal, relembrando o contato. Sem vender nada.
MENSAGEM 2 (Dia 1 - Oferta de valor): Compartilhe algo útil relacionado ao nicho. Gere curiosidade.
MENSAGEM 3 (Dia 2 - CTA direto): Convite direto com urgência leve para retomar a conversa.

Responda EXATAMENTE neste formato (separando com ---):
[MSG1]
texto da mensagem 1
---
[MSG2]
texto da mensagem 2
---
[MSG3]
texto da mensagem 3`;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-strategist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], mode: 'private', userId: user.id }),
      });

      if (!resp.ok) throw new Error('Erro na IA');
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
            if (content) full += content;
          } catch { /* partial */ }
        }
      }

      const parts = full.split('---').map(p => p.replace(/\[MSG\d\]\s*/g, '').trim()).filter(Boolean);
      if (parts.length < 3) throw new Error('IA não gerou 3 mensagens');

      const { data: seq, error: seqErr } = await supabase.from('sequences').insert({
        user_id: user.id,
        title: `Reaquecimento - ${contact.name}`,
        product: contact.phone,
        goal: `Reativar contato dormente (${contact.daysSinceContact} dias)`,
        total_posts: 3,
        send_mode: 'uazapi',
        description: `Sequência de reaquecimento automática para ${contact.name}`,
      }).select('id').single();

      if (seqErr || !seq) throw seqErr || new Error('Erro ao criar sequência');

      const now = new Date();
      const posts = parts.slice(0, 3).map((content, i) => {
        const scheduledAt = new Date(now.getTime() + i * intervalHours * 60 * 60 * 1000);
        return {
          sequence_id: seq.id,
          content,
          objective: i === 0 ? 'Saudação casual' : i === 1 ? 'Oferta de valor' : 'CTA direto',
          timing: `Dia ${i}`,
          post_order: i + 1,
          scheduled_at: scheduledAt.toISOString(),
          send_status: 'pending',
        };
      });

      const { error: postsErr } = await supabase.from('sequence_posts').insert(posts);
      if (postsErr) throw postsErr;

      setScheduledContacts(prev => new Set(prev).add(contact.id));
      setHistoryKey(k => k + 1);
      toast.success(`Reaquecimento agendado para ${contact.name}! 3 mensagens serão enviadas automaticamente.`);
      setTimeout(() => setContacts(prev => prev.filter(c => c.id !== contact.id)), 2000);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao agendar reaquecimento');
    } finally {
      setSchedulingFor(null);
    }
  };

  const tempColor = (t: string) => {
    switch (t) {
      case 'quente': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'morno': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'frio': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default: return '';
    }
  };

  if (loading) return <div className="space-y-2 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-4 mt-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Sem contato há até:</span>
            <Select value={periodFilter} onValueChange={v => setPeriodFilter(v as '30' | '60' | '90')}>
              <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-2">Intervalo:</span>
            <Select value={String(intervalHours)} onValueChange={v => setIntervalHours(Number(v))}>
              <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 horas</SelectItem>
                <SelectItem value="12">12 horas</SelectItem>
                <SelectItem value="24">24 horas</SelectItem>
                <SelectItem value="48">48 horas</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">{contacts.length} contatos dormentes</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Reheat History */}
      <ReheatHistory key={historyKey} />

      {/* Contacts list */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum contato dormente encontrado nesse período 🎉
          </CardContent>
        </Card>
      ) : (
        contacts.map(contact => (
          <Card key={contact.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{contact.name}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tempColor(contact.temperature)}`}>
                      <ThermometerSun className="h-3 w-3 mr-0.5" />
                      {contact.temperature}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {contact.daysSinceContact} dias sem contato
                    </span>
                    {scheduledContacts.has(contact.id) && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/30" variant="outline">
                        <CalendarPlus className="h-3 w-3 mr-0.5" />
                        Reaquecimento agendado
                      </Badge>
                    )}
                  </div>

                  {generatedMessages[contact.id] ? (
                    <div className="space-y-2">
                      <Textarea
                        value={generatedMessages[contact.id]}
                        onChange={e => setGeneratedMessages(prev => ({ ...prev, [contact.id]: e.target.value }))}
                        className="text-sm min-h-[60px]"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => sendMessage(contact)} disabled={sendingFor === contact.id}>
                          {sendingFor === contact.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                          Enviar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => generateMessage(contact)} disabled={generatingFor === contact.id}>
                          <Sparkles className="h-3.5 w-3.5 mr-1" /> Regenerar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => scheduleReheat(contact)} disabled={schedulingFor === contact.id}>
                          {schedulingFor === contact.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CalendarPlus className="h-3.5 w-3.5 mr-1" />}
                          Agendar Reaquecimento
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => generateMessage(contact)} disabled={generatingFor === contact.id}>
                        {generatingFor === contact.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                        Gerar mensagem de reativação
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => scheduleReheat(contact)} disabled={schedulingFor === contact.id}>
                        {schedulingFor === contact.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CalendarPlus className="h-3.5 w-3.5 mr-1" />}
                        Agendar Reaquecimento
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
