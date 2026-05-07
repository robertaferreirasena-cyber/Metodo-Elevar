import { useState, useMemo, useEffect, useCallback } from "react";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { SessionIndicator } from "@/components/SessionIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Calculator, Download, Plus, Trash2, Copy, Package, Briefcase, BarChart3, HelpCircle, AlertTriangle, TrendingUp, TrendingDown, PieChart as PieChartIcon, Activity, Save, CloudDownload, SlidersHorizontal, Upload, Loader2, FileSearch, Target, Clock, Scissors } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import FinishMissionButton from "@/components/learning/FinishMissionButton";
import { MissionContextBanner } from "@/components/learning/MissionContextBanner";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CatalogUploader } from "@/components/catalog/CatalogUploader";
import { CatalogAnalysisResult, type CatalogAnalysis, type DetectedProduct } from "@/components/catalog/CatalogAnalysisResult";

// ─── Types ───
interface CostItem { id: string; name: string; value: number; }
interface VariableCostItem { id: string; name: string; percent: number; }

type ServiceMode = "hourly" | "session";
interface ServiceItem {
  id: string;
  name: string;
  mode: ServiceMode;
  // Etapa 1 — Dados do serviço
  pricePerSession: number;        // preço cobrado hoje
  sessionsPerMonth: number;       // meta de atendimentos/mês
  durationMinutes: number;        // duração média
  hoursPerMonth: number;          // modo por hora
  hourlyRate: number;
  // Etapa 2 — Capacidade de agenda
  daysPerMonth: number;
  hoursPerDay: number;
  productivePercent: number;      // 0-100
  // Etapa 3 — Custos fixos próprios do serviço (extras ao Mapa)
  fixedCosts: number;
  proLabore: number;              // retirada desejada (este serviço)
  // Etapa 4 — Custos diretos do procedimento
  productName: string;
  productCost: number;            // valor pago no produto
  productYield: number;           // atendimentos que esse produto rende
  disposablesPerSession: number;  // descartáveis por atendimento
  otherVariablePerSession: number;
  // Etapa 5 — Taxas e margem
  taxPercent: number;             // impostos
  cardFeePercent: number;         // taxa cartão/plataforma
  commissionPercent: number;
  desiredMargin: number;          // margem de lucro líquido desejada
}

interface FinancialData {
  totalFixed: number;
  totalVariablePercent: number;
  totalVariableAmount: number;
  proLabore: number;
  taxPercent: number;
  taxAmount: number;
  monthlyRevenue: number;
  totalExpenses: number;
  realProfit: number;
  realMargin: number;
  breakEven: number;
  illusoryRevenue: number;
}

// ─── Helpers ───
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

function MarginAlert({ margin }: { margin: number }) {
  if (margin >= 20) return null;
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>⚠️ Margem de {margin.toFixed(1)}% está abaixo dos 20% recomendados. Revise seus custos ou preço.</span>
    </div>
  );
}

const CHART_COLORS = [
  "hsl(0, 72%, 51%)",
  "hsl(25, 95%, 53%)",
  "hsl(45, 93%, 47%)",
  "hsl(280, 67%, 51%)",
  "hsl(142, 71%, 45%)",
];

const CHART_COLORS_BAR = [
  "hsl(142, 71%, 45%)",
  "hsl(0, 72%, 51%)",
  "hsl(217, 91%, 60%)",
];

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ═══════════════════════════════════════════
// ABA 1 — PRODUTOS (multi-produto)
// ═══════════════════════════════════════════
type BusinessType = "lojista" | "produtor";

interface ProductRow {
  id: string;
  name: string;
  businessType: BusinessType;
  purchaseCost: number;
  freightPerUnit: number;
  extraPackaging: number;
  directCosts: CostItem[];
  quantityPerMonth: number;
  desiredMargin: number;
  taxPercent: number;
}

interface ProductCalcSessionState {
  products: ProductRow[];
  monthlyFixedCosts: number;
  fixedCostsFromMap: boolean;
}

const makeEmptyProduct = (): ProductRow => ({
  id: newId(),
  name: "",
  businessType: "lojista",
  purchaseCost: 0,
  freightPerUnit: 0,
  extraPackaging: 0,
  directCosts: [
    { id: "1", name: "Matéria-prima", value: 0 },
    { id: "2", name: "Embalagem", value: 0 },
    { id: "3", name: "Mão de obra direta", value: 0 },
  ],
  quantityPerMonth: 10,
  desiredMargin: 30,
  taxPercent: 10,
});

const EMPTY_PRODUCT_CALC_STATE: ProductCalcSessionState = {
  products: [makeEmptyProduct()],
  monthlyFixedCosts: 0,
  fixedCostsFromMap: false,
};

// Migration from v1 single-product format
function migrateV1(): ProductCalcSessionState | null {
  try {
    const v1Raw = sessionStorage.getItem("session_product_calc");
    if (!v1Raw) return null;
    const v1 = JSON.parse(v1Raw);
    if (!v1?.value) return null;
    const old = v1.value;
    return {
      products: [{
        id: newId(),
        name: old.productName || "",
        businessType: old.businessType || "lojista",
        purchaseCost: old.purchaseCost || 0,
        freightPerUnit: old.freightPerUnit || 0,
        extraPackaging: old.extraPackaging || 0,
        directCosts: old.directCosts || [],
        quantityPerMonth: old.quantityPerMonth || 10,
        desiredMargin: old.desiredMargin || 30,
        taxPercent: old.taxPercent || 10,
      }],
      monthlyFixedCosts: old.monthlyFixedCosts || 0,
      fixedCostsFromMap: old.fixedCostsFromMap || false,
    };
  } catch { return null; }
}

function calcProduct(p: ProductRow, fixedPerUnit: number) {
  const directUnit = p.businessType === "lojista"
    ? p.purchaseCost + p.freightPerUnit + p.extraPackaging
    : p.directCosts.reduce((s, c) => s + (c.value || 0), 0);
  const unitCost = directUnit + fixedPerUnit;
  const safeMargin = Math.min(p.desiredMargin, 99);
  const sellingPrice = safeMargin > 0 ? unitCost / (1 - safeMargin / 100) : unitCost;
  const taxAmount = sellingPrice * (p.taxPercent / 100);
  const unitProfit = sellingPrice - unitCost - taxAmount;
  const realMargin = sellingPrice > 0 ? (unitProfit / sellingPrice) * 100 : 0;
  const monthlyRevenue = sellingPrice * p.quantityPerMonth;
  const monthlyProfit = unitProfit * p.quantityPerMonth;
  const profitBeforeFixed = sellingPrice - directUnit - taxAmount;
  return { directUnit, unitCost, sellingPrice, taxAmount, unitProfit, realMargin, monthlyRevenue, monthlyProfit, profitBeforeFixed };
}

