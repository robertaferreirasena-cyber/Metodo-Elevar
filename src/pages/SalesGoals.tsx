import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Save, TrendingUp, AlertTriangle, CheckCircle2, Plus, DollarSign, ShoppingCart, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MissionContextBanner } from "@/components/learning/MissionContextBanner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isBefore, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const NICHE_OPTIONS = [
  "Beleza", "Alimentação", "Moda", "Serviços", "Digital", "Saúde", "Educação", "Outro"
];

interface SalesGoal {
  id: string;
  monthly_target: number;
  average_ticket: number;
  working_days: number;
  niche: string | null;
  month: string;
}

interface SalesRecord {
  id: string;
  goal_id: string;
  record_date: string;
  quantity: number;
  total_value: number;
  notes: string | null;
}

export default function SalesGoals() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<SalesGoal | null>(null);
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [averageTicket, setAverageTicket] = useState("");
  const [workingDays, setWorkingDays] = useState("22");
  const [niche, setNiche] = useState("");

  // Record form
  const [recordQty, setRecordQty] = useState("");
  const [recordValue, setRecordValue] = useState("");
  const [recordNotes, setRecordNotes] = useState("");

  const currentMonth = startOfMonth(new Date());
  const monthStr = format(currentMonth, "yyyy-MM-dd");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: goalData } = await supabase
        .from("sales_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", monthStr)
        .maybeSingle();

      if (goalData) {
        setGoal(goalData as SalesGoal);
        setMonthlyTarget(String(goalData.monthly_target));
        setAverageTicket(String(goalData.average_ticket));
        setWorkingDays(String(goalData.working_days));
        setNiche(goalData.niche || "");

        const { data: recordsData } = await supabase
          .from("sales_records")
          .select("*")
          .eq("goal_id", goalData.id)
          .order("record_date", { ascending: true });

        setRecords((recordsData as SalesRecord[]) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    const target = parseFloat(monthlyTarget);
    const ticket = parseFloat(averageTicket);
    const days = parseInt(workingDays);

    if (!target || !ticket || !days) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      if (goal) {
        await supabase
          .from("sales_goals")
          .update({ monthly_target: target, average_ticket: ticket, working_days: days, niche: niche || null })
          .eq("id", goal.id);
      } else {
        await supabase
          .from("sales_goals")
          .insert({ user_id: user.id, monthly_target: target, average_ticket: ticket, working_days: days, niche: niche || null, month: monthStr });
      }
      toast.success("Configuração salva!");
      await loadData();
    } catch (err) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRecord = async () => {
    if (!user || !goal) return;
    const qty = parseInt(recordQty);
    const value = parseFloat(recordValue);

    if (!qty || !value) {
      toast.error("Preencha quantidade e valor");
      return;
    }

    const today = format(new Date(), "yyyy-MM-dd");
    try {
      const existing = records.find(r => r.record_date === today);
      if (existing) {
        await supabase
          .from("sales_records")
          .update({ quantity: existing.quantity + qty, total_value: Number(existing.total_value) + value, notes: recordNotes || existing.notes })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("sales_records")
          .insert({ user_id: user.id, goal_id: goal.id, record_date: today, quantity: qty, total_value: value, notes: recordNotes || null });
      }
      toast.success("Venda registrada! 🎉");
      setRecordQty("");
      setRecordValue("");
      setRecordNotes("");
      await loadData();
    } catch (err) {
      toast.error("Erro ao registrar venda");
    }
  };

  // Calculations
  const stats = useMemo(() => {
    if (!goal) return null;
    const target = Number(goal.monthly_target);
    const ticket = Number(goal.average_ticket);
    const days = goal.working_days;

    const totalSold = records.reduce((sum, r) => sum + Number(r.total_value), 0);
    const totalQty = records.reduce((sum, r) => sum + r.quantity, 0);

    // Count working days passed (excluding weekends)
    const monthEnd = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start: currentMonth, end: monthEnd });
    const workDays = allDays.filter(d => !isWeekend(d));
    const today = new Date();
    const passedWorkDays = workDays.filter(d => isBefore(d, today) || isToday(d)).length;
    const remainingDays = Math.max(days - passedWorkDays, 1);

    const remaining = Math.max(target - totalSold, 0);
    const adjustedDailyTarget = remaining / remainingDays;
    const dailySalesNeeded = ticket > 0 ? Math.ceil(adjustedDailyTarget / ticket) : 0;
    const progressPercent = target > 0 ? Math.min((totalSold / target) * 100, 100) : 0;

    // Check missed days
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");
    const hadSalesYesterday = records.some(r => r.record_date === yesterdayStr);
    const isYesterdayWorkday = !isWeekend(yesterday) && !isBefore(yesterday, currentMonth);
    const missedYesterday = isYesterdayWorkday && !hadSalesYesterday && passedWorkDays > 1;

    return {
      target, ticket, totalSold, totalQty, remaining,
      adjustedDailyTarget, dailySalesNeeded, progressPercent,
      passedWorkDays, remainingDays, missedYesterday,
    };
  }, [goal, records, currentMonth]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <MissionContextBanner />
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Metas Elevar</h1>
          <p className="text-sm text-muted-foreground">
            Simulador e tracker de metas de vendas — {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Config Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            ⚙️ Configuração da Meta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Meta Mensal (R$) *</Label>
              <Input type="number" placeholder="10000" value={monthlyTarget} onChange={e => setMonthlyTarget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Ticket Médio (R$) *</Label>
              <Input type="number" placeholder="150" value={averageTicket} onChange={e => setAverageTicket(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Dias Úteis do Mês *</Label>
              <Input type="number" placeholder="22" value={workingDays} onChange={e => setWorkingDays(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Nicho</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger><SelectValue placeholder="Selecione seu nicho" /></SelectTrigger>
                <SelectContent>
                  {NICHE_OPTIONS.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSaveGoal} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {goal ? "Atualizar" : "Salvar"} Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {goal && stats && (
        <>
          {/* Alert for missed day */}
          {stats.missedYesterday && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Vendas não registradas ontem</p>
                  <p className="text-xs text-muted-foreground">Sua meta diária foi ajustada. Se vendeu ontem, registre abaixo.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-[10px] text-muted-foreground">Vendas/dia necessárias</p>
                <p className="text-2xl font-bold text-foreground">{stats.dailySalesNeeded}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Faturamento/dia</p>
                <p className="text-lg font-bold text-foreground">
                  R$ {stats.adjustedDailyTarget.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Total Vendido</p>
                <p className="text-lg font-bold text-foreground">
                  R$ {stats.totalSold.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Falta</p>
                <p className="text-lg font-bold text-foreground">
                  R$ {stats.remaining.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso da Meta</span>
                <Badge variant={stats.progressPercent >= 100 ? "default" : "secondary"}>
                  {stats.progressPercent.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={stats.progressPercent} className="h-3" />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  R$ {stats.totalSold.toLocaleString("pt-BR")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  R$ {stats.target.toLocaleString("pt-BR")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Register Sale */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" /> Registrar Venda de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Quantidade</Label>
                  <Input type="number" placeholder="1" value={recordQty} onChange={e => setRecordQty(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valor Total (R$)</Label>
                  <Input type="number" placeholder="150" value={recordValue} onChange={e => setRecordValue(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Obs. (opcional)</Label>
                  <Input placeholder="Detalhes..." value={recordNotes} onChange={e => setRecordNotes(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleAddRecord} className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Registrar
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          {records.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Histórico do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...records].reverse().map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="text-sm font-medium">
                          {format(parseISO(r.record_date), "dd/MM")} — {r.quantity} venda{r.quantity > 1 ? "s" : ""}
                        </p>
                        {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                      </div>
                      <span className="text-sm font-bold text-emerald-600">
                        R$ {Number(r.total_value).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
