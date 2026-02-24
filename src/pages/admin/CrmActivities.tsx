import { useState } from 'react';
import { useCrmActivities, useCrmContacts, useCrmDeals } from '@/hooks/useCrmData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityDialog } from '@/components/crm/ActivityDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeLabels: Record<string, string> = {
  note: '📝 Nota', call: '📞 Ligação', whatsapp: '💬 WhatsApp',
  email: '📧 Email', meeting: '🤝 Reunião', task: '✅ Tarefa',
};

export default function CrmActivities() {
  const { user } = useAuth();
  const { activities, loading, create, complete, remove } = useCrmActivities();
  const { contacts } = useCrmContacts();
  const { deals } = useCrmDeals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = activities.filter(a => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterStatus === 'pending' && a.completed_at) return false;
    if (filterStatus === 'done' && !a.completed_at) return false;
    return true;
  });

  const handleSave = async (data: any) => {
    const { error } = await create({ ...data, created_by: user!.id });
    if (error) toast.error('Erro ao criar atividade');
    else toast.success('Atividade criada!');
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Atividades</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="done">Concluídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade encontrada</p>
        ) : filtered.map(a => (
          <Card key={a.id} className="p-3 flex items-start gap-3">
            <button
              onClick={async () => {
                if (a.completed_at) return;
                const { error } = await complete(a.id);
                if (error) toast.error('Erro ao completar');
                else toast.success('Concluída!');
              }}
              className="mt-0.5 flex-shrink-0"
            >
              {a.completed_at ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${a.completed_at ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{a.title}</span>
                <Badge variant="outline" className="text-[10px]">{typeLabels[a.type] || a.type}</Badge>
              </div>
              {a.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.description}</p>}
              <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                {a.contact && <span>👤 {(a.contact as any).name}</span>}
                {a.deal && <span>💼 {(a.deal as any).title}</span>}
                {a.due_date && <span>📅 {format(new Date(a.due_date), 'dd/MM/yy HH:mm', { locale: ptBR })}</span>}
                <span>{format(new Date(a.created_at), 'dd/MM/yy', { locale: ptBR })}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={async () => {
              const { error } = await remove(a.id);
              if (error) toast.error('Erro ao excluir');
              else toast.success('Atividade excluída');
            }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Card>
        ))}
      </div>

      <ActivityDialog open={dialogOpen} onOpenChange={setDialogOpen} contacts={contacts} deals={deals} onSave={handleSave} />
    </div>
  );
}
