import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, TrendingUp, Lightbulb, ArrowRight, ArrowDownAZ, Percent, DollarSign, FileCheck, Calculator, Save, Wand2 } from "lucide-react";

export interface DetectedProduct {
  name: string;
  sku?: string | null;
  category?: string | null;
  detected_price?: number | null;
  suggested_price?: number | null;
  estimated_cost?: number | null;
  freight_estimate?: number | null;
  packaging_estimate?: number | null;
  margin_percent?: number | null;
  expected_monthly_units?: number | null;
  freight_source?: "detected" | "estimated" | null;
  cost_source?: "detected" | "estimated" | null;
  notes?: string | null;
}

export interface CatalogAnalysis {
  products: DetectedProduct[];
  insights: string[];
  pricing_recommendations: string[];
}

interface CatalogAnalysisResultProps {
  analysis: CatalogAnalysis;
  onImportProduct?: (product: DetectedProduct) => void;
  onImportAll?: (products: DetectedProduct[]) => void;
  onUpdateProduct?: (index: number, patch: Partial<DetectedProduct>) => void;
  onSaveEdits?: () => void;
  onBulkUpdate?: (patch: Partial<Pick<DetectedProduct, "freight_estimate" | "packaging_estimate">>) => void;
  hasUnsavedEdits?: boolean;
}

