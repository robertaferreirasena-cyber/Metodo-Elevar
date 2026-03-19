import { Check, Sparkles, Camera, Users, Eye, Globe, UserCheck, ArrowRight, Zap, Star } from "lucide-react";
import { MissionContextBanner } from "@/components/learning/MissionContextBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

// Before/After images
import beforeAfter1 from "@/assets/photoboss/before-after-1.png";
import beforeAfter2 from "@/assets/photoboss/before-after-2.png";
import beforeAfter3 from "@/assets/photoboss/before-after-3.png";
import beforeAfter4 from "@/assets/photoboss/before-after-4.png";
import beforeAfter5 from "@/assets/photoboss/before-after-5.png";

const beforeAfterImages = [beforeAfter1, beforeAfter2, beforeAfter3, beforeAfter4, beforeAfter5];

const features = [
  {
    icon: Camera,
    title: "Ensaios Fotográficos com IA",
    description: "Transforme qualquer produto em ensaios com modelos profissionais usando inteligência artificial.",
  },
  {
    icon: Users,
    title: "Influenciadores Virtuais",
    description: "Crie embaixadores exclusivos da sua marca sem contratar influenciadores reais.",
  },
  {
    icon: Eye,
    title: "Provador Virtual",
    description: "Permita que seus clientes visualizem produtos antes de comprar, reduzindo devoluções.",
  },
  {
    icon: Globe,
    title: "Cenários Ilimitados",
    description: "Crie produções em qualquer ambiente do mundo, sem sair de casa.",
  },
  {
    icon: UserCheck,
    title: "Múltiplos Modelos",
    description: "Diversidade de modelos sem custo adicional para representar sua marca.",
  },
];

const stats = [
  { value: "94%", label: "mais conversão com fotos profissionais" },
  { value: "67%", label: "maior ticket médio por produto" },
  { value: "-45%", label: "redução em devoluções" },
  { value: "90%", label: "economia em produção fotográfica" },
];

export default function PhotoBoss() {
  const navigate = useNavigate();

  const handleAccessTool = () => {
    // Navigate to the PhotoBoss tool/chat
    navigate("/modo-privado");
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="bg-black border border-primary/50 px-8 py-4 rounded-lg">
              <span className="text-2xl font-bold tracking-wider">
                PHOT<span className="text-primary">✧</span>BOSS
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            CRIE FOTOS PROFISSIONAIS{" "}
            <span className="text-primary">COM IA</span>
            <br />
            PARA O SEU NEGÓCIO
          </h1>

          {/* Subheadline Badge */}
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm md:text-base">
            SEM FOTÓGRAFO • SEM MODELO • SEM ESTÚDIO
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Conheça a ferramenta que transforma qualquer produto em ensaios profissionais com modelos: moda, acessórios, decoração, artesanato e muito mais.
          </p>

          {/* CTA */}
          <Button
            size="lg"
            onClick={handleAccessTool}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto gap-2"
          >
            <Sparkles className="w-5 h-5" />
            ACESSAR A FERRAMENTA
            <ArrowRight className="w-5 h-5" />
          </Button>

          {/* Before/After Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {beforeAfterImages.slice(0, 4).map((img, index) => (
              <div key={index} className="relative rounded-xl overflow-hidden border border-primary/30 hover:border-primary/60 transition-all hover:scale-105">
                <img
                  src={img}
                  alt={`Transformação ${index + 1} - Antes e Depois`}
                  className="w-full h-auto object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-black/95 to-primary/10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground uppercase tracking-wider">O QUE O PHOTOBOSS FAZ POR VOCÊ</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              FUNCIONALIDADES <span className="text-primary">PRINCIPAIS</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.slice(0, 3).map((feature, index) => (
              <Card key={index} className="bg-black/50 border-primary/30 hover:border-primary/60 transition-all">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-white">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {features.slice(3).map((feature, index) => (
              <Card key={index} className="bg-black/50 border-primary/30 hover:border-primary/60 transition-all">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-white">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-5xl mx-auto space-y-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            O IMPACTO DE FOTOS PROFISSIONAIS NO SEU NEGÓCIO
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <p className="text-4xl md:text-5xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gradient-to-b from-black to-primary/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">
              COMO FUNCIONA
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Em poucos passos, você transforma seus produtos em imagens profissionais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">1</div>
              <h3 className="font-bold text-white">Envie a foto do produto</h3>
              <p className="text-muted-foreground text-sm">Faça upload da imagem do seu produto como está hoje.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">2</div>
              <h3 className="font-bold text-white">Escolha o estilo</h3>
              <p className="text-muted-foreground text-sm">Selecione modelo, cenário e pose para a composição ideal.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">3</div>
              <h3 className="font-bold text-white">Receba a foto profissional</h3>
              <p className="text-muted-foreground text-sm">A IA gera a imagem pronta para usar no seu e-commerce.</p>
            </div>
          </div>

          {/* Showcase image */}
          <div className="flex justify-center">
            <div className="max-w-lg">
              <img
                src={beforeAfter2}
                alt="Exemplo de resultado do PhotoBoss"
                className="w-full rounded-xl border border-primary/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Included Resources */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">O QUE ESTÁ INCLUSO</h2>
            <p className="text-muted-foreground">Tudo que você precisa para criar imagens incríveis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary/15 to-black border-primary/30">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-primary" />
                  <h3 className="font-bold text-white">Banco de Poses Premium</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    500+ poses organizadas por categoria
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Cenários para todas as estações
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/15 to-black border-primary/30">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  <h3 className="font-bold text-white">Agente de IA para Prompts</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Crie prompts perfeitos automaticamente
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Otimizado para qualquer nicho
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-black to-primary/5">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">PERGUNTAS FREQUENTES</h2>

          <div className="space-y-4">
            <Card className="bg-black/50 border-muted/30">
              <CardContent className="p-6">
                <h4 className="font-bold text-white mb-2">As fotos realmente parecem profissionais?</h4>
                <p className="text-muted-foreground text-sm">
                  Sim! A tecnologia de IA gera imagens de alta qualidade que rivalizam com produções tradicionais. Os resultados são impressionantes e prontos para uso imediato.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-muted/30">
              <CardContent className="p-6">
                <h4 className="font-bold text-white mb-2">Preciso ter experiência com IA?</h4>
                <p className="text-muted-foreground text-sm">
                  Não! O PhotoBoss foi desenvolvido para ser intuitivo. Qualquer pessoa pode usar, mesmo sem conhecimento técnico.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-muted/30">
              <CardContent className="p-6">
                <h4 className="font-bold text-white mb-2">Funciona para qualquer tipo de produto?</h4>
                <p className="text-muted-foreground text-sm">
                  Sim! Moda, acessórios, decoração, artesanato, cosméticos e muito mais. A IA se adapta ao seu nicho.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-t from-primary/20 to-black">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            PRONTO PARA TRANSFORMAR SUAS IMAGENS?
          </h2>
          <p className="text-muted-foreground">
            Acesse agora e comece a criar fotos profissionais para o seu negócio.
          </p>
          <Button
            size="lg"
            onClick={handleAccessTool}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto gap-2 w-full md:w-auto"
          >
            <Camera className="w-5 h-5" />
            ACESSAR O PHOTOBOSS
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Acesso Imediato
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              Incluso no seu plano
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
