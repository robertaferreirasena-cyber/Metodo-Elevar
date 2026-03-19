import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";

export interface DetectedProduct {
  name: string;
  detected_price: number | null;
  suggested_price: number | null;
  estimated_cost: number | null;
  margin_percent: number | null;
  category: string;
}

export interface CatalogAnalysis {
  products: DetectedProduct[];
  insights: string[];
  pricing_recommendations: string[];
}

interface CatalogAnalysisResultProps {
  analysis: CatalogAnalysis;
  onImportProduct?: (product: DetectedProduct) => void;
}

const fmt = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CatalogAnalysisResult({ analysis, onImportProduct }: CatalogAnalysisResultProps) {
  return (
    <div className="space-y-4">
      {/* Products detected */}
      {analysis.products.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos Detectados ({analysis.products.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.products.map((product, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{product.name}</div>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    {product.detected_price != null && (
                      <span>Preço: {fmt(product.detected_price)}</span>
                    )}
                    {product.margin_percent != null && (
                      <Badge
                        variant={product.margin_percent >= 20 ? "default" : "destructive"}
                        className="text-[10px] px-1 py-0"
                      >
                        {product.margin_percent.toFixed(0)}% margem
                      </Badge>
                    )}
                  </div>
                </div>
                {product.suggested_price != null && (
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground">Sugerido</div>
                    <div className="text-xs font-semibold text-primary">
                      {fmt(product.suggested_price)}
                    </div>
                  </div>
                )}
                {onImportProduct && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => onImportProduct(product)}
                    title="Importar para calculadora"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Insights */}
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

      {/* Recommendations */}
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
