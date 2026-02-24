import { useCrmContacts, useCrmDeals, useCrmActivities, useCrmStages } from '@/hooks/useCrmData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, CheckCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FollowupAgentWidget } from '@/components/admin/chat/FollowupAgentWidget';

export default function CrmDashboard() {
  const { contacts } = useCrmContacts();
  const { deals } = useCrmDeals();
  const { activities } = useCrmActivities();
  const { stages } = useCrmStages();

  const openDeals = deals.filter(d => d.status === 'open');
  const wonDeals = deals.filter(d => d.status === 'won');
  const totalPipeline = openDeals.reduce((s, d) => s + Number(d.value || 0), 0);
  const conversionRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  const funnelData = stages.map(stage => ({
    name: stage.name,
    value: deals.filter(d => d.stage_id === stage.id).length,
    color: stage.color,
  }));

  const pendingActivities = activities
    .filter(a => !a.completed_at && a.type === 'task')
    .slice(0, 5);

  const recentDeals = deals.slice(0, 5);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-bold text-foreground">CRM Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{contacts.length}</p>
              <p className="text-xs text-muted-foreground">Contatos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{openDeals.length}</p>
              <p className="text-xs text-muted-foreground">Deals Abertos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">R$ {totalPipeline.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Pipeline</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Conversão</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Funil de Vendas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Tarefas Pendentes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pendingActivities.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma tarefa pendente</p>
              ) : pendingActivities.map(a => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate flex-1">{a.title}</span>
                  {a.due_date && <span className="text-muted-foreground">{format(new Date(a.due_date), 'dd/MM', { locale: ptBR })}</span>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Deals Recentes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recentDeals.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum deal criado</p>
              ) : recentDeals.map(d => (
                <div key={d.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{d.title}</span>
                  <span className="text-muted-foreground font-medium">R$ {Number(d.value).toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <FollowupAgentWidget />
        </div>
      </div>
    </div>
  );
}
