import { CrmPipelineStage, CrmDeal } from '@/hooks/useCrmData';
import { DealCard } from './DealCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PipelineColumnProps {
  stage: CrmPipelineStage;
  deals: CrmDeal[];
  onDealDrop: (dealId: string, stageId: string) => void;
  onDealClick?: (deal: CrmDeal) => void;
  onAddDeal?: (stageId: string) => void;
}

export function PipelineColumn({ stage, deals, onDealDrop, onDealClick, onAddDeal }: PipelineColumnProps) {
  const [dragOver, setDragOver] = useState(false);
  const totalValue = deals.reduce((sum, d) => sum + Number(d.value || 0), 0);

  return (
    <div
      className={`flex flex-col min-w-[260px] max-w-[260px] rounded-lg border transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        const dealId = e.dataTransfer.getData('deal-id');
        if (dealId) onDealDrop(dealId, stage.id);
      }}
    >
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-xs font-semibold text-foreground">{stage.name}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{deals.length}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">R$ {totalValue.toLocaleString('pt-BR')}</p>
      </div>
      <ScrollArea className="flex-1 p-2 max-h-[calc(100vh-320px)]">
        <div className="flex flex-col gap-2">
          {deals.map(deal => (
            <DealCard key={deal.id} deal={deal} onClick={() => onDealClick?.(deal)} />
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-border">
        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => onAddDeal?.(stage.id)}>
          <Plus className="h-3 w-3 mr-1" /> ADICIONAR
        </Button>
      </div>
    </div>
  );
}
