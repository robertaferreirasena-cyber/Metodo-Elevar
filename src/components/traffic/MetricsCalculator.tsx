import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, DollarSign, Target, BarChart3, AlertTriangle, CheckCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function MetricsCalculator() {
  const [budget, setBudget] = useState(1000);
  const [cpc, setCpc] = useState(1.5);
  const [conversionRate, setConversionRate] = useState(3);
  const [averageTicket, setAverageTicket] = useState(97);
  const [weeks, setWeeks] = useState(4);
  const [costPerLead, setCostPerLead] = useState(5);

  const metrics = useMemo(() => {
    const dailyBudget = budget / 30;
    const weeklyBudget = budget / 4;
    const clicks = cpc > 0 ? budget / cpc : 0;
    const leads = costPerLead > 0 ? budget / costPerLead : 0;
    const conversions = clicks * (conversionRate / 100);
    const revenue = conversions * averageTicket;
    const roas = budget > 0 ? revenue / budget : 0;
    const cpa = conversions > 0 ? budget / conversions : 0;
    const profit = revenue - budget;
    const roi = budget > 0 ? (profit / budget) * 100 : 0;

    // Break-even calculation
    const revenuePerClick = averageTicket * (conversionRate / 100);
    const breakEvenClicks = revenuePerClick > 0 ? Math.ceil(budget / revenuePerClick) : Infinity;
    const breakEvenSpend = breakEvenClicks * cpc;
    const dailyClicks = cpc > 0 ? dailyBudget / cpc : 0;
    const breakEvenDays = dailyClicks > 0 ? Math.ceil(breakEvenClicks / dailyClicks) : Infinity;
    const breakEvenWeek = Math.ceil(breakEvenDays / 7);

    // Weekly projection data
    const weeklyData = [];
    let cumulativeSpend = 0;
    let cumulativeRevenue = 0;
    for (let w = 1; w <= Math.max(weeks, 8); w++) {
      cumulativeSpend += weeklyBudget;
      const weekClicks = weeklyBudget / (cpc || 1);
      const weekConversions = weekClicks * (conversionRate / 100);
      cumulativeRevenue += weekConversions * averageTicket;
      weeklyData.push({
        week: `Sem ${w}`,
        investimento: Math.round(cumulativeSpend),
        receita: Math.round(cumulativeRevenue),
        lucro: Math.round(cumulativeRevenue - cumulativeSpend),
      });
    }

    return {
      dailyBudget, weeklyBudget, clicks, leads, conversions, revenue,
      roas, cpa, profit, roi, breakEvenDays, breakEvenWeek, breakEvenSpend,
      weeklyData, revenuePerClick,
    };
  }, [budget, cpc, conversionRate, averageTicket, weeks, costPerLead]);

  const isBreakEvenReachable = metrics.breakEvenDays !== Infinity && metrics.breakEvenDays <= 90;
  const isProfitable = metrics.roas >= 1;

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Calculadora de Métricas & Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Orçamento mensal (R$)</Label>
              <Input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">CPC médio (R$)</Label>
              <Input type="number" step="0.1" value={cpc} onChange={e => setCpc(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Taxa de conversão (%)</Label>
              <Input type="number" step="0.1" value={conversionRate} onChange={e => setConversionRate(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Ticket médio (R$)</Label>
              <Input type="number" value={averageTicket} onChange={e => setAverageTicket(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Custo por Lead (R$)</Label>
              <Input type="number" step="0.5" value={costPerLead} onChange={e => setCostPerLead(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Semanas de análise</Label>
              <Input type="number" value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="mt-1" min={1} max={12} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cliques estimados</p>
            <p className="text-xl font-bold text-foreground">{Math.round(metrics.clicks).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">~{Math.round(metrics.clicks / 30)}/dia</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Conversões</p>
            <p className="text-xl font-bold text-foreground">{metrics.conversions.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">CPA: R$ {metrics.cpa.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Receita estimada</p>
            <p className="text-xl font-bold text-foreground">R$ {metrics.revenue.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">ROAS: {metrics.roas.toFixed(2)}x</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${isProfitable ? "border-l-emerald-500" : "border-l-red-500"}`}>
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lucro/Prejuízo</p>
            <p className={`text-xl font-bold ${isProfitable ? "text-emerald-600" : "text-red-600"}`}>
              R$ {metrics.profit.toFixed(0)}
            </p>
            <p className="text-[10px] text-muted-foreground">ROI: {metrics.roi.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Orçamento diário</p>
            <p className="text-lg font-semibold">R$ {metrics.dailyBudget.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Orçamento semanal</p>
            <p className="text-lg font-semibold">R$ {metrics.weeklyBudget.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Leads estimados</p>
            <p className="text-lg font-semibold">{Math.round(metrics.leads)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Receita por clique</p>
            <p className="text-lg font-semibold">R$ {metrics.revenuePerClick.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Break-even Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Previsão de Break-Even
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            {isBreakEvenReachable ? (
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            )}
            <div>
              {isBreakEvenReachable ? (
                <>
                  <p className="text-sm font-medium">
                    Break-even estimado em <span className="text-emerald-600 font-bold">{metrics.breakEvenDays} dias</span> (Semana {metrics.breakEvenWeek})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quando o investimento acumulado de R$ {metrics.breakEvenSpend.toFixed(0)} será coberto pela receita gerada.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-amber-600">Break-even não atingível com os parâmetros atuais</p>
                  <p className="text-xs text-muted-foreground">
                    Aumente a taxa de conversão ou o ticket médio para tornar a campanha rentável.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Weekly chart */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Projeção Semanal: Investimento vs Receita</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toLocaleString()}`,
                      name === "investimento" ? "Investimento" : name === "receita" ? "Receita" : "Lucro",
                    ]}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="investimento" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="lucro" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-destructive rounded" />
                <span className="text-[10px] text-muted-foreground">Investimento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-primary rounded" />
                <span className="text-[10px] text-muted-foreground">Receita</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-emerald-500 rounded" style={{ borderStyle: "dashed" }} />
                <span className="text-[10px] text-muted-foreground">Lucro</span>
              </div>
            </div>
          </div>

          {/* Performance indicators */}
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase">ROAS Mínimo Viável</p>
              <p className="text-lg font-bold">1.00x</p>
              <Badge variant={metrics.roas >= 1 ? "default" : "destructive"} className="text-[9px] mt-1">
                {metrics.roas >= 1 ? "✅ Acima" : "❌ Abaixo"}
              </Badge>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase">Seu ROAS</p>
              <p className={`text-lg font-bold ${metrics.roas >= 2 ? "text-emerald-600" : metrics.roas >= 1 ? "text-amber-600" : "text-red-600"}`}>
                {metrics.roas.toFixed(2)}x
              </p>
              <Badge variant="outline" className="text-[9px] mt-1">
                {metrics.roas >= 3 ? "🔥 Excelente" : metrics.roas >= 2 ? "👍 Bom" : metrics.roas >= 1 ? "⚠️ Marginal" : "❌ Negativo"}
              </Badge>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase">CPA Máximo</p>
              <p className="text-lg font-bold">R$ {averageTicket.toFixed(0)}</p>
              <Badge variant={metrics.cpa <= averageTicket ? "default" : "destructive"} className="text-[9px] mt-1">
                {metrics.cpa <= averageTicket ? "✅ Dentro" : "❌ Acima"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
