import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Copy, Send, Loader2, RefreshCw, Bot, Check, Plus, Calendar, Upload, Image, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Agent {
  id: string;
  group_name: string | null;
  agent_type: string | null;
  system_prompt: string | null;
  knowledge_base: string | null;
  use_persona_context: boolean | null;
  use_copy_formats: boolean | null;
}

interface CampaignPost {
  text: string;
  imageUrl?: string;
  imageFile?: File;
  scheduledAt?: string;
  scheduledId?: string; // sequence_post id after scheduling
}

interface ActiveAgentPanelProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
  messages: { body: string; isFromMe: boolean }[];
  contactName: string;
  contactPhone: string;
  isGroup: boolean;
  onUseAsReply?: (text: string) => void;
  lastMessageTimestamp?: number;
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  custom: '🤖 Personalizado',
  strategist: '🧠 Estrategista',
  analyst: '📊 Analista',
  support: '💬 Suporte/FAQ',
  engager: '🎯 Engajador',
};

export function ActiveAgentPanel({
  open, onClose, instanceId, messages, contactName, contactPhone, isGroup,
  onUseAsReply, lastMessageTimestamp,
}: ActiveAgentPanelProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(true);
  const [campaignPosts, setCampaignPosts] = useState<CampaignPost[]>([]);
  const [schedulingIndex, setSchedulingIndex] = useState<number | null>(null);
  const [schedulingAll, setSchedulingAll] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnalyzedRef = useRef<number>(0);

  // Load agents for this instance
  useEffect(() => {
    if (!open || !instanceId) return;
    supabase.from('whatsapp_ai_agents')
      .select('id, group_name, agent_type, system_prompt, knowledge_base, use_persona_context, use_copy_formats')
      .eq('instance_id', instanceId)
      .then(({ data }) => {
        if (data) setAgents(data);
      });
  }, [open, instanceId]);

  // Auto-analyze on new messages (debounce 3s)
  useEffect(() => {
    if (!open || selectedAgentIds.length === 0 || !lastMessageTimestamp) return;
    if (lastMessageTimestamp <= lastAnalyzedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runAnalysis();
    }, 3000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [lastMessageTimestamp, open, selectedAgentIds]);

  const toggleAgent = (id: string) => {
    setSelectedAgentIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const activateAgents = () => {
    if (selectedAgentIds.length === 0) { toast.error('Selecione pelo menos um agente'); return; }
    setShowSelector(false);
    runAnalysis();
  };

  const runAnalysis = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setAnalysis('');
    setCampaignPosts([]);
    lastAnalyzedRef.current = Date.now();

    const selectedAgents = agents.filter(a => selectedAgentIds.includes(a.id));
    const chatContext = messages.slice(-15).map(m =>
      `${m.isFromMe ? 'Vendedor' : 'Cliente'}: ${m.body}`
    ).join('\n');

    // Build combined prompt with all agent contexts
    let combinedKnowledge = '';
    let combinedPrompts = '';
    selectedAgents.forEach(agent => {
      if (agent.system_prompt) combinedPrompts += `\n--- Agente: ${agent.group_name || AGENT_TYPE_LABELS[agent.agent_type || 'custom']} ---\n${agent.system_prompt}\n`;
      if (agent.knowledge_base) combinedKnowledge += `\n--- Base de Conhecimento (${agent.group_name || 'Agente'}) ---\n${agent.knowledge_base}\n`;
    });

    // Load persona context if any agent requests it
    let personaContext = '';
    const needsPersona = selectedAgents.some(a => a.use_persona_context);
    if (needsPersona) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: persona } = await supabase.from('persona_profiles')
            .select('generated_raio_x, niche, sub_niche, product_description, main_pain, transformation, common_objections, main_differentiator, target_profession, target_age_range')
            .eq('user_id', user.id).maybeSingle();
          if (persona) {
            personaContext = `\n--- Raio-X da Persona ---\n`;
            if (persona.generated_raio_x) personaContext += JSON.stringify(persona.generated_raio_x, null, 2);
            else {
              personaContext += `Nicho: ${persona.niche || ''}\nSub-nicho: ${persona.sub_niche || ''}\nProduto: ${persona.product_description || ''}\nDor principal: ${persona.main_pain || ''}\nTransformação: ${persona.transformation || ''}\nObjeções: ${persona.common_objections || ''}\nDiferencial: ${persona.main_differentiator || ''}\nPúblico: ${persona.target_profession || ''} ${persona.target_age_range || ''}\n`;
            }
          }
        }
      } catch { /* ignore */ }
    }

    const isGroupAnalysis = isGroup;
    const analysisInstruction = isGroupAnalysis
      ? `Você é um time de agentes de IA analisando este GRUPO de WhatsApp em tempo real.

CONTEXTO DO GRUPO: "${contactName}"
${combinedPrompts}
${combinedKnowledge}
${personaContext}

CONVERSA RECENTE:
${chatContext}

Forneça uma análise COMPLETA:

## 📊 Diagnóstico do Grupo
- Nível de engajamento atual
- Temas mais discutidos
- Membros mais ativos vs passivos

## 🎯 Estratégia de Engajamento
- Como aumentar interações
- Oportunidades identificadas

## 📝 Campanha Sugerida
Gere exatamente 3 posts para postar neste grupo. Para cada post, use o formato:

**Post 1:**
\`\`\`campanha
[texto do post aqui]
\`\`\`

**Post 2:**
\`\`\`campanha
[texto do post aqui]
\`\`\`

**Post 3:**
\`\`\`campanha
[texto do post aqui]
\`\`\`

## 💡 Próximas Ações
- Recomendações específicas`
      : `Você é um time de agentes de IA analisando esta conversa X1 em tempo real.

CONTATO: "${contactName}" (${contactPhone})
${combinedPrompts}
${combinedKnowledge}
${personaContext}

CONVERSA RECENTE:
${chatContext}

Forneça uma análise COMPLETA:

## 🔍 Diagnóstico do Lead
- Status atual do lead
- Sinais de interesse ou objeções detectados

## 🧠 Nível de Consciência
- Classificação (Inconsciente / Consciente do Problema / Consciente da Solução / Consciente do Produto / Mais Consciente)
- Justificativa

## 🌡️ Temperatura
- Classificação (Frio / Morno / Quente)
- Motivo

## 🎯 Próxima Ação Recomendada
- O que fazer agora
- Abordagem sugerida

## 💬 Sugestão de Resposta
\`\`\`resposta
[mensagem sugerida para enviar]
\`\`\``;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-strategist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: analysisInstruction }],
          mode: isGroupAnalysis ? 'group' : 'private',
          userId: user?.id,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error('Erro na análise');
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
            if (content) { full += content; setAnalysis(full); }
          } catch { /* partial */ }
        }
      }

      // Extract campaign posts from response
      if (isGroupAnalysis) {
        const campaignRegex = /```campanha\n([\s\S]*?)```/g;
        const posts: CampaignPost[] = [];
        let match;
        while ((match = campaignRegex.exec(full)) !== null) {
          posts.push({ text: match[1].trim() });
        }
        if (posts.length > 0) setCampaignPosts(posts);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast.error('Erro na análise do agente');
      }
    } finally {
      setLoading(false);
    }
  }, [agents, selectedAgentIds, messages, contactName, contactPhone, isGroup, instanceId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis);
    toast.success("Copiado!");
  };

  const extractReply = () => {
    const match = analysis.match(/```resposta\n([\s\S]*?)```/);
    return match?.[1]?.trim() || '';
  };

  const handlePostImageUpload = async (index: number, file: File) => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `campaign_${Date.now()}_${index}.${ext}`;
      const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(path);
      setCampaignPosts(prev => prev.map((p, i) => i === index ? { ...p, imageUrl: publicUrl, imageFile: file } : p));
    } catch {
      toast.error('Erro no upload');
    }
  };

  // --- Real scheduling logic ---
  const schedulePost = async (index: number) => {
    const post = campaignPosts[index];
    if (!post.scheduledAt) { toast.error('Defina data/hora'); return; }
    if (post.scheduledId) { toast.info('Já agendado'); return; }
    setSchedulingIndex(index);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Create or reuse sequence for this campaign
      const seqTitle = `Campanha ${contactName || contactPhone}`;
      let sequenceId: string;

      const { data: existing } = await supabase
        .from('sequences')
        .select('id')
        .eq('user_id', user.id)
        .eq('goal', 'campanha')
        .eq('whatsapp_group_id', contactPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        sequenceId = existing.id;
      } else {
        const { data: newSeq, error } = await supabase.from('sequences').insert({
          user_id: user.id,
          title: seqTitle,
          product: '',
          goal: 'campanha',
          send_mode: 'uazapi',
          whatsapp_group_id: contactPhone,
          whatsapp_group_name: contactName || '',
          total_posts: campaignPosts.length,
        }).select('id').single();
        if (error || !newSeq) throw error || new Error('Erro ao criar sequência');
        sequenceId = newSeq.id;
      }

      const content = post.imageUrl ? `${post.text}\n\n📷 ${post.imageUrl}` : post.text;
      const { data: newPost, error: postErr } = await supabase.from('sequence_posts').insert({
        sequence_id: sequenceId,
        content,
        post_order: index + 1,
        scheduled_at: new Date(post.scheduledAt).toISOString(),
        send_status: 'pending',
        timing: 'Campanha',
        objective: 'Post gerado por agente',
      }).select('id').single();

      if (postErr || !newPost) throw postErr || new Error('Erro ao agendar');
      setCampaignPosts(prev => prev.map((p, i) => i === index ? { ...p, scheduledId: newPost.id } : p));
      toast.success(`Post ${index + 1} agendado para ${new Date(post.scheduledAt).toLocaleString('pt-BR')}`);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao agendar post');
    } finally {
      setSchedulingIndex(null);
    }
  };

  const scheduleAll = async () => {
    const unscheduled = campaignPosts.filter((p, i) => !p.scheduledId && p.scheduledAt);
    if (unscheduled.length === 0) { toast.error('Defina data/hora em pelo menos um post'); return; }
    setSchedulingAll(true);
    for (let i = 0; i < campaignPosts.length; i++) {
      if (!campaignPosts[i].scheduledId && campaignPosts[i].scheduledAt) {
        await schedulePost(i);
      }
    }
    setSchedulingAll(false);
  };

  if (!open) return null;

  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold">Agente Ativo</h3>
          {selectedAgentIds.length > 0 && !showSelector && (
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
              {selectedAgentIds.length}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {!showSelector && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSelector(true)}>
              <Plus className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Agent selector */}
      {showSelector && (
        <div className="p-2 border-b border-border space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium">Selecione os agentes:</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {agents.length === 0 ? (
              <p className="text-[10px] text-muted-foreground py-2 text-center">Nenhum agente configurado</p>
            ) : agents.map(agent => (
              <label key={agent.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                <Checkbox
                  checked={selectedAgentIds.includes(agent.id)}
                  onCheckedChange={() => toggleAgent(agent.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">
                    {agent.group_name || AGENT_TYPE_LABELS[agent.agent_type || 'custom']}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {AGENT_TYPE_LABELS[agent.agent_type || 'custom']}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <Button size="sm" className="w-full h-7 text-xs" onClick={activateAgents} disabled={selectedAgentIds.length === 0}>
            <Bot className="h-3 w-3 mr-1" /> Ativar {selectedAgentIds.length > 0 ? `(${selectedAgentIds.length})` : ''}
          </Button>
        </div>
      )}

      {/* Analysis content */}
      <ScrollArea className="flex-1 px-3 py-2">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-xs text-muted-foreground">Analisando conversa...</span>
            </div>
            {analysis && (
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            )}
          </div>
        ) : analysis ? (
          <div className="space-y-3">
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>

            {/* Campaign posts for groups */}
            {isGroup && campaignPosts.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-[11px] font-semibold text-primary">📝 Posts da Campanha</p>
                {campaignPosts.map((post, i) => (
                  <div key={i} className="rounded-lg border border-border p-2 space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground">Post {i + 1}</p>
                    <Textarea
                      value={post.text}
                      onChange={e => setCampaignPosts(prev => prev.map((p, idx) => idx === i ? { ...p, text: e.target.value } : p))}
                      className="min-h-[60px] text-xs resize-none"
                    />
                    {/* Image upload */}
                    {post.imageUrl ? (
                      <div className="relative">
                        <img src={post.imageUrl} alt="" className="w-full h-20 object-cover rounded" />
                        <Button
                          variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5"
                          onClick={() => setCampaignPosts(prev => prev.map((p, idx) => idx === i ? { ...p, imageUrl: undefined, imageFile: undefined } : p))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        <Upload className="h-3 w-3" />
                        <span>Foto do produto</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handlePostImageUpload(i, f);
                        }} />
                      </label>
                    )}
                    {/* Schedule */}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <Input
                        type="datetime-local"
                        value={post.scheduledAt || ''}
                        onChange={e => setCampaignPosts(prev => prev.map((p, idx) => idx === i ? { ...p, scheduledAt: e.target.value } : p))}
                        className="h-6 text-[10px] flex-1"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="flex-1 h-6 text-[10px]" onClick={() => onUseAsReply?.(post.text)}>
                        <Send className="h-2.5 w-2.5 mr-1" /> Enviar
                      </Button>
                      {post.scheduledId ? (
                        <Badge variant="secondary" className="flex-1 h-6 text-[10px] justify-center gap-1">
                          <CalendarCheck className="h-2.5 w-2.5" /> Agendado
                        </Badge>
                      ) : (
                        <Button
                          variant="secondary" size="sm" className="flex-1 h-6 text-[10px]"
                          disabled={schedulingIndex === i || schedulingAll}
                          onClick={() => schedulePost(i)}
                        >
                          {schedulingIndex === i ? <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" /> : <Calendar className="h-2.5 w-2.5 mr-1" />}
                          Agendar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {campaignPosts.some(p => !p.scheduledId) && (
                  <Button
                    variant="default" size="sm" className="w-full h-7 text-[10px]"
                    disabled={schedulingAll}
                    onClick={scheduleAll}
                  >
                    {schedulingAll ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CalendarCheck className="h-3 w-3 mr-1" />}
                    Agendar Todos
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : !showSelector ? (
          <p className="text-xs text-muted-foreground text-center py-8">Aguardando análise...</p>
        ) : null}
      </ScrollArea>

      {/* Actions */}
      {analysis && !loading && (
        <div className="flex gap-1 p-2 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px]" onClick={handleCopy}>
            <Copy className="h-3 w-3 mr-1" /> Copiar
          </Button>
          {!isGroup && extractReply() && (
            <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={() => onUseAsReply?.(extractReply())}>
              <Send className="h-3 w-3 mr-1" /> Usar resposta
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={runAnalysis}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
