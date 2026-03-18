import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, Download, Plus, Trash2, Package, Briefcase, BarChart3, HelpCircle, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import FinishMissionButton from "@/components/learning/FinishMissionButton";

// ─── Types ───
interface CostItem { id: string; name: string; value: number; }
interface VariableCostItem { id: string; name: string; percent: number; }
interface ServiceItem { id: string; name: string; hoursPerMonth: number; hourlyRate: number; fixedCosts: number; }

// ─── Helper: Info tooltip ───
function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground inline-block ml-1 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px] text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Margin Alert ───
function MarginAlert({ margin }: { margin: number }) {
  if (margin >= 20) return null;
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>⚠️ Margem de {margin.toFixed(1)}% está abaixo dos 20% recomendados. Revise seus custos ou preço.</span>
    </div>
  );
}

// ═══════════════════════════════════════════
// ABA 1 — PRODUTO (melhorada)
// ═══════════════════════════════════════════
function ProductCalculator() {
  const [productName, setProductName] = useState("");
  const [directCosts, setDirectCosts] = useState<CostItem[]>([
    { id: "1", name: "Matéria-prima", value: 0 },
    { id: "2", name: "Embalagem", value: 0 },
    { id: "3", name: "Mão de obra direta", value: 0 },
  ]);
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState(0);
  const [quantityPerMonth, setQuantityPerMonth] = useState(1);
  const [desiredMargin, setDesiredMargin] = useState(30);
  const [taxPercent, setTaxPercent] = useState(10);

  const addCost = () => setDirectCosts([...directCosts, { id: Date.now().toString(), name: "", value: 0 }]);
  const removeCost = (id: string) => { if (directCosts.length > 1) setDirectCosts(directCosts.filter(c => c.id !== id)); };
  const updateCost = (id: string, field: keyof CostItem, value: string | number) => setDirectCosts(directCosts.map(c => c.id === id ? { ...c, [field]: value } : c));

  const totalDirectUnit = directCosts.reduce((s, c) => s + (c.value || 0), 0);
  const fixedPerUnit = quantityPerMonth > 0 ? monthlyFixedCosts / quantityPerMonth : 0;
  const unitCost = totalDirectUnit + fixedPerUnit;
  const safeMargin = Math.min(desiredMargin, 99);
  const sellingPrice = safeMargin > 0 ? unitCost / (1 - safeMargin / 100) : unitCost;
  const taxAmount = sellingPrice * (taxPercent / 100);
  const unitProfit = sellingPrice - unitCost - taxAmount;
  const realMargin = sellingPrice > 0 ? (unitProfit / sellingPrice) * 100 : 0;
  const monthlyRevenue = sellingPrice * quantityPerMonth;
  const monthlyProfit = unitProfit * quantityPerMonth;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Calculadora de Precos - Produto", 20, 25);
    doc.setFontSize(11);
    doc.text(`Produto: ${productName || "Sem nome"}`, 20, 38);
    let y = 50;
    doc.text("Custos Diretos (unitario):", 20, y); y += 8;
    directCosts.forEach(c => { doc.text(`  ${c.name}: R$ ${c.value.toFixed(2)}`, 20, y); y += 6; });
    y += 4;
    doc.text(`Custos Fixos Mensais: R$ ${monthlyFixedCosts.toFixed(2)}`, 20, y); y += 6;
    doc.text(`Quantidade/mes: ${quantityPerMonth}`, 20, y); y += 6;
    doc.text(`Rateio fixo/unidade: R$ ${fixedPerUnit.toFixed(2)}`, 20, y); y += 6;
    doc.text(`Custo Unitario Total: R$ ${unitCost.toFixed(2)}`, 20, y); y += 8;
    doc.text(`Margem desejada: ${desiredMargin}%`, 20, y); y += 6;
    doc.text(`Impostos: ${taxPercent}%`, 20, y); y += 8;
    doc.setFontSize(13);
    doc.text(`Preco de Venda: R$ ${sellingPrice.toFixed(2)}`, 20, y); y += 7;
    doc.text(`Lucro Unitario: R$ ${unitProfit.toFixed(2)}`, 20, y); y += 7;
    doc.text(`Margem Real: ${realMargin.toFixed(1)}%`, 20, y); y += 7;
    doc.text(`Faturamento Mensal: R$ ${monthlyRevenue.toFixed(2)}`, 20, y); y += 7;
    doc.text(`Lucro Mensal: R$ ${monthlyProfit.toFixed(2)}`, 20, y);
    doc.save(`calculadora-${productName || "produto"}.pdf`);
    toast.success("PDF exportado!");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome do Produto</Label>
        <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ex: Camiseta personalizada" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            Custos Diretos (por unidade) <InfoTip text="Custos que variam com cada unidade produzida: matéria-prima, embalagem, mão de obra direta." />
            <Button size="sm" variant="outline" onClick={addCost}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {directCosts.map(cost => (
            <div key={cost.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input placeholder="Nome do custo" value={cost.name} onChange={e => updateCost(cost.id, "name", e.target.value)} />
              </div>
              <div className="w-32">
                <Input type="number" min={0} step={0.01} placeholder="R$ 0,00" value={cost.value || ""} onChange={e => updateCost(cost.id, "value", parseFloat(e.target.value) || 0)} />
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeCost(cost.id)} className="text-destructive h-9 w-9">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Custos Fixos Mensais (R$) <InfoTip text="Aluguel, energia, internet, contador — custos que existem mesmo sem produzir." /></Label>
          <Input type="number" min={0} value={monthlyFixedCosts || ""} onChange={e => setMonthlyFixedCosts(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>Qtd Produzida/Mês <InfoTip text="Quantas unidades você produz por mês. Usado para ratear os custos fixos." /></Label>
          <Input type="number" min={1} value={quantityPerMonth || ""} onChange={e => setQuantityPerMonth(Math.max(1, parseInt(e.target.value) || 1))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Margem Desejada (%) <InfoTip text="Percentual do preço de venda que será lucro bruto. Fórmula: Preço = Custo / (1 - Margem%)" /></Label>
          <Input type="number" min={0} max={99} value={desiredMargin} onChange={e => setDesiredMargin(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>Impostos (%)</Label>
          <Input type="number" min={0} value={taxPercent} onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <Separator />

      <MarginAlert margin={realMargin} />

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Custo Direto Unitário</span>
            <span>R$ {totalDirectUnit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rateio Fixos/Unidade</span>
            <span>R$ {fixedPerUnit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Custo Unitário Total</span>
            <span>R$ {unitCost.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Preço de Venda</span>
            <span className="text-primary">R$ {sellingPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Impostos ({taxPercent}%)</span>
            <span>- R$ {taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lucro Unitário</span>
            <Badge variant={unitProfit > 0 ? "default" : "destructive"}>R$ {unitProfit.toFixed(2)}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Margem Real</span>
            <Badge variant={realMargin >= 20 ? "default" : "destructive"}>{realMargin.toFixed(1)}%</Badge>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Faturamento Mensal ({quantityPerMonth} un.)</span>
            <span className="font-semibold">R$ {monthlyRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lucro Mensal</span>
            <span className="font-semibold text-primary">R$ {monthlyProfit.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Button onClick={exportPDF} className="w-full"><Download className="h-4 w-4 mr-2" /> Exportar PDF</Button>
    </div>
  );
}

// ═══════════════════════════════════════════
// ABA 2 — SERVIÇO (melhorada)
// ═══════════════════════════════════════════
function ServiceCalculator() {
  const [serviceName, setServiceName] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([
    { id: "1", name: "Atendimento", hoursPerMonth: 20, hourlyRate: 50, fixedCosts: 200 },
  ]);
  const [proLabore, setProLabore] = useState(0);
  const [profitPercent, setProfitPercent] = useState(30);
  const [taxPercent, setTaxPercent] = useState(10);

  const addService = () => setServices([...services, { id: Date.now().toString(), name: "", hoursPerMonth: 0, hourlyRate: 0, fixedCosts: 0 }]);
  const removeService = (id: string) => { if (services.length > 1) setServices(services.filter(s => s.id !== id)); };
  const updateService = (id: string, field: keyof ServiceItem, value: string | number) => setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));

  const totalHoursCost = services.reduce((s, sv) => s + sv.hoursPerMonth * sv.hourlyRate, 0);
  const totalFixedCosts = services.reduce((s, sv) => s + sv.fixedCosts, 0);
  const totalCost = totalHoursCost + totalFixedCosts + proLabore;
  const profitAmount = totalCost * (profitPercent / 100);
  const priceBeforeTax = totalCost + profitAmount;
  const taxAmount = priceBeforeTax * (taxPercent / 100);
  const finalPrice = priceBeforeTax + taxAmount;
  const totalHours = services.reduce((s, sv) => s + sv.hoursPerMonth, 0);
  const realHourlyRate = totalHours > 0 ? finalPrice / totalHours : 0;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Calculadora de Precos - Servico", 20, 25);
    doc.setFontSize(11);
    doc.text(`Servico: ${serviceName || "Sem nome"}`, 20, 38);
    let y = 50;
    services.forEach(s => { doc.text(`${s.name}: ${s.hoursPerMonth}h x R$${s.hourlyRate} + R$${s.fixedCosts} fixo`, 20, y); y += 7; });
    y += 4;
    doc.text(`Pro-labore: R$ ${proLabore.toFixed(2)}`, 20, y); y += 7;
    doc.text(`Custo Total: R$ ${totalCost.toFixed(2)}`, 20, y); y += 7;
    doc.text(`Margem de Lucro: ${profitPercent}% (R$ ${profitAmount.toFixed(2)})`, 20, y); y += 7;
    doc.text(`Impostos: ${taxPercent}% (R$ ${taxAmount.toFixed(2)})`, 20, y); y += 9;
    doc.setFontSize(13);
    doc.text(`Preco Final Mensal: R$ ${finalPrice.toFixed(2)}`, 20, y); y += 7;
    doc.text(`Valor Real/Hora: R$ ${realHourlyRate.toFixed(2)}`, 20, y);
    doc.save(`calculadora-${serviceName || "servico"}.pdf`);
    toast.success("PDF exportado!");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome do Serviço</Label>
        <Input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Ex: Consultoria de Marketing" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            Componentes do Serviço
            <Button size="sm" variant="outline" onClick={addService}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.map(svc => (
            <Card key={svc.id} className="p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <Input className="flex-1" placeholder="Nome" value={svc.name} onChange={e => updateService(svc.id, "name", e.target.value)} />
                <Button size="icon" variant="ghost" onClick={() => removeService(svc.id)} className="text-destructive h-8 w-8"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-[10px]">Horas/mês</Label><Input type="number" min={0} value={svc.hoursPerMonth || ""} onChange={e => updateService(svc.id, "hoursPerMonth", parseFloat(e.target.value) || 0)} /></div>
                <div><Label className="text-[10px]">R$/hora</Label><Input type="number" min={0} value={svc.hourlyRate || ""} onChange={e => updateService(svc.id, "hourlyRate", parseFloat(e.target.value) || 0)} /></div>
                <div><Label className="text-[10px]">Fixo R$</Label><Input type="number" min={0} value={svc.fixedCosts || ""} onChange={e => updateService(svc.id, "fixedCosts", parseFloat(e.target.value) || 0)} /></div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div>
        <Label>Pró-labore Desejado (R$/mês) <InfoTip text="Quanto você quer tirar de salário para si. Este valor é incluído no custo do serviço." /></Label>
        <Input type="number" min={0} value={proLabore || ""} onChange={e => setProLabore(parseFloat(e.target.value) || 0)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Margem de Lucro (%)</Label>
          <Input type="number" min={0} value={profitPercent} onChange={e => setProfitPercent(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>Impostos (%)</Label>
          <Input type="number" min={0} value={taxPercent} onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <Separator />

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Custo Horas</span><span>R$ {totalHoursCost.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Custos Fixos</span><span>R$ {totalFixedCosts.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pró-labore</span><span>R$ {proLabore.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Lucro ({profitPercent}%)</span><span>R$ {profitAmount.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Impostos ({taxPercent}%)</span><span>R$ {taxAmount.toFixed(2)}</span></div>
          <Separator />
          <div className="flex justify-between font-bold text-lg"><span>Preço Mensal</span><span className="text-primary">R$ {finalPrice.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Valor Real/Hora ({totalHours}h)</span><Badge>R$ {realHourlyRate.toFixed(2)}/h</Badge></div>
        </CardContent>
      </Card>

      <Button onClick={exportPDF} className="w-full"><Download className="h-4 w-4 mr-2" /> Exportar PDF</Button>
    </div>
  );
}

// ═══════════════════════════════════════════
// ABA 3 — MAPA FINANCEIRO (nova)
// ═══════════════════════════════════════════
function FinancialMap() {
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([
    { id: "1", name: "Aluguel", value: 0 },
    { id: "2", name: "Internet", value: 0 },
    { id: "3", name: "Energia", value: 0 },
    { id: "4", name: "Software/Ferramentas", value: 0 },
    { id: "5", name: "Contador", value: 0 },
  ]);
  const [variableCosts, setVariableCosts] = useState<VariableCostItem[]>([
    { id: "1", name: "Comissão de vendas", percent: 5 },
    { id: "2", name: "Embalagem/Frete", percent: 3 },
  ]);
  const [proLabore, setProLabore] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [taxPercent, setTaxPercent] = useState(10);

  const addFixed = () => setFixedCosts([...fixedCosts, { id: Date.now().toString(), name: "", value: 0 }]);
  const removeFixed = (id: string) => { if (fixedCosts.length > 1) setFixedCosts(fixedCosts.filter(c => c.id !== id)); };
  const updateFixed = (id: string, field: keyof CostItem, value: string | number) => setFixedCosts(fixedCosts.map(c => c.id === id ? { ...c, [field]: value } : c));

  const addVariable = () => setVariableCosts([...variableCosts, { id: Date.now().toString(), name: "", percent: 0 }]);
  const removeVariable = (id: string) => { if (variableCosts.length > 1) setVariableCosts(variableCosts.filter(c => c.id !== id)); };
  const updateVariable = (id: string, field: keyof VariableCostItem, value: string | number) => setVariableCosts(variableCosts.map(c => c.id === id ? { ...c, [field]: value } : c));

  const totalFixed = fixedCosts.reduce((s, c) => s + (c.value || 0), 0);
  const totalVariablePercent = variableCosts.reduce((s, c) => s + (c.percent || 0), 0);
  const totalVariableAmount = monthlyRevenue * (totalVariablePercent / 100);
  const taxAmount = monthlyRevenue * (taxPercent / 100);
  const totalExpenses = totalFixed + totalVariableAmount + proLabore + taxAmount;
  const realProfit = monthlyRevenue - totalExpenses;
  const realMargin = monthlyRevenue > 0 ? (realProfit / monthlyRevenue) * 100 : 0;
  const illusoryRevenue = monthlyRevenue > 0 ? totalExpenses : 0;
  const breakEven = (totalVariablePercent + taxPercent) < 100
    ? (totalFixed + proLabore) / (1 - (totalVariablePercent + taxPercent) / 100)
    : 0;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Mapa Financeiro do Negocio", 20, 25);
    doc.setFontSize(11);
    let y = 40;
    doc.text("Custos Fixos:", 20, y); y += 7;
    fixedCosts.forEach(c => { doc.text(`  ${c.name}: R$ ${c.value.toFixed(2)}`, 20, y); y += 6; });
    y += 3;
    doc.text(`Total Fixos: R$ ${totalFixed.toFixed(2)}`, 20, y); y += 9;
    doc.text("Custos Variaveis (% do faturamento):", 20, y); y += 7;
    variableCosts.forEach(c => { doc.text(`  ${c.name}: ${c.percent}%`, 20, y); y += 6; });
    y += 3;
    doc.text(`Total Variaveis: ${totalVariablePercent}% = R$ ${totalVariableAmount.toFixed(2)}`, 20, y); y += 9;
    doc.text(`Pro-labore: R$ ${proLabore.toFixed(2)}`, 20, y); y += 7;
    doc.text(`Impostos: ${taxPercent}% = R$ ${taxAmount.toFixed(2)}`, 20, y); y += 9;
    doc.text(`Faturamento Mensal: R$ ${monthlyRevenue.toFixed(2)}`, 20, y); y += 7;
    doc.text(`Total Despesas: R$ ${totalExpenses.toFixed(2)}`, 20, y); y += 9;
    doc.setFontSize(13);
    doc.text(`Lucro Real: R$ ${realProfit.toFixed(2)}`, 20, y); y += 7;
    doc.text(`Margem Real: ${realMargin.toFixed(1)}%`, 20, y); y += 7;
    doc.text(`Ponto de Equilibrio: R$ ${breakEven.toFixed(2)}`, 20, y);
    doc.save("mapa-financeiro.pdf");
    toast.success("PDF exportado!");
  };

  return (
    <div className="space-y-4">
      {/* Fixed Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            📌 Custos Fixos Mensais <InfoTip text="Custos que você paga todo mês, independente de vender ou não." />
            <Button size="sm" variant="outline" onClick={addFixed}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fixedCosts.map(c => (
            <div key={c.id} className="flex gap-2 items-end">
              <div className="flex-1"><Input placeholder="Nome" value={c.name} onChange={e => updateFixed(c.id, "name", e.target.value)} /></div>
              <div className="w-28"><Input type="number" min={0} placeholder="R$" value={c.value || ""} onChange={e => updateFixed(c.id, "value", parseFloat(e.target.value) || 0)} /></div>
              <Button size="icon" variant="ghost" onClick={() => removeFixed(c.id)} className="text-destructive h-9 w-9"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <div className="text-right text-sm font-medium text-muted-foreground">Total: R$ {totalFixed.toFixed(2)}</div>
        </CardContent>
      </Card>

      {/* Variable Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            📊 Custos Variáveis <InfoTip text="Custos que variam proporcionalmente ao faturamento. Insira em % sobre a receita." />
            <Button size="sm" variant="outline" onClick={addVariable}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {variableCosts.map(c => (
            <div key={c.id} className="flex gap-2 items-end">
              <div className="flex-1"><Input placeholder="Nome" value={c.name} onChange={e => updateVariable(c.id, "name", e.target.value)} /></div>
              <div className="w-20"><Input type="number" min={0} max={100} placeholder="%" value={c.percent || ""} onChange={e => updateVariable(c.id, "percent", parseFloat(e.target.value) || 0)} /></div>
              <span className="text-xs text-muted-foreground pb-2">%</span>
              <Button size="icon" variant="ghost" onClick={() => removeVariable(c.id)} className="text-destructive h-9 w-9"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <div className="text-right text-sm font-medium text-muted-foreground">Total: {totalVariablePercent.toFixed(1)}%</div>
        </CardContent>
      </Card>

      {/* Pro-labore & Revenue */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>💼 Pró-labore (R$/mês) <InfoTip text="Quanto você tira de salário. Se não está tirando, coloque quanto DEVERIA tirar." /></Label>
          <Input type="number" min={0} value={proLabore || ""} onChange={e => setProLabore(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label>Impostos (%)</Label>
          <Input type="number" min={0} value={taxPercent} onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div>
        <Label>💰 Faturamento Mensal (R$) <InfoTip text="Quanto sua empresa fatura por mês. Insira o valor real." /></Label>
        <Input type="number" min={0} value={monthlyRevenue || ""} onChange={e => setMonthlyRevenue(parseFloat(e.target.value) || 0)} className="text-lg font-semibold" />
      </div>

      <Separator />

      <MarginAlert margin={realMargin} />

      {/* Reality Check Card */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            🔍 Raio-X Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* What you earn */}
            <Card className="p-3 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-1 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700">O que você fatura</p>
              </div>
              <p className="text-xl font-bold text-emerald-600">R$ {monthlyRevenue.toFixed(2)}</p>
            </Card>
            {/* What actually stays */}
            <Card className={`p-3 ${realProfit >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-center gap-1 mb-2">
                {realProfit >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                <p className={`text-xs font-semibold ${realProfit >= 0 ? "text-emerald-700" : "text-destructive"}`}>O que sobra de verdade</p>
              </div>
              <p className={`text-xl font-bold ${realProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>R$ {realProfit.toFixed(2)}</p>
            </Card>
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Custos Fixos</span><span>- R$ {totalFixed.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Custos Variáveis ({totalVariablePercent}%)</span><span>- R$ {totalVariableAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pró-labore</span><span>- R$ {proLabore.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Impostos ({taxPercent}%)</span><span>- R$ {taxAmount.toFixed(2)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Lucro Real</span>
              <span className={realProfit >= 0 ? "text-primary" : "text-destructive"}>R$ {realProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Margem Real</span>
              <Badge variant={realMargin >= 20 ? "default" : "destructive"}>{realMargin.toFixed(1)}%</Badge>
            </div>
          </div>

          <Separator />

          {/* Illusory revenue */}
          {monthlyRevenue > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/20 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">💡 Faturamento Ilusório</p>
              <p className="text-sm">
                Do seu faturamento de <strong>R$ {monthlyRevenue.toFixed(2)}</strong>, cerca de{" "}
                <strong className="text-destructive">R$ {illusoryRevenue.toFixed(2)}</strong> ({monthlyRevenue > 0 ? ((illusoryRevenue / monthlyRevenue) * 100).toFixed(0) : 0}%) são custos disfarçados.
              </p>
            </div>
          )}

          {/* Break-even */}
          {breakEven > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
              <p className="text-xs font-semibold text-primary">📍 Ponto de Equilíbrio</p>
              <p className="text-sm">
                Você precisa faturar no mínimo <strong className="text-primary">R$ {breakEven.toFixed(2)}</strong>/mês para cobrir todos os custos.
              </p>
              {monthlyRevenue > 0 && (
                <p className="text-xs text-muted-foreground">
                  {monthlyRevenue >= breakEven
                    ? `✅ Você está ${((monthlyRevenue / breakEven - 1) * 100).toFixed(0)}% acima do ponto de equilíbrio.`
                    : `⚠️ Você está ${((1 - monthlyRevenue / breakEven) * 100).toFixed(0)}% abaixo do ponto de equilíbrio.`}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={exportPDF} className="w-full"><Download className="h-4 w-4 mr-2" /> Exportar PDF</Button>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN — 3 abas
// ═══════════════════════════════════════════
export default function PriceCalculator() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Calculadora Financeira</h1>
            <p className="text-xs text-muted-foreground">
              Precifique com precisão e entenda a saúde financeira do seu negócio
            </p>
          </div>
        </div>
        <FinishMissionButton />
      </div>

      <Tabs defaultValue="product">
        <TabsList className="w-full">
          <TabsTrigger value="product" className="flex-1 gap-1">
            <Package className="h-3.5 w-3.5" /> Produto
          </TabsTrigger>
          <TabsTrigger value="service" className="flex-1 gap-1">
            <Briefcase className="h-3.5 w-3.5" /> Serviço
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex-1 gap-1">
            <BarChart3 className="h-3.5 w-3.5" /> Mapa
          </TabsTrigger>
        </TabsList>
        <TabsContent value="product"><ProductCalculator /></TabsContent>
        <TabsContent value="service"><ServiceCalculator /></TabsContent>
        <TabsContent value="financial"><FinancialMap /></TabsContent>
      </Tabs>
    </div>
  );
}
