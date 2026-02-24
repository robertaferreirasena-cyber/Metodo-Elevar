import { useState, useMemo } from 'react';
import { useCrmDeals, useCrmStages, useCrmContacts } from '@/hooks/useCrmData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PipelineColumn } from '@/components/crm/PipelineColumn';
import { DealDialog } from '@/components/crm/DealDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { CrmDeal } from '@/hooks/useCrmData';

export default function CrmPipeline() {
  const { user } = useAuth();
  const { deals, create, update } = useCrmDeals();
  const { stages } = useCrmStages();
  const { contacts } = useCrmContacts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<CrmDeal | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      if (priorityFilter !== 'all' && d.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchContact = d.contact?.name?.toLowerCase().includes(q);
        if (!matchTitle && !matchContact) return false;
      }
      return true;
    });
  }, [deals, searchQuery, priorityFilter]);

  const handleDealDrop = async (dealId: string, stageId: string) => {
    const { error } = await update(dealId, { stage_id: stageId });
    if (error) toast.error('Erro ao mover deal');
  };

  const handleSave = async (data: Partial<CrmDeal>) => {
    if (editingDeal) {
      const { error } = await update(editingDeal.id, data);
      if (error) toast.error('Erro ao atualizar deal');
      else toast.success('Deal atualizado!');
    } else {
      const { error } = await create({ ...data, created_by: user!.id, status: 'open' });
      if (error) toast.error('Erro ao criar deal');
      else toast.success('Deal criado!');
    }
  };

  const handleAddInline = (stageId: string) => {
    setEditingDeal(null);
    setDefaultStageId(stageId);
    setDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Pipeline de Vendas</h1>
        <Button size="sm" onClick={() => { setEditingDeal(null); setDefaultStageId(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Deal
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou contato..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">🔴 Alta</SelectItem>
            <SelectItem value="medium">🟡 Média</SelectItem>
            <SelectItem value="low">🟢 Baixa</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || priorityFilter !== 'all') && (
          <span className="text-xs text-muted-foreground">{filteredDeals.length} deal(s)</span>
        )}
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {stages.map(stage => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              deals={filteredDeals.filter(d => d.stage_id === stage.id)}
              onDealDrop={handleDealDrop}
              onDealClick={deal => { setEditingDeal(deal); setDefaultStageId(undefined); setDialogOpen(true); }}
              onAddDeal={handleAddInline}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DealDialog open={dialogOpen} onOpenChange={setDialogOpen} deal={editingDeal} contacts={contacts} stages={stages} defaultStageId={defaultStageId} onSave={handleSave} />
    </div>
  );
}
