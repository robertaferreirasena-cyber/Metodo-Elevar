import { Users, FileText, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: <Users className="h-6 w-6" />,
    title: "Conteúdo de Grupo",
    description: "Gere posts curtos e envolventes que geram interação no grupo.",
    href: "/grupo/conteudo",
    ctaLabel: "Criar Conteúdo",
    primary: true,
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Sequências",
    description: "Planeje uma sequência de posts estratégicos para aquecer o grupo.",
    href: "/grupo/sequencias",
    ctaLabel: "Criar Sequência",
    primary: false,
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Templates",
    description: "Biblioteca de templates de posts para diferentes objetivos.",
    href: "/grupo/templates",
    ctaLabel: "Ver Templates",
    primary: false,
  },
];

export default function GroupMode() {
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
            👥 Modo Grupo
          </h1>
          <p className="text-muted-foreground">
            Ferramentas para engajar sua comunidade
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="group hover:border-accent/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground">
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
                className={feature.primary ? "w-full" : "w-full"}
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
