import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Scissors, FileCheck, FileSearch, Sparkles, AlertCircle } from "lucide-react";
import type { DetectedProduct, CatalogAnalysis } from "./CatalogAnalysisResult";

export type ServiceSourceTag = "detected" | "estimated" | "missing";

interface Props {
  analysis: CatalogAnalysis;
  onConfirm: (selected: DetectedProduct[]) => void;
  onCancel?: () => void;
}

function inferSource(value: number | null | undefined, declared?: string | null): ServiceSourceTag {
  if (value == null || value <= 0) return "missing";
  if (declared === "estimated") return "estimated";
  if (declared === "detected") return "detected";
  return "detected";
}

function SourceBadge({ source, label }: { source: ServiceSourceTag; label: string }) {
  const cfg: Record<ServiceSourceTag, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any; text: string; tip: string }> = {
    detected:  { variant: "secondary",  icon: FileCheck,   text: "Detectado", tip: `${label} foi extraído diretamente do catálogo enviado.` },
    estimated: { variant: "outline",    icon: Sparkles,    text: "Estimado",  tip: `${label} não estava no catálogo — a IA inferiu um valor padrão. Confira antes de calcular.` },
    missing:   { variant: "destructive", icon: AlertCircle, text: "Faltando",  tip: `${label} não foi informado. Preencha manualmente para o cálculo ficar confiável.` },
  };
  const { variant, icon: Icon, text, tip } = cfg[source];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="text-[9px] px-1.5 py-0 gap-1 cursor-help">
            <Icon className="h-2.5 w-2.5" /> {text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-[11px]">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ServiceImportReview({ analysis, onConfirm, onCancel }: Props) {
  // Local editable copy of all detected services
  const [items, setItems] = useState<DetectedProduct[]>(() =>
    analysis.products.map(p => ({ ...p }))
  );
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(analysis.products.map((_, i) => i))
  );

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((_, i) => i)));
  };

  const update = (i: number, patch: Partial<DetectedProduct>) =>
    setItems(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const summary = useMemo(() => {
    const sel = items.filter((_, i) => selected.has(i));
    let assumedFields = 0;
    sel.forEach(s => {
      if (!s.detected_price && !s.suggested_price) assumedFields++;
      if (s.estimated_cost == null) assumedFields++;
      if (!s.expected_monthly_units) assumedFields++;
      if (!s.margin_percent) assumedFields++;
    });
    return { count: sel.length, assumedFields };
  }, [items, selected]);

  const allSelected = selected.size === items.length && items.length > 0;

  return (
    <div className="space-y-3">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" />
            Revisão da importação ({items.length} serviço{items.length === 1 ? "" : "s"} detectado{items.length === 1 ? "" : "s"})
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-1">
            Marque os serviços e edite os valores direto abaixo. Serviços <strong>não usam frete nem embalagem</strong> — só preço, custo do insumo (cosmético/óleo/descartável), atendimentos/mês e margem. Selos <strong>Estimado</strong>/<strong>Faltando</strong> indicam o que precisa de revisão.
          </p>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={toggleAll} className="h-7 text-[11px]">
              {allSelected ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              {summary.count} selecionado{summary.count === 1 ? "" : "s"} · {summary.assumedFields} campo{summary.assumedFields === 1 ? "" : "s"} assumido{summary.assumedFields === 1 ? "" : "s"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {items.map((s, i) => {
          const isOn = selected.has(i);
          const priceVal = s.detected_price ?? s.suggested_price ?? null;
          const priceSrc = inferSource(priceVal, s.detected_price != null ? "detected" : (s.suggested_price != null ? "estimated" : null));
          const costSrc = inferSource(s.estimated_cost, s.cost_source);
          const monthlySrc = inferSource(s.expected_monthly_units, s.expected_monthly_units != null ? "detected" : null);
          const marginSrc = inferSource(s.margin_percent, s.margin_percent != null ? "detected" : null);

          return (
            <div
              key={i}
              className={`rounded-md border p-2.5 space-y-2 transition-colors ${isOn ? "bg-card" : "bg-muted/30 opacity-70"}`}
            >
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={isOn}
                  onCheckedChange={() => toggle(i)}
                  className="mt-1"
                  aria-label={`Selecionar ${s.name}`}
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <Input
                    value={s.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    className="h-8 text-sm font-medium"
                    placeholder="Nome do serviço"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <FieldEdit
                      label="Preço (R$)"
                      source={priceSrc}
                      value={priceVal ?? ""}
                      onChange={(v) => update(i, { detected_price: v, suggested_price: v })}
                    />
                    <FieldEdit
                      label="Custo insumo (R$)"
                      source={costSrc}
                      value={s.estimated_cost ?? ""}
                      onChange={(v) => update(i, { estimated_cost: v, cost_source: v == null ? null : "detected" })}
                    />
                    <FieldEdit
                      label="Atend./mês"
                      source={monthlySrc}
                      value={s.expected_monthly_units ?? ""}
                      onChange={(v) => update(i, { expected_monthly_units: v })}
                      step={1}
                    />
                    <FieldEdit
                      label="Margem (%)"
                      source={marginSrc}
                      value={s.margin_percent ?? ""}
                      onChange={(v) => update(i, { margin_percent: v })}
                      step={1}
                    />
                  </div>
                  {s.notes && (
                    <p className="text-[10px] text-muted-foreground italic">{s.notes}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 text-xs">Cancelar</Button>
        )}
        <Button
          size="sm"
          disabled={summary.count === 0}
          onClick={() => onConfirm(items.filter((_, i) => selected.has(i)))}
          className="h-8 text-xs gap-1.5"
        >
          <FileCheck className="h-3.5 w-3.5" />
          Importar {summary.count > 0 ? `${summary.count} serviço${summary.count > 1 ? "s" : ""}` : "selecionados"}
        </Button>
      </div>
    </div>
  );
}

function FieldEdit({
  label,
  source,
  value,
  onChange,
  step = 0.01,
}: {
  label: string;
  source: ServiceSourceTag;
  value: number | "";
  onChange: (v: number | null) => void;
  step?: number;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-1">
        <Label className="text-[10px] text-muted-foreground">{label}</Label>
        <SourceBadge source={source} label={label} />
      </div>
      <Input
        type="number"
        min={0}
        step={step}
        value={value === "" ? "" : value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : parseFloat(v));
        }}
        className="h-7 text-[11px] px-2"
      />
    </div>
  );
}
