import { useState, useEffect } from "react";
import { Brain, Target, AlertTriangle, ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";
import { cn } from "@/lib/utils";

interface PersonaSummaryProps {
  /** Show as a simple banner without expandable content */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export function PersonaSummary({ compact = false, className = "" }: PersonaSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { profile, hasRaioX } = usePersonaProfile();
  const raioX = profile?.generated_raio_x;

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Compact version - just a badge indicator
  if (compact && hasRaioX) {
    return (
      <Card className={cn(
        "border-primary/20 bg-primary/5 transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}>
        <CardContent className="py-3 flex items-center gap-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary animate-pulse">
            ✨ Raio-X Ativo
          </Badge>
          <p className="text-sm text-muted-foreground">
            A IA usará as dores e desejos da sua persona para gerar conteúdo mais assertivo
          </p>
        </CardContent>
      </Card>
    );
  }

  // Full persona summary with expandable content
  if (hasRaioX && raioX) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn(
        "transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}>
        <Card className="border-primary/20 bg-primary/5 overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardContent className="py-3 cursor-pointer hover:bg-primary/10 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Contexto da sua Persona</span>
                  <Badge variant="secondary" className="text-xs">{profile?.niche}</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{isOpen ? "Ocultar" : "Expandir"}</span>
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} />
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <CardContent className="pt-0 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Pains */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Dores
                  </div>
                  <ul className="space-y-1">
                    {raioX.problemas_externos?.slice(0, 2).map((item: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground line-clamp-1 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>• {item}</li>
                    ))}
                  </ul>
                </div>

                {/* Desires */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Target className="h-3 w-3" />
                    Desejos
                  </div>
                  <ul className="space-y-1">
                    {raioX.desejos?.slice(0, 2).map((item: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground line-clamp-1 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended tone */}
              {raioX.estrategia_recomendada?.tom_comunicacao && (
                <div className="pt-2 border-t border-primary/10 animate-fade-in" style={{ animationDelay: "200ms" }}>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Tom recomendado:</span> {raioX.estrategia_recomendada.tom_comunicacao}
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Empty state - CTA to create Raio-X
  return (
    <Card className={cn(
      "border-dashed border-muted-foreground/20 transition-all duration-500 ease-out hover:border-primary/30",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      className
    )}>
      <CardContent className="py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Crie um Raio-X para estratégias personalizadas</span>
        </div>
        <Button variant="ghost" size="sm" asChild className="group">
          <Link to="/persona" className="gap-1 text-xs">
            Criar Raio-X
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
