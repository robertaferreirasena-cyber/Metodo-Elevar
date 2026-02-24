import { MessageCircle, Search, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "Estratégias 1:1",
    description: "Gere estratégias de venda personalizadas para conversas individuais.",
    href: "/privado/estrategias",
    ctaLabel: "Criar Estratégia",
    primary: true,
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: "Análise de Conversas",
    description: "Cole uma conversa e receba feedback profissional de vendas.",
    href: "/privado/analise",
    ctaLabel: "Analisar",
    primary: false,
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Scripts Prontos",
    description: "Biblioteca de mensagens prontas para cada fase da venda.",
    href: "/privado/scripts",
    ctaLabel: "Ver Scripts",
    primary: false,
  },
];

export default function PrivateMode() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            💬 Modo Privado
          </h1>
          <p className="text-muted-foreground">
            Ferramentas para conversas 1:1 com clientes
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="group hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription className="text-sm">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant={feature.primary ? "default" : "outline"}
                className={feature.primary ? "w-full gradient-primary glow-pink" : "w-full"}
              >
                <Link to={feature.href}>{feature.ctaLabel}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
