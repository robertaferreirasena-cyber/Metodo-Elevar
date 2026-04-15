import { Instagram, Palette, LayoutGrid, Bot, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const tools = [
  {
    title: "Gerador de Carrossel",
    description: "Crie carrosséis virais com templates profissionais e IA",
    icon: Palette,
    color: "bg-pink-500/10",
    iconColor: "text-pink-500",
    href: "/aprendizado?tab=carousel",
    badge: "POPULAR",
  },
  {
    title: "iNSTA PRO",
    description: "Grade estratégica 3x3, bio e perfil otimizado com IA",
    icon: LayoutGrid,
    color: "bg-violet-500/10",
    iconColor: "text-violet-500",
    href: "/aprendizado?tab=instapro",
    badge: null,
  },
  {
    title: "Automação Instagram",
    description: "Fluxos ManyChat de alta conversão para DMs automáticas",
    icon: Bot,
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
    href: "/automacao-instagram",
    badge: null,
  },
];

export default function InstagramHub() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/10 to-violet-500/10">
          <Instagram className="h-7 w-7 text-pink-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Central Instagram</h1>
          <p className="text-sm text-muted-foreground">Todas as ferramentas para dominar o Instagram</p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Link key={tool.title} to={tool.href} className="group">
            <Card className="h-full hover:shadow-md transition-all hover:border-primary/30">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className={`p-3 rounded-xl ${tool.color} w-fit`}>
                  <tool.icon className={`h-6 w-6 ${tool.iconColor}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{tool.title}</h3>
                    {tool.badge && (
                      <Badge className="bg-primary text-primary-foreground text-[7px] px-1 py-0">
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-auto gap-2 text-xs">
                  Acessar <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
