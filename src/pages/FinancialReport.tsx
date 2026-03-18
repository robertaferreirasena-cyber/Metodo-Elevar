import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, RefreshCw, TrendingUp, TrendingDown, Target, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface FinancialMapData {
  fixedCosts: { id: string; name: string; value: number }[];
  variableCosts: { id: string; name: string; percent: number }[];
  proLabore: number;
  monthlyRevenue: number;
  taxPercent: number;
}

interface SalesGoal {
  monthly_target: number;
  average_ticket: number;
  working_days: number;
  niche: string | null;
}

interface SalesRecord {
  record_date: string;
  quantity: number;
  total_value: number;
  notes: string | null;
}

export default function FinancialReport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mapData, setMapData] = useState<FinancialMapData | null>(null);
  const [salesGoal, setSalesGoal] = useState<SalesGoal | null>(null);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);

  const currentMonth = startOfMonth(new Date());
  const monthStr = format(currentMonth, "yyyy-MM-dd");
  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: ptBR });

  useEffect(() => {
    if (user) loadAllData();
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load financial map
      const { data: snapshot } = await supabase
        .from("financial_snapshots")
        .select("data")
        .eq("user_id", user.id)
        .eq("snapshot_type", "financial_map")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (snapshot?.data) {
        setMapData(snapshot.data as unknown as FinancialMapData);
      }

      // Load sales goal
      const { data: goalData } = await supabase
        .from("sales_goals")
        .select("monthly_target, average_ticket, working_days, niche")
        .eq("user_id", user.id)
        .eq("month", monthStr)
        .maybeSingle();

      if (goalData) {
        setSalesGoal(goalData as SalesGoal);

        // Load sales records
        const { data: goalFull } = await supabase
          .from("sales_goals")
          .select("id")
          .eq("user_id", user.id)
          .eq("month", monthStr)
          .maybeSingle();

        if (goalFull) {
          const { data: records } = await supabase
            .from("sales_records")
            .select("record_date, quantity, total_value, notes")
            .eq("goal_id", goalFull.id)
            .order("record_date", { ascending: true });
          setSalesRecords((records as SalesRecord[]) || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Financial map calculations
  const financials = useMemo(() => {
    if (!mapData) return null;
    const totalFixed = mapData.fixedCosts?.reduce((s, c) => s + (c.value || 0), 0) || 0;
    const totalVariablePercent = mapData.variableCosts?.reduce((s, c) => s + (c.percent || 0), 0) || 0;
    const revenue = mapData.monthlyRevenue || 0;
    const variableAmount = revenue * (totalVariablePercent / 100);
    const taxAmount = revenue * ((mapData.taxPercent || 0) / 100);
    const proLabore = mapData.proLabore || 0;
    const totalExpenses = totalFixed + variableAmount + proLabore + taxAmount;
    const realProfit = revenue - totalExpenses;
    const realMargin = revenue > 0 ? (realProfit / revenue) * 100 : 0;
    const breakEven = (1 - totalVariablePercent / 100 - (mapData.taxPercent || 0) / 100) > 0
      ? (totalFixed + proLabore) / (1 - totalVariablePercent / 100 - (mapData.taxPercent || 0) / 100)
      : 0;

    return {
      totalFixed, totalVariablePercent, variableAmount, taxAmount, proLabore,
      revenue, totalExpenses, realProfit, realMargin, breakEven,
      fixedCosts: mapData.fixedCosts || [],
      variableCosts: mapData.variableCosts || [],
      taxPercent: mapData.taxPercent || 0,
    };
  }, [mapData]);

  // Sales calculations
  const salesStats = useMemo(() => {
    if (!salesGoal) return null;
    const target = salesGoal.monthly_target;
    const totalSold = salesRecords.reduce((s, r) => s + Number(r.total_value), 0);
    const totalQty = salesRecords.reduce((s, r) => s + r.quantity, 0);
    const progressPercent = target > 0 ? Math.min((totalSold / target) * 100, 100) : 0;
    const remaining = Math.max(target - totalSold, 0);

    const monthEnd = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start: currentMonth, end: monthEnd });
    const workDays = allDays.filter(d => !isWeekend(d));
    const today = new Date();
    const passedWorkDays = workDays.filter(d => isBefore(d, today) || isToday(d)).length;
    const remainingDays = Math.max(salesGoal.working_days - passedWorkDays, 1);
    const adjustedDailyTarget = remaining / remainingDays;
    const dailySalesNeeded = salesGoal.average_ticket > 0 ? Math.ceil(adjustedDailyTarget / salesGoal.average_ticket) : 0;
    const daysWithSales = salesRecords.length;

    return {
      target, totalSold, totalQty, progressPercent, remaining,
      adjustedDailyTarget, dailySalesNeeded, passedWorkDays, remainingDays,
      daysWithSales, niche: salesGoal.niche, averageTicket: salesGoal.average_ticket,
    };
  }, [salesGoal, salesRecords, currentMonth]);

  const generatePDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Relatorio Financeiro Mensal", pageW / 2, y, { align: "center" });
      y += 10;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} — Mentoria Elevar`, pageW / 2, y, { align: "center" });
      y += 5;
      doc.setDrawColor(200); doc.line(20, y, pageW - 20, y); y += 10;

      // Section 1: Financial Map
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("1. Mapa Financeiro do Negocio", 20, y); y += 8;

      if (financials) {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        doc.text("Custos Fixos Mensais:", 20, y); y += 6;
        financials.fixedCosts.forEach(c => {
          doc.text(`   ${c.name}: ${fmt(c.value)}`, 20, y); y += 5;
        });
        doc.setFont("helvetica", "bold");
        doc.text(`   Total Fixos: ${fmt(financials.totalFixed)}`, 20, y); y += 8;
        doc.setFont("helvetica", "normal");

        doc.text("Custos Variaveis:", 20, y); y += 6;
        financials.variableCosts.forEach(c => {
          doc.text(`   ${c.name}: ${c.percent}%`, 20, y); y += 5;
        });
        doc.text(`   Total: ${financials.totalVariablePercent.toFixed(1)}% = ${fmt(financials.variableAmount)}`, 20, y); y += 8;

        doc.text(`Pro-labore: ${fmt(financials.proLabore)}`, 20, y); y += 6;
        doc.text(`Impostos: ${financials.taxPercent}% = ${fmt(financials.taxAmount)}`, 20, y); y += 8;

        doc.setDrawColor(220); doc.line(20, y, pageW - 20, y); y += 5;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`Faturamento Mensal: ${fmt(financials.revenue)}`, 20, y); y += 6;
        doc.text(`Total Despesas: ${fmt(financials.totalExpenses)}`, 20, y); y += 6;
        const profitColor = financials.realProfit >= 0 ? [34, 139, 34] : [220, 53, 69];
        doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
        doc.text(`Lucro Real: ${fmt(financials.realProfit)}`, 20, y); y += 6;
        doc.text(`Margem Real: ${financials.realMargin.toFixed(1)}%`, 20, y); y += 6;
        doc.setTextColor(60, 60, 60);
        doc.text(`Ponto de Equilibrio: ${fmt(financials.breakEven)}`, 20, y); y += 6;
        doc.setFont("helvetica", "normal");

        // Health status
        const health = financials.realMargin >= 20 ? "Saudavel" : financials.realMargin >= 10 ? "Atencao" : "Critico";
        doc.text(`Saude Financeira: ${health}`, 20, y); y += 10;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Nenhum dado do Mapa Financeiro encontrado. Preencha na Central Financeira.", 20, y); y += 10;
      }

      // Check if we need a new page
      if (y > 200) { doc.addPage(); y = 20; }

      // Section 2: Metas Elevar
      doc.setDrawColor(200); doc.line(20, y, pageW - 20, y); y += 8;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("2. Metas Elevar — Vendas do Mes", 20, y); y += 8;

      if (salesStats) {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        doc.text(`Meta Mensal: ${fmt(salesStats.target)}`, 20, y); y += 6;
        doc.text(`Ticket Medio: ${fmt(salesStats.averageTicket)}`, 20, y); y += 6;
        if (salesStats.niche) { doc.text(`Nicho: ${salesStats.niche}`, 20, y); y += 6; }
        y += 3;

        doc.setFont("helvetica", "bold");
        doc.text(`Total Vendido: ${fmt(salesStats.totalSold)}`, 20, y); y += 6;
        doc.text(`Quantidade de Vendas: ${salesStats.totalQty}`, 20, y); y += 6;
        doc.text(`Progresso: ${salesStats.progressPercent.toFixed(1)}%`, 20, y); y += 6;
        doc.text(`Falta: ${fmt(salesStats.remaining)}`, 20, y); y += 8;
        doc.setFont("helvetica", "normal");

        doc.text(`Dias uteis trabalhados: ${salesStats.passedWorkDays}`, 20, y); y += 6;
        doc.text(`Dias restantes: ${salesStats.remainingDays}`, 20, y); y += 6;
        doc.text(`Dias com vendas registradas: ${salesStats.daysWithSales}`, 20, y); y += 6;
        doc.text(`Meta diaria ajustada: ${fmt(salesStats.adjustedDailyTarget)}`, 20, y); y += 6;
        doc.text(`Vendas/dia necessarias: ${salesStats.dailySalesNeeded}`, 20, y); y += 10;

        // Sales history
        if (salesRecords.length > 0) {
          if (y > 230) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text("Historico de Vendas:", 20, y); y += 7;
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");

          // Table header
          doc.setFillColor(240, 240, 240);
          doc.rect(20, y - 4, pageW - 40, 7, "F");
          doc.text("Data", 22, y);
          doc.text("Qtd", 60, y);
          doc.text("Valor", 85, y);
          doc.text("Obs", 120, y);
          y += 7;

          salesRecords.forEach(r => {
            if (y > 275) { doc.addPage(); y = 20; }
            const dateFormatted = r.record_date.split("-").reverse().slice(0, 2).join("/");
            doc.text(dateFormatted, 22, y);
            doc.text(String(r.quantity), 60, y);
            doc.text(fmt(Number(r.total_value)), 85, y);
            doc.text((r.notes || "—").substring(0, 30), 120, y);
            y += 5;
          });
          y += 5;
        }
      } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Nenhuma meta de vendas configurada para este mes.", 20, y); y += 10;
      }

      // Section 3: Consolidated summary
      if (financials && salesStats) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setDrawColor(200); doc.line(20, y, pageW - 20, y); y += 8;
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("3. Resumo Consolidado", 20, y); y += 8;
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        const gap = salesStats.totalSold - financials.revenue;
        doc.text(`Faturamento declarado (Mapa): ${fmt(financials.revenue)}`, 20, y); y += 6;
        doc.text(`Vendas registradas (Metas): ${fmt(salesStats.totalSold)}`, 20, y); y += 6;
        if (Math.abs(gap) > 0.01) {
          doc.text(`Diferenca: ${fmt(gap)} ${gap > 0 ? "(vendas > faturamento declarado)" : "(faturamento > vendas registradas)"}`, 20, y);
          y += 8;
        } else {
          doc.text("Faturamento e vendas estao alinhados.", 20, y); y += 8;
        }

        // Projections
        if (salesStats.passedWorkDays > 0) {
          const avgDailySales = salesStats.totalSold / salesStats.passedWorkDays;
          const projectedMonth = avgDailySales * (salesStats.passedWorkDays + salesStats.remainingDays);
          doc.setFont("helvetica", "bold");
          doc.text(`Projecao de faturamento (ritmo atual): ${fmt(projectedMonth)}`, 20, y); y += 6;
          const projectedProfit = projectedMonth - financials.totalExpenses + financials.revenue - projectedMonth + financials.realProfit;
          // Simplified: use same expense structure with projected revenue
          const projVariableAmt = projectedMonth * (financials.totalVariablePercent / 100);
          const projTaxAmt = projectedMonth * (financials.taxPercent / 100);
          const projTotalExp = financials.totalFixed + projVariableAmt + financials.proLabore + projTaxAmt;
          const projProfit = projectedMonth - projTotalExp;
          doc.text(`Lucro projetado: ${fmt(projProfit)}`, 20, y); y += 6;
          doc.setFont("helvetica", "normal");
        }
      }

      // Footer
      y = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })} — Mentoria Elevar`, pageW / 2, y, { align: "center" });

      doc.save(`relatorio-financeiro-${format(currentMonth, "yyyy-MM")}.pdf`);
      toast.success("Relatório PDF gerado com sucesso! 📄");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const hasAnyData = !!financials || !!salesStats;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Relatório Financeiro</h1>
            <p className="text-sm text-muted-foreground">
              Consolidado mensal — {monthLabel}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAllData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Button size="sm" onClick={generatePDF} disabled={generating || !hasAnyData} className="gap-2">
            <Download className="h-4 w-4" /> {generating ? "Gerando..." : "Gerar PDF"}
          </Button>
        </div>
      </div>

      {!hasAnyData && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum dado encontrado</p>
            <p className="text-sm mt-1">Preencha o Mapa Financeiro e/ou configure suas Metas Elevar para gerar o relatório.</p>
          </CardContent>
        </Card>
      )}

      {/* Financial Map Preview */}
      {financials && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Mapa Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Faturamento</p>
                <p className="text-sm font-bold">{fmt(financials.revenue)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Despesas</p>
                <p className="text-sm font-bold">{fmt(financials.totalExpenses)}</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${financials.realProfit >= 0 ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                <p className="text-[10px] text-muted-foreground">Lucro Real</p>
                <p className={`text-sm font-bold ${financials.realProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {fmt(financials.realProfit)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Margem</p>
                <Badge variant={financials.realMargin >= 20 ? "default" : "destructive"} className="text-xs">
                  {financials.realMargin.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Custos Fixos</span><span>{fmt(financials.totalFixed)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Custos Variáveis</span><span>{fmt(financials.variableAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pró-labore</span><span>{fmt(financials.proLabore)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Impostos</span><span>{fmt(financials.taxAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ponto de Equilíbrio</span><span>{fmt(financials.breakEven)}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Goals Preview */}
      {salesStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Metas Elevar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Meta</p>
                <p className="text-sm font-bold">{fmt(salesStats.target)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                <p className="text-[10px] text-muted-foreground">Vendido</p>
                <p className="text-sm font-bold text-emerald-600">{fmt(salesStats.totalSold)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Progresso</p>
                <Badge variant={salesStats.progressPercent >= 100 ? "default" : "secondary"} className="text-xs">
                  {salesStats.progressPercent.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Falta</p>
                <p className="text-sm font-bold">{fmt(salesStats.remaining)}</p>
              </div>
            </div>
            <Separator />
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Vendas realizadas</span><span>{salesStats.totalQty} unidades</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dias com vendas</span><span>{salesStats.daysWithSales} de {salesStats.passedWorkDays}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Meta diária ajustada</span><span>{fmt(salesStats.adjustedDailyTarget)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vendas/dia necessárias</span><span>{salesStats.dailySalesNeeded}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consolidated */}
      {financials && salesStats && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              📊 Resumo Consolidado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faturamento (Mapa)</span>
                <span>{fmt(financials.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas registradas (Metas)</span>
                <span>{fmt(salesStats.totalSold)}</span>
              </div>
              {Math.abs(salesStats.totalSold - financials.revenue) > 0.01 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 text-amber-700 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Diferença de {fmt(Math.abs(salesStats.totalSold - financials.revenue))} entre vendas e faturamento declarado.
                  </span>
                </div>
              )}
            </div>

            {salesStats.passedWorkDays > 0 && (
              <>
                <Separator />
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-2">📈 Projeção (ritmo atual)</p>
                  {(() => {
                    const avgDaily = salesStats.totalSold / salesStats.passedWorkDays;
                    const projected = avgDaily * (salesStats.passedWorkDays + salesStats.remainingDays);
                    const projVar = projected * (financials.totalVariablePercent / 100);
                    const projTax = projected * (financials.taxPercent / 100);
                    const projExp = financials.totalFixed + projVar + financials.proLabore + projTax;
                    const projProfit = projected - projExp;
                    return (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Faturamento projetado</span>
                          <span className="font-bold">{fmt(projected)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lucro projetado</span>
                          <span className={`font-bold ${projProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {fmt(projProfit)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate button at bottom */}
      {hasAnyData && (
        <Button onClick={generatePDF} disabled={generating} className="w-full gap-2" size="lg">
          <Download className="h-5 w-5" />
          {generating ? "Gerando relatório..." : "Baixar Relatório Completo em PDF"}
        </Button>
      )}
    </div>
  );
}