const fmt = (v: number | null | undefined) =>
  v == null ? "—" : `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type SortKey = "name" | "margin" | "price";

export function CatalogAnalysisResult({ analysis, onImportProduct, onImportAll, onUpdateProduct, onSaveEdits, onBulkUpdate, hasUnsavedEdits }: CatalogAnalysisResultProps) {
  const [sort, setSort] = useState<SortKey>("margin");
  const [bulkFreight, setBulkFreight] = useState<string>("");
  const [bulkPackaging, setBulkPackaging] = useState<string>("");

  const applyBulk = () => {
    if (!onBulkUpdate) return;
    const patch: Partial<Pick<DetectedProduct, "freight_estimate" | "packaging_estimate">> = {};
    if (bulkFreight !== "") patch.freight_estimate = parseFloat(bulkFreight) || 0;
    if (bulkPackaging !== "") patch.packaging_estimate = parseFloat(bulkPackaging) || 0;
    if (Object.keys(patch).length === 0) return;
    onBulkUpdate(patch);
    setBulkFreight("");
    setBulkPackaging("");
  };

  const sorted = useMemo(() => {
    const arr = analysis.products.map((p, originalIndex) => ({ ...p, __originalIndex: originalIndex }));
    if (sort === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "margin") arr.sort((a, b) => (b.margin_percent ?? -1) - (a.margin_percent ?? -1));
    if (sort === "price") arr.sort((a, b) => (b.suggested_price ?? b.detected_price ?? 0) - (a.suggested_price ?? a.detected_price ?? 0));
    return arr;
  }, [analysis.products, sort]);

  const stats = useMemo(() => {
    const margins = analysis.products.map(p => p.margin_percent).filter((v): v is number => v != null);
    const prices = analysis.products.map(p => p.suggested_price ?? p.detected_price).filter((v): v is number => v != null);
    const sum = (key: keyof DetectedProduct) =>
      analysis.products.reduce((s, p) => s + (Number(p[key]) || 0), 0);
    const totalCost = sum("estimated_cost");
    const totalFreight = sum("freight_estimate");
    const totalPackaging = sum("packaging_estimate");
    return {
      count: analysis.products.length,
      avgMargin: margins.length ? margins.reduce((s, v) => s + v, 0) / margins.length : 0,
      avgPrice: prices.length ? prices.reduce((s, v) => s + v, 0) / prices.length : 0,
      totalCost,
      totalFreight,
      totalPackaging,
      totalDirectCosts: totalCost + totalFreight + totalPackaging,
    };
  }, [analysis.products]);

  return (
    <div className="space-y-4">
      {analysis.products.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                {stats.count} produto{stats.count > 1 ? "s" : ""} detectado{stats.count > 1 ? "s" : ""}
              </CardTitle>
              {onImportAll && (
                <Button size="sm" onClick={() => onImportAll(analysis.products)} className="gap-1.5 h-7 text-xs">
                  <FileCheck className="h-3.5 w-3.5" /> Importar todos
                </Button>
              )}
            </div>
            <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
              <span>Margem média: <strong className="text-foreground">{stats.avgMargin.toFixed(1)}%</strong></span>
              <span>Ticket médio: <strong className="text-foreground">{fmt(stats.avgPrice)}</strong></span>
            </div>
            <div className="flex gap-1 mt-2 items-center flex-wrap">
              <Button size="sm" variant={sort === "name" ? "default" : "outline"} onClick={() => setSort("name")} className="h-6 text-[10px] px-2 gap-1">
                <ArrowDownAZ className="h-3 w-3" /> Nome
              </Button>
              <Button size="sm" variant={sort === "margin" ? "default" : "outline"} onClick={() => setSort("margin")} className="h-6 text-[10px] px-2 gap-1">
                <Percent className="h-3 w-3" /> Margem
              </Button>
              <Button size="sm" variant={sort === "price" ? "default" : "outline"} onClick={() => setSort("price")} className="h-6 text-[10px] px-2 gap-1">
                <DollarSign className="h-3 w-3" /> Preço
              </Button>
              {onSaveEdits && (
                <Button
                  size="sm"
                  variant={hasUnsavedEdits ? "default" : "outline"}
                  onClick={onSaveEdits}
                  disabled={!hasUnsavedEdits}
                  className="h-6 text-[10px] px-2 gap-1 ml-auto"
                  title="Salvar alterações de frete/embalagem"
                >
                  <Save className="h-3 w-3" />
                  {hasUnsavedEdits ? "Salvar edições" : "Salvo"}
                </Button>
              )}
            </div>

            {onBulkUpdate && (
              <div className="mt-2 rounded-md border border-dashed bg-muted/30 p-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                  <Wand2 className="h-3 w-3 text-primary" />
                  Edição em massa (aplica a todos os {stats.count} produtos)
                </div>
                <div className="flex items-end gap-2 flex-wrap">
                  <div className="flex-1 min-w-[100px]">
                    <Label className="text-[10px] text-muted-foreground">Frete (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={bulkFreight}
                      placeholder="Ex: 3,50"
                      onChange={(e) => setBulkFreight(e.target.value)}
                      className="h-7 text-[11px] mt-0.5"
                    />
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <Label className="text-[10px] text-muted-foreground">Embalagem (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={bulkPackaging}
                      placeholder="Ex: 2,00"
                      onChange={(e) => setBulkPackaging(e.target.value)}
                      className="h-7 text-[11px] mt-0.5"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={applyBulk}
                    disabled={bulkFreight === "" && bulkPackaging === ""}
                    className="h-7 text-[10px] gap-1"
                  >
                    Aplicar a todos
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Deixe um campo vazio para não alterá-lo.
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {sorted.map((product, i) => {
              const margin = product.margin_percent;
              const totalCost =
                (product.estimated_cost ?? 0) +
                (product.freight_estimate ?? 0) +
                (product.packaging_estimate ?? 0);
              return (
                <div
                  key={i}
                  className="rounded-md border bg-card p-2.5 text-sm space-y-1.5"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight truncate">{product.name}</div>
                      <div className="flex gap-2 flex-wrap text-[10px] text-muted-foreground mt-0.5">
                        {product.category && <span>{product.category}</span>}
                        {product.sku && <span>SKU: {product.sku}</span>}
                      </div>
                    </div>
                    {onImportProduct && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 shrink-0"
                        onClick={() => onImportProduct(product)}
                        title="Importar este produto"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo:</span>
                      <span className="flex items-center gap-1">
                        {fmt(product.estimated_cost)}
                        {product.cost_source === "estimated" && <span title="Estimado" className="text-[9px]">🤖</span>}
                        {product.cost_source === "detected" && <span title="Detectado" className="text-[9px]">📄</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Frete:</span>
                      {onUpdateProduct ? (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={product.freight_estimate ?? ""}
                          onChange={(e) =>
                            onUpdateProduct((product as any).__originalIndex, {
                              freight_estimate: e.target.value === "" ? null : parseFloat(e.target.value),
                              freight_source: "detected",
                            })
                          }
                          className="h-6 w-20 text-[11px] px-1.5 text-right"
                          aria-label="Editar frete"
                        />
                      ) : (
                        <span className="flex items-center gap-1">
                          {fmt(product.freight_estimate)}
                          {product.freight_source === "estimated" && <span title="Estimado" className="text-[9px]">🤖</span>}
                          {product.freight_source === "detected" && <span title="Detectado" className="text-[9px]">📄</span>}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Embalagem:</span>
                      {onUpdateProduct ? (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={product.packaging_estimate ?? ""}
                          onChange={(e) =>
                            onUpdateProduct((product as any).__originalIndex, {
                              packaging_estimate: e.target.value === "" ? null : parseFloat(e.target.value),
                            })
                          }
                          className="h-6 w-20 text-[11px] px-1.5 text-right"
                          aria-label="Editar embalagem"
                        />
                      ) : (
                        <span>{fmt(product.packaging_estimate)}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total custo:</span>
                      <span className="font-medium">{fmt(totalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preço atual:</span>
                      <span>{fmt(product.detected_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sugerido:</span>
                      <span className="font-semibold text-primary">{fmt(product.suggested_price)}</span>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium text-foreground">Composição:</span>
                    <span>
                      Direto <strong className="text-foreground">{fmt(product.estimated_cost)}</strong>
                      {" + "}Frete <strong className="text-foreground">{fmt(product.freight_estimate)}</strong>
                      {" + "}Embalagem <strong className="text-foreground">{fmt(product.packaging_estimate)}</strong>
                      {" = "}<strong className="text-emerald-700">{fmt(totalCost)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {margin != null && (
                      <Badge
                        variant={margin >= 30 ? "default" : margin >= 15 ? "secondary" : "destructive"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        Margem {margin.toFixed(0)}%
                      </Badge>
                    )}
                    {product.expected_monthly_units != null && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        ~{product.expected_monthly_units} un/mês
                      </Badge>
                    )}
                  </div>

                  {product.notes && (
                    <p className="text-[10px] text-muted-foreground italic pt-0.5">{product.notes}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {analysis.products.length > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-600" />
              Resumo da importação ({stats.count} {stats.count > 1 ? "produtos" : "produto"})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total custo (compra/produção):</span>
                <span className="font-medium">{fmt(stats.totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total frete:</span>
                <span className="font-medium">{fmt(stats.totalFreight)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total embalagem:</span>
                <span className="font-medium">{fmt(stats.totalPackaging)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 col-span-2 mt-1">
                <span className="font-semibold">Custos diretos totais:</span>
                <span className="font-bold text-emerald-700">{fmt(stats.totalDirectCosts)}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Edite frete e embalagem direto na linha de cada produto acima — os totais atualizam automaticamente.
            </p>
          </CardContent>
        </Card>
      )}

      {analysis.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Insights de Precificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {analysis.insights.map((insight, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary shrink-0">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {analysis.pricing_recommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {analysis.pricing_recommendations.map((rec, i) => (
                <li key={i} className="text-xs flex gap-2">
                  <span className="text-primary shrink-0">💡</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
