import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Download, Plus, Trash2, Package, Briefcase } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface CostItem {
  id: string;
  name: string;
  value: number;
}

interface ServiceItem {
  id: string;
  name: string;
  hoursPerMonth: number;
  hourlyRate: number;
  fixedCosts: number;
}

function ProductCalculator() {
  const [productName, setProductName] = useState("");
  const [costs, setCosts] = useState<CostItem[]>([
    { id: "1", name: "Matéria-prima", value: 0 },
    { id: "2", name: "Embalagem", value: 0 },
    { id: "3", name: "Mão de obra", value: 0 },
  ]);
  const [markup, setMarkup] = useState(100);
  const [taxPercent, setTaxPercent] = useState(10);

  const addCost = () => {
    setCosts([...costs, { id: Date.now().toString(), name: "", value: 0 }]);
  };

  const removeCost = (id: string) => {
    if (costs.length <= 1) return;
    setCosts(costs.filter((c) => c.id !== id));
  };

  const updateCost = (id: string, field: keyof CostItem, value: string | number) => {
    setCosts(costs.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const totalCost = costs.reduce((sum, c) => sum + (c.value || 0), 0);
  const markupMultiplier = 1 + markup / 100;
  const priceBeforeTax = totalCost * markupMultiplier;
  const taxAmount = priceBeforeTax * (taxPercent / 100);
  const finalPrice = priceBeforeTax + taxAmount;
  const profit = finalPrice - totalCost - taxAmount;
  const profitMargin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Calculadora de Precos - Produto", 20, 25);
    doc.setFontSize(12);
    doc.text(`Produto: ${productName || "Sem nome"}`, 20, 40);
    doc.text("Custos:", 20, 55);

    let y = 65;
    costs.forEach((c) => {
      doc.text(`  ${c.name}: R$ ${c.value.toFixed(2)}`, 20, y);
      y += 8;
    });

    y += 5;
    doc.text(`Custo Total: R$ ${totalCost.toFixed(2)}`, 20, y);
    y += 8;
    doc.text(`Markup: ${markup}%`, 20, y);
    y += 8;
    doc.text(`Impostos: ${taxPercent}% (R$ ${taxAmount.toFixed(2)})`, 20, y);
    y += 8;
    doc.setFontSize(14);
    doc.text(`Preco Final: R$ ${finalPrice.toFixed(2)}`, 20, y);
    y += 8;
    doc.text(`Lucro: R$ ${profit.toFixed(2)} (${profitMargin.toFixed(1)}%)`, 20, y);

    doc.save(`calculadora-${productName || "produto"}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome do Produto</Label>
        <Input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Ex: Camiseta personalizada"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            Custos de Produção
            <Button size="sm" variant="outline" onClick={addCost}>
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {costs.map((cost) => (
            <div key={cost.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Nome do custo"
                  value={cost.name}
                  onChange={(e) => updateCost(cost.id, "name", e.target.value)}
                />
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="R$ 0,00"
                  value={cost.value || ""}
                  onChange={(e) => updateCost(cost.id, "value", parseFloat(e.target.value) || 0)}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeCost(cost.id)}
                className="text-destructive h-9 w-9"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Markup (%)</Label>
          <Input
            type="number"
            min={0}
            value={markup}
            onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Impostos (%)</Label>
          <Input
            type="number"
            min={0}
            value={taxPercent}
            onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <Separator />

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Custo Total</span>
            <span>R$ {totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Markup ({markup}%)</span>
            <span>R$ {(priceBeforeTax - totalCost).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Impostos ({taxPercent}%)</span>
            <span>R$ {taxAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Preço Final</span>
            <span className="text-primary">R$ {finalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lucro</span>
            <Badge variant={profit > 0 ? "default" : "destructive"}>
              R$ {profit.toFixed(2)} ({profitMargin.toFixed(1)}%)
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Button onClick={exportPDF} className="w-full">
        <Download className="h-4 w-4 mr-2" /> Exportar PDF
      </Button>
    </div>
  );
}

function ServiceCalculator() {
  const [serviceName, setServiceName] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([
    { id: "1", name: "Atendimento", hoursPerMonth: 20, hourlyRate: 50, fixedCosts: 200 },
  ]);
  const [profitPercent, setProfitPercent] = useState(30);
  const [taxPercent, setTaxPercent] = useState(10);

  const addService = () => {
    setServices([
      ...services,
      { id: Date.now().toString(), name: "", hoursPerMonth: 0, hourlyRate: 0, fixedCosts: 0 },
    ]);
  };

  const removeService = (id: string) => {
    if (services.length <= 1) return;
    setServices(services.filter((s) => s.id !== id));
  };

  const updateService = (id: string, field: keyof ServiceItem, value: string | number) => {
    setServices(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const totalHoursCost = services.reduce((sum, s) => sum + s.hoursPerMonth * s.hourlyRate, 0);
  const totalFixedCosts = services.reduce((sum, s) => sum + s.fixedCosts, 0);
  const totalCost = totalHoursCost + totalFixedCosts;
  const profitAmount = totalCost * (profitPercent / 100);
  const priceBeforeTax = totalCost + profitAmount;
  const taxAmount = priceBeforeTax * (taxPercent / 100);
  const finalPrice = priceBeforeTax + taxAmount;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Calculadora de Precos - Servico", 20, 25);
    doc.setFontSize(12);
    doc.text(`Servico: ${serviceName || "Sem nome"}`, 20, 40);

    let y = 55;
    services.forEach((s) => {
      doc.text(`${s.name}: ${s.hoursPerMonth}h x R$${s.hourlyRate} + R$${s.fixedCosts} fixo`, 20, y);
      y += 8;
    });

    y += 5;
    doc.text(`Custo Total: R$ ${totalCost.toFixed(2)}`, 20, y);
    y += 8;
    doc.text(`Margem de Lucro: ${profitPercent}% (R$ ${profitAmount.toFixed(2)})`, 20, y);
    y += 8;
    doc.text(`Impostos: ${taxPercent}% (R$ ${taxAmount.toFixed(2)})`, 20, y);
    y += 8;
    doc.setFontSize(14);
    doc.text(`Preco Final Mensal: R$ ${finalPrice.toFixed(2)}`, 20, y);

    doc.save(`calculadora-${serviceName || "servico"}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome do Serviço</Label>
        <Input
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          placeholder="Ex: Consultoria de Marketing"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            Componentes do Serviço
            <Button size="sm" variant="outline" onClick={addService}>
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.map((svc) => (
            <Card key={svc.id} className="p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  className="flex-1"
                  placeholder="Nome"
                  value={svc.name}
                  onChange={(e) => updateService(svc.id, "name", e.target.value)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeService(svc.id)}
                  className="text-destructive h-8 w-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px]">Horas/mês</Label>
                  <Input
                    type="number"
                    min={0}
                    value={svc.hoursPerMonth || ""}
                    onChange={(e) =>
                      updateService(svc.id, "hoursPerMonth", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label className="text-[10px]">R$/hora</Label>
                  <Input
                    type="number"
                    min={0}
                    value={svc.hourlyRate || ""}
                    onChange={(e) =>
                      updateService(svc.id, "hourlyRate", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Fixo R$</Label>
                  <Input
                    type="number"
                    min={0}
                    value={svc.fixedCosts || ""}
                    onChange={(e) =>
                      updateService(svc.id, "fixedCosts", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Margem de Lucro (%)</Label>
          <Input
            type="number"
            min={0}
            value={profitPercent}
            onChange={(e) => setProfitPercent(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Impostos (%)</Label>
          <Input
            type="number"
            min={0}
            value={taxPercent}
            onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <Separator />

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Custo Horas</span>
            <span>R$ {totalHoursCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Custos Fixos</span>
            <span>R$ {totalFixedCosts.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lucro ({profitPercent}%)</span>
            <span>R$ {profitAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Impostos ({taxPercent}%)</span>
            <span>R$ {taxAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Preço Mensal</span>
            <span className="text-primary">R$ {finalPrice.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Button onClick={exportPDF} className="w-full">
        <Download className="h-4 w-4 mr-2" /> Exportar PDF
      </Button>
    </div>
  );
}

export default function PriceCalculator() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Calculadora de Preços</h1>
          <p className="text-xs text-muted-foreground">
            Precifique seus produtos e serviços com precisão
          </p>
        </div>
      </div>

      <Tabs defaultValue="product">
        <TabsList className="w-full">
          <TabsTrigger value="product" className="flex-1 gap-1">
            <Package className="h-3.5 w-3.5" /> Produto
          </TabsTrigger>
          <TabsTrigger value="service" className="flex-1 gap-1">
            <Briefcase className="h-3.5 w-3.5" /> Serviço
          </TabsTrigger>
        </TabsList>
        <TabsContent value="product">
          <ProductCalculator />
        </TabsContent>
        <TabsContent value="service">
          <ServiceCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
