import { CrmDeal } from '@/hooks/useCrmData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: 'Alta', className: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Média', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: 'Baixa', className: 'bg-green-100 text-green-700 border-green-200' },
};

interface DealCardProps {
  deal: CrmDeal;
  onClick?: () => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const prio = priorityConfig[deal.priority] || priorityConfig.medium;

  return (
    <Card
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('deal-id', deal.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="font-medium text-sm text-foreground truncate flex-1">{deal.title}</p>
        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${prio.className}`}>{prio.label}</Badge>
      </div>
      {deal.contact && (
        <p className="text-xs text-muted-foreground mt-1 truncate">👤 {deal.contact.name}</p>
      )}
      {deal.notes && (
        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 italic">{deal.notes}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        {deal.value > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            R$ {Number(deal.value).toLocaleString('pt-BR')}
          </Badge>
        )}
        {deal.expected_close_date && (
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(deal.expected_close_date), 'dd/MM', { locale: ptBR })}
          </span>
        )}
      </div>
    </Card>
  );
}
