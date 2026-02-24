import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Bot, MessageSquare, Clock, TrendingUp, Users, Zap, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FollowupAgentWidget } from "@/components/admin/chat/FollowupAgentWidget";

interface AgentStats {
  id: string;
  group_name: string | null;
  group_id: string;
  agent_type: string;
  is_active: boolean;
  responses_this_hour: number;
  max_responses_per_hour: number;
  created_at: string;
  updated_at: string;
  use_persona_context: boolean;
  use_copy_formats: boolean;
  knowledge_base: string;
}

interface MessageStats {
  total: number;
  fromMe: number;
  fromOthers: number;
  today: number;
  thisWeek: number;
}

const AGENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  strategist: { label: 'Estrategista', color: 'hsl(25, 95%, 53%)' },
  analyst: { label: 'Analista', color: 'hsl(217, 91%, 60%)' },
  support: { label: 'Suporte', color: 'hsl(142, 71%, 45%)' },
  engager: { label: 'Engajador', color: 'hsl(271, 91%, 65%)' },
  custom: { label: 'Personalizado', color: 'hsl(215, 20%, 65%)' },
};

export default function WhatsAppAnalytics() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [messageStats, setMessageStats] = useState<MessageStats>({ total: 0, fromMe: 0, fromOthers: 0, today: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("7d");
  const [dailyData, setDailyData] = useState<{ date: string; sent: number; received: number }[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);

    const daysBack = period === '1d' ? 1 : period === '7d' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const [{ data: agentsData }, { data: messagesData }] = await Promise.all([
      supabase.from('whatsapp_ai_agents').select('*').order('created_at', { ascending: false }),
      supabase.from('whatsapp_messages')
        .select('is_from_me, created_at')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true }),
    ]);

    if (agentsData) setAgents(agentsData as unknown as AgentStats[]);

    if (messagesData) {
      const today = new Date().toDateString();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      setMessageStats({
        total: messagesData.length,
        fromMe: messagesData.filter(m => m.is_from_me).length,
        fromOthers: messagesData.filter(m => !m.is_from_me).length,
        today: messagesData.filter(m => new Date(m.created_at || '').toDateString() === today).length,
        thisWeek: messagesData.filter(m => new Date(m.created_at || '') >= weekAgo).length,
      });

      // Build daily chart data
      const dayMap = new Map<string, { sent: number; received: number }>();
      messagesData.forEach(m => {
        const day = new Date(m.created_at || '').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const entry = dayMap.get(day) || { sent: 0, received: 0 };
        if (m.is_from_me) entry.sent++; else entry.received++;
        dayMap.set(day, entry);
      });
      setDailyData(Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v })));
    }

    setLoading(false);
  };

  const activeAgents = agents.filter(a => a.is_active).length;
  const totalResponses = agents.reduce((sum, a) => sum + (a.responses_this_hour || 0), 0);
  const responseRate = messageStats.total > 0 ? Math.round((messageStats.fromMe / messageStats.total) * 100) : 0;

  // Pie chart data for agent types
  const typeCounts = agents.reduce((acc, a) => {
    const t = a.agent_type || 'custom';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(typeCounts).map(([name, value]) => ({
    name: AGENT_TYPE_LABELS[name]?.label || name,
    value,
    color: AGENT_TYPE_LABELS[name]?.color || 'hsl(215, 20%, 65%)',
  }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Analytics WhatsApp</h1>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1d" className="text-xs">Hoje</SelectItem>
            <SelectItem value="7d" className="text-xs">7 dias</SelectItem>
            <SelectItem value="30d" className="text-xs">30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase">Total Mensagens</span>
            </div>
            <p className="text-2xl font-bold">{messageStats.total.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{messageStats.today} hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-[10px] text-muted-foreground uppercase">Taxa de Resposta</span>
            </div>
            <p className="text-2xl font-bold">{responseRate}%</p>
            <p className="text-[10px] text-muted-foreground">{messageStats.fromMe} enviadas / {messageStats.fromOthers} recebidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-4 w-4 text-purple-500" />
              <span className="text-[10px] text-muted-foreground uppercase">Agentes Ativos</span>
            </div>
            <p className="text-2xl font-bold">{activeAgents}</p>
            <p className="text-[10px] text-muted-foreground">{agents.length} total configurados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-[10px] text-muted-foreground uppercase">Respostas IA/Hora</span>
            </div>
            <p className="text-2xl font-bold">{totalResponses}</p>
            <p className="text-[10px] text-muted-foreground">Nesta hora</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Mensagens por Dia</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {dailyData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Sem dados no período</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="received" name="Recebidas" fill="hsl(217, 91%, 60%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="sent" name="Enviadas" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Tipos de Agente</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {pieData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhum agente</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance dos Agentes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {agents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum agente configurado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Grupo</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Resp/Hora</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Contexto</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Última atividade</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(agent => {
                    const typeInfo = AGENT_TYPE_LABELS[agent.agent_type || 'custom'] || AGENT_TYPE_LABELS.custom;
                    return (
                      <tr key={agent.id} className="border-b border-border/50">
                        <td className="py-2 font-medium">{agent.group_name || agent.group_id}</td>
                        <td className="py-2">
                          <Badge variant="outline" className="text-[10px]">{typeInfo.label}</Badge>
                        </td>
                        <td className="py-2 text-center">
                          <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-[10px]">
                            {agent.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="py-2 text-center">{agent.responses_this_hour}/{agent.max_responses_per_hour}</td>
                        <td className="py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            {agent.use_persona_context && <Badge variant="secondary" className="text-[9px]">🎯</Badge>}
                            {agent.use_copy_formats && <Badge variant="secondary" className="text-[9px]">📋</Badge>}
                            {agent.knowledge_base && <Badge variant="secondary" className="text-[9px]">📚</Badge>}
                          </div>
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {agent.updated_at ? new Date(agent.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Follow-up Widget */}
      <FollowupAgentWidget />
    </div>
  );
}