function ProductCalculator({ mapFixedCosts }: { mapFixedCosts?: number }) {
  const [sessionState, setSessionState, clearSession, hasRestoredSession] = useSessionPersistence<ProductCalcSessionState>(
    "session_product_calc_v2",
    EMPTY_PRODUCT_CALC_STATE
  );

  // One-time v1 migration
  useEffect(() => {
    if (sessionState.products.length === 1 && !sessionState.products[0].name && sessionState.monthlyFixedCosts === 0) {
      const migrated = migrateV1();
      if (migrated) {
        setSessionState(migrated);
        sessionStorage.removeItem("session_product_calc");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [products, setProducts] = useState<ProductRow[]>(sessionState.products.length ? sessionState.products : [makeEmptyProduct()]);
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState(sessionState.monthlyFixedCosts);
  const [fixedCostsFromMap, setFixedCostsFromMap] = useState(sessionState.fixedCostsFromMap || false);
  const [openItems, setOpenItems] = useState<string[]>(products[0] ? [products[0].id] : []);

  useEffect(() => {
    if (mapFixedCosts && mapFixedCosts > 0 && !fixedCostsFromMap && monthlyFixedCosts === 0) {
      setMonthlyFixedCosts(mapFixedCosts);
      setFixedCostsFromMap(true);
    }
  }, [mapFixedCosts]); // eslint-disable-line

  useEffect(() => {
    setSessionState({ products, monthlyFixedCosts, fixedCostsFromMap });
  }, [products, monthlyFixedCosts, fixedCostsFromMap, setSessionState]);

  // Catalog import state
  const CATALOG_STORAGE_KEY = "priceCalculator.catalogAnalysis";
  const [catalogFiles, setCatalogFiles] = useState<string[]>([]);
  const [catalogAnalysis, setCatalogAnalysis] = useState<CatalogAnalysis | null>(() => {
    try {
      const raw = sessionStorage.getItem(CATALOG_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CatalogAnalysis) : null;
    } catch {
      return null;
    }
  });
  const [savedCatalogSnapshot, setSavedCatalogSnapshot] = useState<string>(() => {
    try {
      return sessionStorage.getItem(CATALOG_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [analyzingCatalog, setAnalyzingCatalog] = useState(false);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);

  const hasUnsavedCatalogEdits = useMemo(() => {
    if (!catalogAnalysis) return false;
    return JSON.stringify(catalogAnalysis) !== savedCatalogSnapshot;
  }, [catalogAnalysis, savedCatalogSnapshot]);

  const saveCatalogEdits = () => {
    if (!catalogAnalysis) return;
    const serialized = JSON.stringify(catalogAnalysis);
    try {
      sessionStorage.setItem(CATALOG_STORAGE_KEY, serialized);
      setSavedCatalogSnapshot(serialized);
      toast.success("Edições de frete e embalagem salvas");
    } catch {
      toast.error("Não foi possível salvar localmente");
    }
  };

  const bulkUpdateCatalog = (patch: Partial<DetectedProduct>) => {
    setCatalogAnalysis(prev =>
      prev
        ? { ...prev, products: prev.products.map(p => ({ ...p, ...patch })) }
        : prev
    );
    toast.success("Aplicado a todos os produtos. Lembre de salvar.");
  };

  // ── Product CRUD ──
  const updateProduct = (id: string, patch: Partial<ProductRow>) =>
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  const addProduct = () => {
    const np = makeEmptyProduct();
    setProducts(prev => [...prev, np]);
    setOpenItems(prev => [...prev, np.id]);
  };
  const duplicateProduct = (id: string) => {
    const src = products.find(p => p.id === id);
    if (!src) return;
    const copy: ProductRow = { ...src, id: newId(), name: `${src.name || "Produto"} (cópia)`, directCosts: src.directCosts.map(c => ({ ...c })) };
    setProducts(prev => [...prev, copy]);
    setOpenItems(prev => [...prev, copy.id]);
  };
  const removeProduct = (id: string) => {
    if (products.length <= 1) {
      toast.error("Mantenha pelo menos 1 produto");
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Direct cost editing inside a product
  const addDirectCost = (pid: string) => updateProduct(pid, {
    directCosts: [...(products.find(p => p.id === pid)?.directCosts || []), { id: newId(), name: "", value: 0 }],
  });
  const removeDirectCost = (pid: string, cid: string) => {
    const p = products.find(pp => pp.id === pid);
    if (!p) return;
    if (p.directCosts.length <= 1) return;
    updateProduct(pid, { directCosts: p.directCosts.filter(c => c.id !== cid) });
  };
  const updateDirectCost = (pid: string, cid: string, field: keyof CostItem, value: string | number) => {
    const p = products.find(pp => pp.id === pid);
    if (!p) return;
    updateProduct(pid, {
      directCosts: p.directCosts.map(c => (c.id === cid ? { ...c, [field]: value } : c)),
    });
  };

  // ── Fixed cost rateio proportional to expected revenue ──
  const productResults = useMemo(() => {
    // 1st pass with zero fixed-per-unit to get revenue weights
    const prelim = products.map(p => {
      const r = calcProduct(p, 0);
      return { p, prelimRevenue: r.monthlyRevenue };
    });
    const totalRevenue = prelim.reduce((s, x) => s + x.prelimRevenue, 0);

    return prelim.map(({ p, prelimRevenue }) => {
      const share = totalRevenue > 0 ? prelimRevenue / totalRevenue : 1 / Math.max(products.length, 1);
      const fixedAllocated = monthlyFixedCosts * share;
      const fixedPerUnit = p.quantityPerMonth > 0 ? fixedAllocated / p.quantityPerMonth : 0;
      const calc = calcProduct(p, fixedPerUnit);
      const breakEvenUnits = calc.profitBeforeFixed > 0 ? Math.ceil(fixedAllocated / calc.profitBeforeFixed) : Infinity;
      return { p, fixedAllocated, fixedPerUnit, breakEvenUnits, ...calc, share };
    });
  }, [products, monthlyFixedCosts]);

  // Consolidated
  const consolidated = useMemo(() => {
    const totalRevenue = productResults.reduce((s, r) => s + r.monthlyRevenue, 0);
    const totalProfit = productResults.reduce((s, r) => s + r.monthlyProfit, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    return { totalRevenue, totalProfit, avgMargin };
  }, [productResults]);

  const pieByProduct = useMemo(
    () =>
      productResults
        .filter(r => r.monthlyRevenue > 0)
        .map(r => ({ name: r.p.name || "Sem nome", value: r.monthlyRevenue })),
    [productResults]
  );

  const importFixedFromMap = () => {
    if (mapFixedCosts && mapFixedCosts > 0) {
      setMonthlyFixedCosts(mapFixedCosts);
      setFixedCostsFromMap(true);
      toast.success(`Custos fixos importados do Mapa: ${fmt(mapFixedCosts)}`);
    } else {
      toast.error("Preencha o Mapa Financeiro primeiro");
    }
  };

  // ── Catalog ──
  const analyzeCatalog = async () => {
    if (catalogFiles.length === 0) {
      toast.error("Envie pelo menos um arquivo");
      return;
    }
    setAnalyzingCatalog(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalog-price-analyzer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ filePaths: catalogFiles, niche: "" }),
        }
      );
      if (response.status === 429) { toast.error("Limite de requisições excedido"); return; }
      if (response.status === 402) { toast.error("Créditos esgotados"); return; }
      if (!response.ok) throw new Error("Erro na análise");
      const { analysis } = await response.json();
      setCatalogAnalysis(analysis);
      try {
        const serialized = JSON.stringify(analysis);
        sessionStorage.setItem(CATALOG_STORAGE_KEY, serialized);
        setSavedCatalogSnapshot(serialized);
      } catch { /* ignore */ }
      toast.success(`Análise concluída! ${analysis.products?.length || 0} produto(s) detectado(s).`);
    } catch (err) {
      toast.error("Erro ao analisar catálogo");
    } finally {
      setAnalyzingCatalog(false);
    }
  };

  const inferBusinessType = (cat?: string | null): BusinessType => {
    if (!cat) return "lojista";
    const c = cat.toLowerCase();
    if (/(artesa|feito|hand|prod[uú]z|costur|fabric|caseir)/i.test(c)) return "produtor";
    return "lojista";
  };

  const productFromDetected = (d: DetectedProduct): ProductRow => {
    const bt = inferBusinessType(d.category);
    const cost = d.estimated_cost ?? 0;
    const price = d.suggested_price ?? d.detected_price ?? 0;
    // Garante frete e embalagem mesmo se a IA retornar 0/null
    const freight = (d.freight_estimate && d.freight_estimate > 0)
      ? d.freight_estimate
      : (price > 0 ? Math.max(2, Math.round(price * 0.05 * 100) / 100) : 3);
    const pkg = (d.packaging_estimate && d.packaging_estimate > 0)
      ? d.packaging_estimate
      : 2;
    return {
      id: newId(),
      name: d.name || "Produto",
      businessType: bt,
      purchaseCost: bt === "lojista" ? cost : 0,
      freightPerUnit: freight,
      extraPackaging: pkg,
      directCosts: bt === "produtor"
        ? [
            { id: newId(), name: "Matéria-prima", value: cost },
            { id: newId(), name: "Embalagem", value: pkg },
            { id: newId(), name: "Frete/envio", value: freight },
            { id: newId(), name: "Mão de obra direta", value: 0 },
          ]
        : [{ id: "1", name: "Matéria-prima", value: 0 }, { id: "2", name: "Embalagem", value: 0 }, { id: "3", name: "Mão de obra direta", value: 0 }],
      quantityPerMonth: d.expected_monthly_units ?? 10,
      desiredMargin: d.margin_percent ?? 30,
      taxPercent: 10,
    };
  };

  const handleImportProduct = (d: DetectedProduct) => {
    const row = productFromDetected(d);
    setProducts(prev => {
      // Replace empty first row if it exists
      if (prev.length === 1 && !prev[0].name && prev[0].purchaseCost === 0) {
        return [row];
      }
      return [...prev, row];
    });
    setOpenItems(prev => [...prev, row.id]);
    toast.success(`"${d.name}" importado!`);
    setCatalogDialogOpen(false);
  };

  const handleImportAll = (list: DetectedProduct[]) => {
    if (!list.length) return;
    const rows = list.map(productFromDetected);
    setProducts(prev => {
      if (prev.length === 1 && !prev[0].name && prev[0].purchaseCost === 0) {
        return rows;
      }
      return [...prev, ...rows];
    });
    setOpenItems(rows.map(r => r.id));
    toast.success(`${rows.length} produtos importados! Revise quantidades vendidas/mês para break-even preciso.`);
    setCatalogDialogOpen(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Calculadora de Precos - Catalogo de Produtos", 20, 20);
    doc.setFontSize(10);
    doc.text(`Custos Fixos Mensais: ${fmt(monthlyFixedCosts)}`, 20, 30);
    let y = 40;
    productResults.forEach((r, idx) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`${idx + 1}. ${r.p.name || "Sem nome"} (${r.p.businessType})`, 20, y); y += 6;
      doc.setFontSize(9);
      doc.text(`Custo direto: ${fmt(r.directUnit)} | Rateio fixos: ${fmt(r.fixedPerUnit)} | Custo total: ${fmt(r.unitCost)}`, 20, y); y += 5;
      doc.text(`Preco venda: ${fmt(r.sellingPrice)} | Lucro/un: ${fmt(r.unitProfit)} | Margem: ${r.realMargin.toFixed(1)}%`, 20, y); y += 5;
      doc.text(`Qtd/mes: ${r.p.quantityPerMonth} | Faturamento: ${fmt(r.monthlyRevenue)} | Lucro mes: ${fmt(r.monthlyProfit)}`, 20, y); y += 5;
      if (r.breakEvenUnits !== Infinity) {
        doc.text(`Break-even (sua parte dos fixos ${fmt(r.fixedAllocated)}): ${r.breakEvenUnits} un/mes`, 20, y); y += 5;
      }
      y += 4;
    });
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.text(`CONSOLIDADO: Faturamento ${fmt(consolidated.totalRevenue)} | Lucro ${fmt(consolidated.totalProfit)} | Margem ${consolidated.avgMargin.toFixed(1)}%`, 20, y);
    doc.save("calculadora-produtos.pdf");
    toast.success("PDF exportado!");
  };

  return (
    <div className="space-y-4">
      <SessionIndicator show={hasRestoredSession} onClear={clearSession} />

      {/* ── Custos Fixos globais ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3 space-y-2">
          <Label className="text-xs font-semibold">Custos Fixos Mensais (rateados entre todos os produtos)</Label>
          <div className="flex items-end gap-2">
            <Input
              type="number" min={0} placeholder="R$ 0,00"
              value={monthlyFixedCosts || ""}
              onChange={e => { setMonthlyFixedCosts(parseFloat(e.target.value) || 0); setFixedCostsFromMap(false); }}
              className="flex-1"
            />
            {mapFixedCosts && mapFixedCosts > 0 && (
              <Button variant="outline" size="sm" onClick={importFixedFromMap} className="text-xs">
                Importar do Mapa
              </Button>
            )}
          </div>
          {fixedCostsFromMap && monthlyFixedCosts > 0 && (
            <Badge variant="secondary" className="text-[9px]">📥 Importado do Mapa Financeiro</Badge>
          )}
          <p className="text-[10px] text-muted-foreground">
            Aluguel, energia, internet, contador. Será dividido proporcionalmente ao faturamento de cada produto.
          </p>
        </CardContent>
      </Card>

      {/* ── Ações ── */}
      <div className="flex gap-2">
        <Button onClick={addProduct} size="sm" className="flex-1 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Adicionar Produto
        </Button>
        <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileSearch className="h-3.5 w-3.5" /> Importar Catálogo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Importar Catálogo de Produtos
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Envie PDFs, imagens, planilhas Excel ou Word. A IA extrai TODOS os produtos com preço, custo, frete, embalagem e margem sugerida.
              </p>
              <CatalogUploader fileUrls={catalogFiles} onFilesChange={setCatalogFiles} />
              <Button
                onClick={analyzeCatalog}
                disabled={catalogFiles.length === 0 || analyzingCatalog}
                className="w-full"
              >
                {analyzingCatalog ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</>
                ) : (
                  <><FileSearch className="h-4 w-4 mr-2" /> Analisar Catálogo</>
                )}
              </Button>
              {catalogAnalysis && (
                <CatalogAnalysisResult
                  analysis={catalogAnalysis}
                  onImportProduct={handleImportProduct}
                  onImportAll={handleImportAll}
                  onUpdateProduct={(idx, patch) =>
                    setCatalogAnalysis(prev =>
                      prev
                        ? {
                            ...prev,
                            products: prev.products.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
                          }
                        : prev
                    )
                  }
                  onSaveEdits={saveCatalogEdits}
                  onBulkUpdate={bulkUpdateCatalog}
                  hasUnsavedEdits={hasUnsavedCatalogEdits}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Lista de produtos ── */}
      <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="space-y-2">
        {productResults.map((r, idx) => {
          const p = r.p;
          return (
            <AccordionItem key={p.id} value={p.id} className="border rounded-lg bg-card overflow-hidden">
              <div className="flex items-stretch">
                <AccordionTrigger className="flex-1 px-3 py-2 hover:no-underline hover:bg-muted/30">
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium truncate">
                      {idx + 1}. {p.name || <span className="text-muted-foreground italic">Sem nome</span>}
                    </div>
                    <div className="flex gap-2 flex-wrap items-center text-[10px] text-muted-foreground mt-0.5">
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 gap-1">
                        {p.businessType === "lojista" ? <><Package className="h-2.5 w-2.5" /> Revendo</> : <><Briefcase className="h-2.5 w-2.5" /> Produzo</>}
                      </Badge>
                      <span>Preço: <strong className="text-foreground">{fmt(r.sellingPrice)}</strong></span>
                      <span>Margem: <strong className={r.realMargin >= 20 ? "text-emerald-600" : "text-destructive"}>{r.realMargin.toFixed(0)}%</strong></span>
                      {r.breakEvenUnits !== Infinity && (
                        <span>BE: <strong className="text-foreground">{r.breakEvenUnits}un</strong></span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-0.5 pr-2">
                  <Button size="icon" variant="ghost" onClick={() => duplicateProduct(p.id)} className="h-7 w-7" title="Duplicar">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeProduct(p.id)} className="h-7 w-7 text-destructive" title="Remover">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <AccordionContent className="px-3 pb-3 space-y-3">
                {/* Nome */}
                <div>
                  <Label className="text-xs">Nome do Produto</Label>
                  <Input value={p.name} onChange={e => updateProduct(p.id, { name: e.target.value })} placeholder="Ex: Esmalte Risqué Vermelho" className="mt-1" />
                </div>

                {/* Tipo */}
                <div className="rounded-md border bg-muted/30 p-2.5">
                  <Label className="text-xs font-semibold">Como você obtém este produto?</Label>
                  <p className="text-[10px] text-muted-foreground mb-2">Define quais custos a calculadora considera.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={p.businessType === "lojista" ? "default" : "outline"} size="sm" onClick={() => updateProduct(p.id, { businessType: "lojista" })} className="h-auto py-2 flex flex-col items-start gap-0.5 text-left">
                      <span className="flex items-center gap-1.5 text-xs font-semibold"><Package className="h-3.5 w-3.5" /> Revendo (compro pronto)</span>
                      <span className="text-[9px] opacity-80 font-normal">Compra + frete + embalagem</span>
                    </Button>
                    <Button variant={p.businessType === "produtor" ? "default" : "outline"} size="sm" onClick={() => updateProduct(p.id, { businessType: "produtor" })} className="h-auto py-2 flex flex-col items-start gap-0.5 text-left">
                      <span className="flex items-center gap-1.5 text-xs font-semibold"><Briefcase className="h-3.5 w-3.5" /> Eu produzo</span>
                      <span className="text-[9px] opacity-80 font-normal">Matéria-prima + embalagem + mão de obra</span>
                    </Button>
                  </div>
                </div>

                {/* Custos */}
                {p.businessType === "lojista" ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Valor de Compra (Fornecedor)</Label>
                      <Input type="number" min={0} step={0.01} value={p.purchaseCost || ""} onChange={e => updateProduct(p.id, { purchaseCost: parseFloat(e.target.value) || 0 })} className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Frete/un</Label>
                        <Input type="number" min={0} step={0.01} value={p.freightPerUnit || ""} onChange={e => updateProduct(p.id, { freightPerUnit: parseFloat(e.target.value) || 0 })} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Embalagem</Label>
                        <Input type="number" min={0} step={0.01} value={p.extraPackaging || ""} onChange={e => updateProduct(p.id, { extraPackaging: parseFloat(e.target.value) || 0 })} className="mt-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Custos Diretos por Unidade</Label>
                      <Button size="sm" variant="outline" onClick={() => addDirectCost(p.id)} className="h-6 text-[10px] gap-1">
                        <Plus className="h-3 w-3" /> Item
                      </Button>
                    </div>
                    {p.directCosts.map(c => (
                      <div key={c.id} className="flex gap-2 items-center">
                        <Input className="flex-1 h-8 text-xs" placeholder="Nome" value={c.name} onChange={e => updateDirectCost(p.id, c.id, "name", e.target.value)} />
                        <Input className="w-24 h-8 text-xs" type="number" min={0} step={0.01} placeholder="R$" value={c.value || ""} onChange={e => updateDirectCost(p.id, c.id, "value", parseFloat(e.target.value) || 0)} />
                        <Button size="icon" variant="ghost" onClick={() => removeDirectCost(p.id, c.id)} className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Qtd/mês</Label>
                    <Input type="number" min={1} value={p.quantityPerMonth || ""} onChange={e => updateProduct(p.id, { quantityPerMonth: Math.max(1, parseInt(e.target.value) || 1) })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Margem %</Label>
                    <Input type="number" min={0} max={99} value={p.desiredMargin} onChange={e => updateProduct(p.id, { desiredMargin: parseFloat(e.target.value) || 0 })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Imposto %</Label>
                    <Input type="number" min={0} value={p.taxPercent} onChange={e => updateProduct(p.id, { taxPercent: parseFloat(e.target.value) || 0 })} className="mt-1" />
                  </div>
                </div>

                {/* Resultados da linha */}
                <div className="rounded-md bg-muted/40 p-2.5 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Custo direto/un</span><span>{fmt(r.directUnit)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rateio fixos/un</span><span>{fmt(r.fixedPerUnit)}</span></div>
                  <div className="flex justify-between font-medium"><span>Custo total/un</span><span>{fmt(r.unitCost)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-sm"><span>Preço de Venda</span><span className="text-primary">{fmt(r.sellingPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Lucro/un</span><Badge variant={r.unitProfit > 0 ? "default" : "destructive"} className="text-[10px]">{fmt(r.unitProfit)}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Margem real</span><Badge variant={r.realMargin >= 20 ? "default" : "destructive"} className="text-[10px]">{r.realMargin.toFixed(1)}%</Badge></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">Faturamento mês</span><span className="font-semibold">{fmt(r.monthlyRevenue)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Lucro mês</span><span className="font-semibold text-primary">{fmt(r.monthlyProfit)}</span></div>
                </div>

                {/* Break-even por produto */}
                {monthlyFixedCosts > 0 && (
                  <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs space-y-1">
                    <p className="font-semibold flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-amber-600" /> Break-even deste produto</p>
                    <p className="text-muted-foreground">
                      Sua parte dos custos fixos: <strong className="text-foreground">{fmt(r.fixedAllocated)}</strong> ({(r.share * 100).toFixed(0)}% do total)
                    </p>
                    {r.breakEvenUnits !== Infinity ? (
                      <p>
                        Você precisa vender <strong className="text-foreground">{r.breakEvenUnits} un/mês</strong> para cobrir.
                        {p.quantityPerMonth >= r.breakEvenUnits ? (
                          <Badge variant="default" className="ml-2 text-[10px]">✅ ok</Badge>
                        ) : (
                          <Badge variant="destructive" className="ml-2 text-[10px]">⚠️ faltam {r.breakEvenUnits - p.quantityPerMonth}</Badge>
                        )}
                      </p>
                    ) : (
                      <p className="text-destructive">⚠️ Margem insuficiente para cobrir custos fixos. Aumente preço ou reduza custos.</p>
                    )}
                  </div>
                )}

                <MarginAlert margin={r.realMargin} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* ── Consolidado ── */}
      {products.length > 0 && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Resultado Consolidado ({products.length} produto{products.length > 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-md bg-background border">
                <p className="text-[9px] uppercase text-muted-foreground">Faturamento</p>
                <p className="text-sm font-bold text-emerald-600">{fmt(consolidated.totalRevenue)}</p>
              </div>
              <div className="p-2 rounded-md bg-background border">
                <p className="text-[9px] uppercase text-muted-foreground">Lucro</p>
                <p className={`text-sm font-bold ${consolidated.totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(consolidated.totalProfit)}</p>
              </div>
              <div className="p-2 rounded-md bg-background border">
                <p className="text-[9px] uppercase text-muted-foreground">Margem</p>
                <p className={`text-sm font-bold ${consolidated.avgMargin >= 20 ? "text-primary" : "text-destructive"}`}>{consolidated.avgMargin.toFixed(1)}%</p>
              </div>
            </div>

            {pieByProduct.length > 1 && (
              <div className="w-full h-[180px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieByProduct} cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={2} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {pieByProduct.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-center text-muted-foreground">% do faturamento por produto</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={exportPDF} className="w-full"><Download className="h-4 w-4 mr-2" /> Exportar PDF</Button>
    </div>
  );
}

// ═══════════════════════════════════════════
// ABA 2 — SERVIÇOS (multi-serviço, 2 modos)
// ═══════════════════════════════════════════
interface ServiceSessionState {
  services: ServiceItem[];
  proLabore: number;
  profitPercent: number;
  taxPercent: number;
}

const makeEmptyService = (): ServiceItem => ({
  id: newId(),
  name: "",
  mode: "session",
  hoursPerMonth: 0,
  hourlyRate: 0,
  pricePerSession: 0,
  sessionsPerMonth: 0,
  durationMinutes: 60,
  materialCostPerUnit: 0,
  fixedCosts: 0,
});

const SERVICE_TEMPLATES: { label: string; preset: Partial<ServiceItem> }[] = [
  { label: "Atendimento estética (R$80, 60/mês)", preset: { name: "Atendimento estética", mode: "session", pricePerSession: 80, sessionsPerMonth: 60, materialCostPerUnit: 8, durationMinutes: 60 } },
  { label: "Corte + escova (R$90, 80/mês)", preset: { name: "Corte + escova", mode: "session", pricePerSession: 90, sessionsPerMonth: 80, materialCostPerUnit: 5, durationMinutes: 75 } },
  { label: "Manicure (R$45, 100/mês)", preset: { name: "Manicure", mode: "session", pricePerSession: 45, sessionsPerMonth: 100, materialCostPerUnit: 3, durationMinutes: 45 } },
  { label: "Consultoria/hora (R$150, 20h)", preset: { name: "Consultoria", mode: "hourly", hourlyRate: 150, hoursPerMonth: 20 } },
];

const EMPTY_SERVICE_STATE: ServiceSessionState = {
  services: [makeEmptyService()],
  proLabore: 0,
  profitPercent: 30,
  taxPercent: 10,
};

function calcService(s: ServiceItem) {
  const revenue = s.mode === "hourly"
    ? s.hoursPerMonth * s.hourlyRate
    : s.pricePerSession * s.sessionsPerMonth;
  const units = s.mode === "hourly" ? s.hoursPerMonth : s.sessionsPerMonth;
  const materialTotal = s.materialCostPerUnit * units;
  const cost = materialTotal + s.fixedCosts;
  return { revenue, units, materialTotal, cost };
}

function ServiceCalculator() {
  const [sessionState, setSessionState, clearSession, hasRestoredSession] = useSessionPersistence<ServiceSessionState>(
    "session_service_calc_v2", EMPTY_SERVICE_STATE
  );

  const [services, setServices] = useState<ServiceItem[]>(sessionState.services.length ? sessionState.services : [makeEmptyService()]);
  const [proLabore, setProLabore] = useState(sessionState.proLabore);
  const [profitPercent, setProfitPercent] = useState(sessionState.profitPercent);
  const [taxPercent, setTaxPercent] = useState(sessionState.taxPercent);

  useEffect(() => {
    setSessionState({ services, proLabore, profitPercent, taxPercent });
  }, [services, proLabore, profitPercent, taxPercent, setSessionState]);

  const update = (id: string, patch: Partial<ServiceItem>) =>
    setServices(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  const add = () => setServices(prev => [...prev, makeEmptyService()]);
  const remove = (id: string) => {
    if (services.length <= 1) { toast.error("Mantenha pelo menos 1 serviço"); return; }
    setServices(prev => prev.filter(s => s.id !== id));
  };
  const applyTemplate = (id: string, preset: Partial<ServiceItem>) =>
    update(id, { ...preset });

  const results = useMemo(() => services.map(s => {
    const c = calcService(s);
    // share-allocate pró-labore proportionally to revenue
    return { s, ...c };
  }), [services]);

  const totalRevenue = results.reduce((acc, r) => acc + r.revenue, 0);
  const totalDirectCost = results.reduce((acc, r) => acc + r.cost, 0);
  const totalCostBeforeTax = totalDirectCost + proLabore;
  const profitAmount = totalCostBeforeTax * (profitPercent / 100);
  const priceBeforeTax = totalCostBeforeTax + profitAmount;
  const taxAmountTotal = priceBeforeTax * (taxPercent / 100);
  const finalPrice = priceBeforeTax + taxAmountTotal;

  // Break-even per service: how many sessions/hours to cover its share of (proLabore + tax)
  const perServiceBreakeven = useMemo(() => {
    const totalUnits = results.reduce((s, r) => s + r.units, 0);
    return results.map(r => {
      const share = totalRevenue > 0 ? r.revenue / totalRevenue : 1 / Math.max(results.length, 1);
      const allocatedFixed = (proLabore + r.s.fixedCosts * 0) * share + r.s.fixedCosts;
      const unitPrice = r.s.mode === "hourly" ? r.s.hourlyRate : r.s.pricePerSession;
      const unitMaterial = r.s.materialCostPerUnit;
      const contribution = unitPrice - unitMaterial;
      const beUnits = contribution > 0 ? Math.ceil(allocatedFixed / contribution) : Infinity;
      return { id: r.s.id, beUnits, allocatedFixed };
    });
  }, [results, totalRevenue, proLabore]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Calculadora de Precos - Servicos", 20, 20);
    doc.setFontSize(10);
    let y = 32;
    services.forEach((s, i) => {
      const c = calcService(s);
      const be = perServiceBreakeven.find(b => b.id === s.id);
      doc.text(`${i + 1}. ${s.name || "Sem nome"} (${s.mode === "hourly" ? "por hora" : "por atendimento"})`, 20, y); y += 5;
      if (s.mode === "hourly") {
        doc.text(`  ${s.hoursPerMonth}h/mes x R$${s.hourlyRate}/h = ${fmt(c.revenue)} | material ${fmt(c.materialTotal)} | fixos ${fmt(s.fixedCosts)}`, 20, y);
      } else {
        doc.text(`  ${s.sessionsPerMonth} atendimentos x R$${s.pricePerSession} = ${fmt(c.revenue)} | material ${fmt(c.materialTotal)} | fixos ${fmt(s.fixedCosts)}`, 20, y);
      }
      y += 5;
      if (be && be.beUnits !== Infinity) { doc.text(`  Break-even: ${be.beUnits} ${s.mode === "hourly" ? "horas" : "atendimentos"}/mes`, 20, y); y += 5; }
      y += 2;
      if (y > 260) { doc.addPage(); y = 20; }
    });
    y += 4;
    doc.text(`Pro-labore: ${fmt(proLabore)}`, 20, y); y += 5;
    doc.text(`Custo total: ${fmt(totalCostBeforeTax)} | Lucro ${profitPercent}%: ${fmt(profitAmount)} | Imposto ${taxPercent}%: ${fmt(taxAmountTotal)}`, 20, y); y += 6;
    doc.setFontSize(13);
    doc.text(`Faturamento Mensal Necessario: ${fmt(finalPrice)}`, 20, y);
    doc.save("calculadora-servicos.pdf");
    toast.success("PDF exportado!");
  };

  return (
    <div className="space-y-4">
      <SessionIndicator show={hasRestoredSession} onClear={clearSession} />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-muted-foreground">
            <Scissors className="h-3.5 w-3.5 inline mr-1" />
            Para cabeleireiras, esteticistas, manicures, massagistas, terapeutas, consultoras e qualquer prestadora de serviço.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={add} size="sm" className="flex-1 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Adicionar Serviço
        </Button>
      </div>

      {services.map((s, idx) => {
        const c = calcService(s);
        const be = perServiceBreakeven.find(b => b.id === s.id);
        return (
          <Card key={s.id} className="overflow-hidden">
            <CardContent className="pt-3 space-y-3">
              <div className="flex gap-2 items-center">
                <Input className="flex-1 h-9" placeholder={`Serviço ${idx + 1} (ex: Manicure, Corte)`} value={s.name} onChange={e => update(s.id, { name: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)} className="text-destructive h-8 w-8">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Templates */}
              {!s.name && (
                <div className="flex flex-wrap gap-1">
                  {SERVICE_TEMPLATES.map(t => (
                    <Button key={t.label} size="sm" variant="outline" className="text-[10px] h-6 px-2"
                      onClick={() => applyTemplate(s.id, t.preset)}>
                      {t.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Mode */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant={s.mode === "session" ? "default" : "outline"} size="sm" onClick={() => update(s.id, { mode: "session" })} className="gap-1.5 text-xs">
                  <Scissors className="h-3.5 w-3.5" /> Por Atendimento
                </Button>
                <Button variant={s.mode === "hourly" ? "default" : "outline"} size="sm" onClick={() => update(s.id, { mode: "hourly" })} className="gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5" /> Por Hora
                </Button>
              </div>

              {/* Fields */}
              {s.mode === "session" ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px]">Preço/atendimento</Label>
                    <Input type="number" min={0} step={0.01} value={s.pricePerSession || ""} onChange={e => update(s.id, { pricePerSession: parseFloat(e.target.value) || 0 })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Atendimentos/mês</Label>
                    <Input type="number" min={0} value={s.sessionsPerMonth || ""} onChange={e => update(s.id, { sessionsPerMonth: parseInt(e.target.value) || 0 })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Duração (min)</Label>
                    <Input type="number" min={0} value={s.durationMinutes || ""} onChange={e => update(s.id, { durationMinutes: parseInt(e.target.value) || 0 })} className="mt-1" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">R$/hora</Label>
                    <Input type="number" min={0} step={0.01} value={s.hourlyRate || ""} onChange={e => update(s.id, { hourlyRate: parseFloat(e.target.value) || 0 })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Horas/mês</Label>
                    <Input type="number" min={0} value={s.hoursPerMonth || ""} onChange={e => update(s.id, { hoursPerMonth: parseFloat(e.target.value) || 0 })} className="mt-1" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Material/un (R$) <InfoTip text="Custo dos produtos usados em cada atendimento (esmalte, tintura, cera...)" /></Label>
                  <Input type="number" min={0} step={0.01} value={s.materialCostPerUnit || ""} onChange={e => update(s.id, { materialCostPerUnit: parseFloat(e.target.value) || 0 })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-[10px]">Custo Fixo do Serviço (R$/mês) <InfoTip text="Custos específicos deste serviço por mês (aluguel de equipamento, etc)." /></Label>
                  <Input type="number" min={0} step={0.01} value={s.fixedCosts || ""} onChange={e => update(s.id, { fixedCosts: parseFloat(e.target.value) || 0 })} className="mt-1" />
                </div>
              </div>

              {/* Result for this service */}
              <div className="rounded-md bg-muted/40 p-2.5 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Receita</span><span className="font-semibold">{fmt(c.revenue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Custo materiais ({c.units} un)</span><span>{fmt(c.materialTotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Custos fixos do serviço</span><span>{fmt(s.fixedCosts)}</span></div>
                <Separator />
                <div className="flex justify-between font-medium"><span>Receita líquida</span><span className="text-primary">{fmt(c.revenue - c.cost)}</span></div>
                {be && be.beUnits !== Infinity && (
                  <div className="flex justify-between text-amber-600 pt-1">
                    <span>Break-even (incl. pró-labore)</span>
                    <span className="font-semibold">{be.beUnits} {s.mode === "hourly" ? "horas" : "atendimentos"}/mês</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Globais */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Configurações Globais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Pró-labore Desejado (R$/mês) <InfoTip text="Quanto você quer tirar de salário todo mês." /></Label>
            <Input type="number" min={0} value={proLabore || ""} onChange={e => setProLabore(parseFloat(e.target.value) || 0)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Margem de Lucro (%)</Label>
              <Input type="number" min={0} value={profitPercent} onChange={e => setProfitPercent(parseFloat(e.target.value) || 0)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Impostos (%)</Label>
              <Input type="number" min={0} value={taxPercent} onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Receita esperada</span><span>{fmt(totalRevenue)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Custos diretos (materiais + fixos do serviço)</span><span>{fmt(totalDirectCost)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Pró-labore</span><span>{fmt(proLabore)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Lucro ({profitPercent}%)</span><span>{fmt(profitAmount)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Impostos ({taxPercent}%)</span><span>{fmt(taxAmountTotal)}</span></div>
          <Separator />
          <div className="flex justify-between font-bold text-base"><span>Faturamento ideal</span><span className="text-primary">{fmt(finalPrice)}</span></div>
          <p className="text-[10px] text-muted-foreground pt-1">
            {totalRevenue >= finalPrice
              ? `✅ Sua receita atual (${fmt(totalRevenue)}) cobre o ideal.`
              : `⚠️ Faltam ${fmt(finalPrice - totalRevenue)} por mês. Aumente preço, atendimentos ou reduza custos.`}
          </p>
        </CardContent>
      </Card>

      <Button onClick={exportPDF} className="w-full"><Download className="h-4 w-4 mr-2" /> Exportar PDF</Button>
    </div>
  );
}

// ═══════════════════════════════════════════
// ABA 3 — MAPA FINANCEIRO (com gráficos)
// ═══════════════════════════════════════════
function FinancialMap({ onDataChange, onSave, onLoad, savedData, saving }: { 
  onDataChange: (data: FinancialData) => void;
  onSave: (mapData: any) => void;
  onLoad: () => void;
  savedData: any | null;
  saving: boolean;
}) {
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
  const [loaded, setLoaded] = useState(false);

  // Load saved data
  useEffect(() => {
    if (savedData && !loaded) {
      if (savedData.fixedCosts) setFixedCosts(savedData.fixedCosts);
      if (savedData.variableCosts) setVariableCosts(savedData.variableCosts);
      if (savedData.proLabore !== undefined) setProLabore(savedData.proLabore);
      if (savedData.monthlyRevenue !== undefined) setMonthlyRevenue(savedData.monthlyRevenue);
      if (savedData.taxPercent !== undefined) setTaxPercent(savedData.taxPercent);
      setLoaded(true);
    }
  }, [savedData, loaded]);

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

  // Push data to parent for dashboard
  useMemo(() => {
    onDataChange({ totalFixed, totalVariablePercent, totalVariableAmount, proLabore, taxPercent, taxAmount, monthlyRevenue, totalExpenses, realProfit, realMargin, breakEven, illusoryRevenue });
  }, [totalFixed, totalVariablePercent, totalVariableAmount, proLabore, taxPercent, taxAmount, monthlyRevenue, totalExpenses, realProfit, realMargin, breakEven, illusoryRevenue]);

  // Pie chart data for cost distribution
  const pieData = useMemo(() => {
    if (monthlyRevenue <= 0) return [];
    const items = [
      { name: "Custos Fixos", value: totalFixed },
      { name: "Custos Variáveis", value: totalVariableAmount },
      { name: "Pró-labore", value: proLabore },
      { name: "Impostos", value: taxAmount },
      { name: "Lucro Real", value: Math.max(0, realProfit) },
    ].filter(i => i.value > 0);
    return items;
  }, [totalFixed, totalVariableAmount, proLabore, taxAmount, realProfit, monthlyRevenue]);

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

      {/* Raio-X Card */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">🔍 Raio-X Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-1 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700">O que você fatura</p>
              </div>
              <p className="text-xl font-bold text-emerald-600">{fmt(monthlyRevenue)}</p>
            </Card>
            <Card className={`p-3 ${realProfit >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-center gap-1 mb-2">
                {realProfit >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                <p className={`text-xs font-semibold ${realProfit >= 0 ? "text-emerald-700" : "text-destructive"}`}>O que sobra de verdade</p>
              </div>
              <p className={`text-xl font-bold ${realProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(realProfit)}</p>
            </Card>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Custos Fixos</span><span>- {fmt(totalFixed)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Custos Variáveis ({totalVariablePercent}%)</span><span>- {fmt(totalVariableAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pró-labore</span><span>- {fmt(proLabore)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Impostos ({taxPercent}%)</span><span>- {fmt(taxAmount)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Lucro Real</span>
              <span className={realProfit >= 0 ? "text-primary" : "text-destructive"}>{fmt(realProfit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Margem Real</span>
              <Badge variant={realMargin >= 20 ? "default" : "destructive"}>{realMargin.toFixed(1)}%</Badge>
            </div>
          </div>

          <Separator />

          {monthlyRevenue > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/20 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">💡 Faturamento Ilusório</p>
              <p className="text-sm">
                Do seu faturamento de <strong>{fmt(monthlyRevenue)}</strong>, cerca de{" "}
                <strong className="text-destructive">{fmt(illusoryRevenue)}</strong> ({monthlyRevenue > 0 ? ((illusoryRevenue / monthlyRevenue) * 100).toFixed(0) : 0}%) são custos disfarçados.
              </p>
            </div>
          )}

          {breakEven > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
              <p className="text-xs font-semibold text-primary">📍 Ponto de Equilíbrio</p>
              <p className="text-sm">
                Você precisa faturar no mínimo <strong className="text-primary">{fmt(breakEven)}</strong>/mês para cobrir todos os custos.
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

      {/* ── PIE CHART: Distribuição do Faturamento ── */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Distribuição do Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={exportPDF} className="flex-1"><Download className="h-4 w-4 mr-2" /> Exportar PDF</Button>
        <Button 
          variant="secondary" 
          onClick={() => onSave({ fixedCosts, variableCosts, proLabore, monthlyRevenue, taxPercent })} 
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Scenario Types
// ═══════════════════════════════════════════
interface FinancialScenario {
  id: string;
  label: string;
  revenue: number;
  fixedCosts: number;
  variablePercent: number;
  proLabore: number;
  taxPercent: number;
  createdAt: string;
}

// ═══════════════════════════════════════════
// ABA 4 — DASHBOARD FINANCEIRO
// ═══════════════════════════════════════════
function FinancialDashboard({ data }: { data: FinancialData }) {
  const { user } = useAuth();
  const { totalFixed, totalVariablePercent, totalVariableAmount, proLabore, taxPercent: dataTaxPercent, taxAmount, monthlyRevenue, totalExpenses, realProfit, realMargin, breakEven } = data;

  // Simulation slider
  const [simEnabled, setSimEnabled] = useState(false);
  const [simRevenue, setSimRevenue] = useState(monthlyRevenue);
  
  // Scenarios
  const [scenarios, setScenarios] = useState<FinancialScenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [showScenarios, setShowScenarios] = useState(false);
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  useEffect(() => {
    if (!simEnabled) setSimRevenue(monthlyRevenue);
  }, [monthlyRevenue, simEnabled]);

  // Load scenarios on mount
  useEffect(() => {
    if (!user) return;
    loadScenarios();
  }, [user]);

  const loadScenarios = async () => {
    if (!user) return;
    setLoadingScenarios(true);
    try {
      const { data: snapshots } = await supabase
        .from("financial_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .eq("snapshot_type", "scenario")
        .order("created_at", { ascending: false });

      if (snapshots) {
        setScenarios(snapshots.map(s => ({
          id: s.id,
          label: s.label || "Sem nome",
          ...(s.data as any),
          createdAt: s.created_at || "",
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const saveScenario = async () => {
    if (!user) return;
    const label = scenarioName.trim() || `Cenário ${scenarios.length + 1}`;
    const scenarioData = {
      revenue: activeRevenue,
      fixedCosts: totalFixed,
      variablePercent: totalVariablePercent,
      proLabore,
      taxPercent: dataTaxPercent,
    };
    try {
      await supabase
        .from("financial_snapshots")
        .insert({
          user_id: user.id,
          snapshot_type: "scenario",
          label,
          data: scenarioData as any,
        });
      toast.success(`Cenário "${label}" salvo!`);
      setScenarioName("");
      await loadScenarios();
    } catch (err) {
      toast.error("Erro ao salvar cenário");
    }
  };

  const deleteScenario = async (id: string) => {
    try {
      await supabase.from("financial_snapshots").delete().eq("id", id);
      setScenarios(prev => prev.filter(s => s.id !== id));
      toast.success("Cenário removido");
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  const calcScenario = (s: FinancialScenario) => {
    const varAmt = s.revenue * (s.variablePercent / 100);
    const taxAmt = s.revenue * (s.taxPercent / 100);
    const expenses = s.fixedCosts + varAmt + s.proLabore + taxAmt;
    const profit = s.revenue - expenses;
    const margin = s.revenue > 0 ? (profit / s.revenue) * 100 : 0;
    return { expenses, profit, margin };
  };

  // Use simulated or real values
  const activeRevenue = simEnabled ? simRevenue : monthlyRevenue;
  const simVariableAmount = activeRevenue * (totalVariablePercent / 100);
  const simTaxAmount = activeRevenue * (dataTaxPercent / 100);
  const simTotalExpenses = totalFixed + simVariableAmount + proLabore + simTaxAmount;
  const simRealProfit = activeRevenue - simTotalExpenses;
  const simRealMargin = activeRevenue > 0 ? (simRealProfit / activeRevenue) * 100 : 0;

  const hasData = monthlyRevenue > 0 || simEnabled;

  const healthStatus = useMemo(() => {
    if (!hasData) return { label: "Sem dados", color: "text-muted-foreground", bg: "bg-muted", icon: "⚪" };
    if (simRealMargin >= 20) return { label: "Saudável", color: "text-emerald-700", bg: "bg-emerald-500/10", icon: "🟢" };
    if (simRealMargin >= 10) return { label: "Atenção", color: "text-amber-700", bg: "bg-amber-500/10", icon: "🟡" };
    return { label: "Crítico", color: "text-destructive", bg: "bg-destructive/10", icon: "🔴" };
  }, [simRealMargin, hasData]);

  const pieData = useMemo(() => {
    if (!hasData) return [];
    return [
      { name: "Custos Fixos", value: totalFixed },
      { name: "Custos Variáveis", value: simVariableAmount },
      { name: "Pró-labore", value: proLabore },
      { name: "Impostos", value: simTaxAmount },
    ].filter(i => i.value > 0);
  }, [totalFixed, simVariableAmount, proLabore, simTaxAmount, hasData]);

  const barData = useMemo(() => {
    if (!hasData) return [];
    return [
      { name: "Faturamento", valor: activeRevenue },
      { name: "Despesas", valor: simTotalExpenses },
      { name: "Lucro", valor: Math.max(0, simRealProfit) },
    ];
  }, [activeRevenue, simTotalExpenses, simRealProfit, hasData]);

  const breakEvenProgress = useMemo(() => {
    if (!hasData || breakEven <= 0) return 0;
    return Math.min((activeRevenue / breakEven) * 100, 150);
  }, [activeRevenue, breakEven, hasData]);

  // Comparison bar data for scenarios
  const comparisonData = useMemo(() => {
    if (scenarios.length === 0) return [];
    const current = { name: "Atual", faturamento: activeRevenue, lucro: simRealProfit, margem: simRealMargin };
    const scenarioItems = scenarios.map(s => {
      const c = calcScenario(s);
      return { name: s.label.substring(0, 12), faturamento: s.revenue, lucro: c.profit, margem: c.margin };
    });
    return [current, ...scenarioItems];
  }, [scenarios, activeRevenue, simRealProfit, simRealMargin]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Dashboard Financeiro", 20, 25);
    doc.setFontSize(11);
    let y = 40;
    doc.text(`Faturamento: ${fmt(activeRevenue)}`, 20, y); y += 7;
    doc.text(`Total Despesas: ${fmt(simTotalExpenses)}`, 20, y); y += 7;
    doc.text(`Lucro Real: ${fmt(simRealProfit)}`, 20, y); y += 7;
    doc.text(`Margem Real: ${simRealMargin.toFixed(1)}%`, 20, y); y += 10;
    doc.text(`Custos Fixos: ${fmt(totalFixed)}`, 20, y); y += 7;
    doc.text(`Custos Variaveis: ${fmt(simVariableAmount)}`, 20, y); y += 7;
    doc.text(`Pro-labore: ${fmt(proLabore)}`, 20, y); y += 7;
    doc.text(`Impostos: ${fmt(simTaxAmount)}`, 20, y); y += 10;
    doc.text(`Ponto de Equilibrio: ${fmt(breakEven)}`, 20, y); y += 7;
    doc.text(`Saude Financeira: ${healthStatus.label}`, 20, y);
    if (simEnabled) { y += 10; doc.text(`(Simulacao com faturamento de ${fmt(simRevenue)})`, 20, y); }

    // Include scenarios in PDF
    if (scenarios.length > 0) {
      y += 14;
      doc.setFontSize(13);
      doc.text("Cenarios Comparativos", 20, y); y += 8;
      doc.setFontSize(10);
      scenarios.forEach(s => {
        const c = calcScenario(s);
        doc.text(`${s.label}: Faturamento ${fmt(s.revenue)} | Lucro ${fmt(c.profit)} | Margem ${c.margin.toFixed(1)}%`, 20, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }

    doc.save("dashboard-financeiro.pdf");
    toast.success("PDF exportado!");
  };

  if (!hasData) {
    return (
      <div className="text-center py-12 space-y-3">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto" />
        <p className="text-muted-foreground text-sm">Preencha os dados na aba <strong>Mapa Financeiro</strong> para visualizar o dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simulation Slider */}
      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Simulador de Faturamento</span>
          </div>
          <Button 
            variant={simEnabled ? "default" : "outline"} 
            size="sm" 
            onClick={() => setSimEnabled(!simEnabled)}
            className="text-xs"
          >
            {simEnabled ? "Desativar" : "Ativar Simulação"}
          </Button>
        </div>
        {simEnabled && (
          <div className="space-y-2 mt-3">
            <Slider
              value={[simRevenue]}
              onValueChange={(v) => setSimRevenue(v[0])}
              min={0}
              max={Math.max(monthlyRevenue * 3, 50000)}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>R$ 0</span>
              <span className="font-bold text-primary text-sm">{fmt(simRevenue)}</span>
              <span>{fmt(Math.max(monthlyRevenue * 3, 50000))}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 border-emerald-500/20">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Faturamento</p>
          <p className="text-lg font-bold text-foreground">{fmt(activeRevenue)}</p>
          {simEnabled && activeRevenue !== monthlyRevenue && (
            <p className="text-[10px] text-muted-foreground">Real: {fmt(monthlyRevenue)}</p>
          )}
        </Card>
        <Card className="p-3 border-destructive/20">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Despesas</p>
          <p className="text-lg font-bold text-foreground">{fmt(simTotalExpenses)}</p>
        </Card>
        <Card className={`p-3 ${simRealProfit >= 0 ? "border-emerald-500/20" : "border-destructive/20"}`}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Lucro Real</p>
          <p className={`text-lg font-bold ${simRealProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(simRealProfit)}</p>
        </Card>
        <Card className={`p-3 ${healthStatus.bg}`}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Margem Real</p>
          <p className={`text-lg font-bold ${healthStatus.color}`}>{simRealMargin.toFixed(1)}%</p>
        </Card>
      </div>

      {/* Health Status */}
      <Card className={`p-4 ${healthStatus.bg} border-2`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{healthStatus.icon}</span>
          <div>
            <p className={`font-bold ${healthStatus.color}`}>Saúde Financeira: {healthStatus.label}</p>
            <p className="text-xs text-muted-foreground">
              {simRealMargin >= 20 && "Seu negócio está com margem saudável. Continue otimizando custos."}
              {simRealMargin >= 10 && simRealMargin < 20 && "Margem abaixo de 20%. Analise possibilidades de redução de custos ou aumento de preço."}
              {simRealMargin < 10 && "Margem crítica. É urgente revisar sua estrutura de custos e precificação."}
            </p>
          </div>
        </div>
      </Card>

      {/* ── SCENARIOS SECTION ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">📊 Cenários Financeiros</span>
            <Button variant="outline" size="sm" onClick={() => setShowScenarios(!showScenarios)} className="text-xs">
              {showScenarios ? "Ocultar" : "Gerenciar"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showScenarios && (
          <CardContent className="space-y-4">
            {/* Save current as scenario */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome do cenário (ex: Otimista)"
                value={scenarioName}
                onChange={e => setScenarioName(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={saveScenario} className="gap-1 shrink-0">
                <Save className="h-3.5 w-3.5" /> Salvar Cenário
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Salva o cenário atual (faturamento {simEnabled ? "simulado" : "real"} de {fmt(activeRevenue)}) para comparação futura.
            </p>

            {/* Saved scenarios list */}
            {scenarios.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground">Cenários Salvos</p>
                {scenarios.map(s => {
                  const c = calcScenario(s);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.label}</p>
                        <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                          <span>Fat: {fmt(s.revenue)}</span>
                          <span className={c.profit >= 0 ? "text-emerald-600" : "text-destructive"}>
                            Lucro: {fmt(c.profit)}
                          </span>
                          <span>Margem: {c.margin.toFixed(1)}%</span>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => deleteScenario(s.id)} className="text-destructive h-8 w-8 shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Comparison Chart */}
            {comparisonData.length > 1 && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground">Comparativo de Cenários</p>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [fmt(value), name === "faturamento" ? "Faturamento" : name === "lucro" ? "Lucro" : name]}
                        contentStyle={{ borderRadius: "8px", fontSize: "11px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="faturamento" name="Faturamento" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lucro" name="Lucro" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Bar Chart: Revenue vs Expenses vs Profit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Faturamento vs Despesas vs Lucro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  formatter={(value: number) => fmt(value)}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {barData.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={CHART_COLORS_BAR[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart: Expense Composition */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Composição das Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}: {fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Break-even Progress */}
      {breakEven > 0 && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Ponto de Equilíbrio
            </p>
          <Badge variant={activeRevenue >= breakEven ? "default" : "destructive"}>
            {activeRevenue >= breakEven ? "Acima ✅" : "Abaixo ⚠️"}
          </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>R$ 0</span>
              <span>Meta: {fmt(breakEven)}</span>
            </div>
            <Progress value={Math.min(breakEvenProgress, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              Seu faturamento atual é <strong>{breakEvenProgress.toFixed(0)}%</strong> do ponto de equilíbrio
            </p>
          </div>
        </Card>
      )}

      <Button onClick={exportPDF} className="w-full"><Download className="h-4 w-4 mr-2" /> Exportar Dashboard PDF</Button>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN — 4 abas
// ═══════════════════════════════════════════
interface PriceCalcSessionState {
  activeTab: string;
}

const EMPTY_PRICE_STATE: PriceCalcSessionState = { activeTab: "product" };

export default function PriceCalculator() {
  const { user } = useAuth();
  const [sessionState, setSessionState, clearSession, hasRestoredSession] = useSessionPersistence<PriceCalcSessionState>(
    "session_price_calculator", EMPTY_PRICE_STATE
  );
  const [activeTab, setActiveTab] = useState(sessionState.activeTab);
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalFixed: 0, totalVariablePercent: 0, totalVariableAmount: 0, proLabore: 0,
    taxPercent: 0, taxAmount: 0, monthlyRevenue: 0, totalExpenses: 0,
    realProfit: 0, realMargin: 0, breakEven: 0, illusoryRevenue: 0,
  });
  const [savedMapData, setSavedMapData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Compute map fixed costs from live data or saved data
  const mapFixedCosts = useMemo(() => {
    if (financialData.totalFixed > 0) return financialData.totalFixed;
    if (savedMapData?.fixedCosts) {
      return (savedMapData.fixedCosts as CostItem[]).reduce((s: number, c: any) => s + (c.value || 0), 0);
    }
    return 0;
  }, [financialData.totalFixed, savedMapData]);

  useEffect(() => {
    setSessionState({ activeTab });
  }, [activeTab, setSessionState]);

  // Load saved financial data on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("financial_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .eq("snapshot_type", "financial_map")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.data) {
          setSavedMapData(data.data);
        }
      });
  }, [user]);

  const handleSaveMap = async (mapData: any) => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("financial_snapshots")
        .select("id")
        .eq("user_id", user.id)
        .eq("snapshot_type", "financial_map")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("financial_snapshots")
          .update({ data: mapData })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("financial_snapshots")
          .insert({ user_id: user.id, snapshot_type: "financial_map", data: mapData, label: "Mapa Financeiro" });
      }
      toast.success("Dados financeiros salvos! 💾");
    } catch (err) {
      toast.error("Erro ao salvar dados");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadMap = () => {
    toast.info("Dados carregados do banco");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <MissionContextBanner />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Central Financeira</h1>
            <p className="text-xs text-muted-foreground">
              Precifique com precisão e entenda a saúde financeira do seu negócio
            </p>
          </div>
        </div>
        <FinishMissionButton />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="product" className="flex-1 gap-1 text-[11px] px-1">
            <Package className="h-3.5 w-3.5" /> Produto
          </TabsTrigger>
          <TabsTrigger value="service" className="flex-1 gap-1 text-[11px] px-1">
            <Briefcase className="h-3.5 w-3.5" /> Serviço
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex-1 gap-1 text-[11px] px-1">
            <BarChart3 className="h-3.5 w-3.5" /> Mapa
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex-1 gap-1 text-[11px] px-1">
            <PieChartIcon className="h-3.5 w-3.5" /> Financeiro
          </TabsTrigger>
        </TabsList>
        <TabsContent value="product"><ProductCalculator mapFixedCosts={mapFixedCosts} /></TabsContent>
        <TabsContent value="service"><ServiceCalculator mapFixedCosts={mapFixedCosts} /></TabsContent>
        <TabsContent value="financial">
          <FinancialMap 
            onDataChange={setFinancialData} 
            onSave={handleSaveMap} 
            onLoad={handleLoadMap} 
            savedData={savedMapData} 
            saving={saving} 
          />
        </TabsContent>
        <TabsContent value="dashboard"><FinancialDashboard data={financialData} /></TabsContent>
      </Tabs>
    </div>
  );
}
