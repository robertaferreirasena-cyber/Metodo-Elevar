import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Plus, Brain, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AgentKB {
  id: string;
  agent_key: string;
  agent_name: string;
  system_prompt: string;
  updated_at: string;
}

export default function AdminKnowledgeBase() {
  const [agents, setAgents] = useState<AgentKB[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<AgentKB | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState({ agent_key: '', agent_name: '', system_prompt: '' });

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agent_knowledge_base' as any)
      .select('*')
      .order('agent_name');
    if (!error && data) setAgents(data as unknown as AgentKB[]);
    setLoading(false);
  };

  const savePrompt = async (agent: AgentKB) => {
    setSaving(agent.id);
    const { error } = await (supabase.from('agent_knowledge_base' as any) as any)
      .update({ system_prompt: agent.system_prompt, updated_at: new Date().toISOString() })
      .eq('id', agent.id);
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success(`Prompt de "${agent.agent_name}" atualizado!`);
    }
    setSaving(null);
  };

  const createAgent = async () => {
    if (!newForm.agent_key || !newForm.agent_name || !newForm.system_prompt) {
      toast.error('Preencha todos os campos');
      return;
    }
    const { error } = await (supabase.from('agent_knowledge_base' as any) as any)
      .insert({ agent_key: newForm.agent_key, agent_name: newForm.agent_name, system_prompt: newForm.system_prompt });
    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      toast.success('Agente criado!');
      setNewDialogOpen(false);
      setNewForm({ agent_key: '', agent_name: '', system_prompt: '' });
      fetchAgents();
    }
  };

  const deleteAgent = async (agent: AgentKB) => {
    if (!confirm(`Excluir agente "${agent.agent_name}"?`)) return;
    const { error } = await (supabase.from('agent_knowledge_base' as any) as any)
      .delete()
      .eq('id', agent.id);
    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      toast.success('Agente excluído');
      fetchAgents();
    }
  };

  const updateLocalPrompt = (id: string, prompt: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, system_prompt: prompt } : a));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento IA</h1>
          <p className="text-muted-foreground">Edite os prompts dos agentes de IA</p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo Agente
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Nenhum agente cadastrado ainda.</p>
            <p className="text-sm text-muted-foreground">
              Adicione agentes para que os edge functions usem prompts editáveis.
            </p>
          </CardContent>
        </Card>
      ) : (
        agents.map(agent => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    {agent.agent_name}
                  </CardTitle>
                  <CardDescription>
                    Chave: <code className="bg-muted px-1 rounded">{agent.agent_key}</code>
                    {agent.updated_at && (
                      <> • Atualizado: {new Date(agent.updated_at).toLocaleDateString('pt-BR')}</>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => savePrompt(agent)}
                    disabled={saving === agent.id}
                  >
                    {saving === agent.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Salvar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteAgent(agent)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={agent.system_prompt}
                onChange={(e) => updateLocalPrompt(agent.id, e.target.value)}
                rows={12}
                className="font-mono text-xs"
                placeholder="System prompt do agente..."
              />
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Agente IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chave (ex: mentora-gi, sales-strategist)</Label>
              <Input value={newForm.agent_key} onChange={e => setNewForm(f => ({ ...f, agent_key: e.target.value }))} />
            </div>
            <div>
              <Label>Nome do Agente</Label>
              <Input value={newForm.agent_name} onChange={e => setNewForm(f => ({ ...f, agent_name: e.target.value }))} />
            </div>
            <div>
              <Label>System Prompt</Label>
              <Textarea
                value={newForm.system_prompt}
                onChange={e => setNewForm(f => ({ ...f, system_prompt: e.target.value }))}
                rows={10}
                className="font-mono text-xs"
              />
            </div>
            <Button onClick={createAgent} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Criar Agente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
