import { Check, Star, Sparkles, ExternalLink, Camera, Users, Eye, Globe, UserCheck, ShieldCheck, Clock, Zap, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    description: "Transforme qualquer produto em ensaios com modelos",
  },
  {
    icon: Users,
    title: "Influenciadores Virtuais",
    description: "Crie embaixadores exclusivos da sua marca",
  },
  {
    icon: Eye,
    title: "Provador Virtual",
    description: "Clientes visualizam produtos antes de comprar",
  },
  {
    icon: Globe,
    title: "Cenários Ilimitados",
    description: "Produções em qualquer ambiente do mundo",
  },
  {
    icon: UserCheck,
    title: "Múltiplos Modelos",
    description: "Diversidade sem custo adicional",
  },
];

const stats = [
  { value: "94%", label: "mais conversão com fotos profissionais" },
  { value: "67%", label: "maior ticket médio por produto" },
  { value: "-45%", label: "redução em devoluções" },
  { value: "90%", label: "economia em produção fotográfica" },
];

const painPoints = [
  "Contratar modelo + fotógrafo + estúdio custa R$2.000 a R$5.000 por sessão",
  "Você precisa investir em looks e acessórios para cada campanha",
  "Cada coleção nova exige nova produção fotográfica",
  "Clientes devolvem porque 'não era o que esperavam'",
  "Concorrer com grandes marcas parece impossível com fotos amadoras",
];

const bonuses = [
  {
    number: "1",
    title: "GUIA DE CENÁRIOS VIP",
    items: ["100 prompts para cenários exclusivos", "Ambientes profissionais para diferentes nichos"],
    value: "R$97",
  },
  {
    number: "2",
    title: "CALENDÁRIO DE CONTEÚDO VISUAL",
    items: ["Planejamento completo para 90 dias", "Estratégia de variação de imagens por objetivo"],
    value: "R$77",
  },
];

export default function PhotoBoss() {
  const handleAccessPhotoBoss = () => {
    window.open("https://pay.kiwify.com.br/AXHz0RI", "_blank");
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-12 px-4 text-center">
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
            A FERRAMENTA QUE ESTÁ{" "}
            <span className="text-primary">REVOLUCIONANDO</span>
            <br />
            A FORMA DE VENDER ONLINE
          </h1>

          {/* Subheadline Badge */}
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm md:text-base">
            SEM FOTÓGRAFO • SEM MODELO • SEM ESTÚDIO
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Crie ensaios profissionais com modelos para qualquer produto: moda, acessórios, decoração, artesanato e muito mais
          </p>

          {/* Before/After Image Carousel */}
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

      {/* Problem Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-black to-black/95">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            O SEGREDO QUE SEPARA LOJAS QUE VENDEM DAS QUE FRACASSAM...
          </h2>
          
          <p className="text-muted-foreground text-center text-lg max-w-3xl mx-auto">
            Você já se perguntou por que algumas lojas online vendem muito enquanto outras, com produtos similares, mal conseguem fazer vendas? Estudos mostram que produtos com fotos profissionais têm <span className="text-primary font-bold">94% mais conversão</span> e os clientes pagam <span className="text-primary font-bold">até 67% a mais pelos mesmos produtos</span>.
          </p>

          <div className="text-center py-4">
            <p className="text-xl font-bold text-primary">
              A DIFERENÇA NÃO ESTÁ NO PRODUTO... ESTÁ EM COMO VOCÊ MOSTRA ELE.
            </p>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-center mt-12">
            MAS AQUI ESTÁ A REALIDADE CRUEL:
          </h3>

          <div className="space-y-4 max-w-2xl mx-auto">
            {painPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-3 text-muted-foreground">
                <span className="text-primary mt-1">✕</span>
                <span>{point}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-lg font-semibold text-primary/80 mt-8">
            E VOCÊ FICA PRESO NUM CICLO ONDE IMAGENS PROFISSIONAIS SÃO PRIVILÉGIO DE GRANDES MARCAS.
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-black/95 to-primary/10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground uppercase tracking-wider">A SOLUÇÃO COMPLETA PARA QUALQUER E-COMMERCE</p>
            <h2 className="text-4xl md:text-5xl font-bold">
              PHOT<span className="text-primary">✧</span>BOSS
            </h2>
            <h3 className="text-xl md:text-2xl text-muted-foreground">
              TRANSFORME QUALQUER PRODUTO EM FOTOS PROFISSIONAIS COM MODELOS
            </h3>
          </div>

          <p className="text-center text-primary font-semibold text-lg">
            3 FUNCIONALIDADES QUE VÃO EXPLODIR SUAS VENDAS:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.slice(0, 3).map((feature, index) => (
              <Card key={index} className="bg-black/50 border-primary/30 hover:border-primary/60 transition-all">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg text-white">{feature.title}</h4>
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
                  <h4 className="font-bold text-lg text-white">{feature.title}</h4>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xl font-bold text-primary mt-8">
            SUAS VENDAS VÃO EXPLODIR COM IMAGENS PROFISSIONAIS
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-5xl mx-auto space-y-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            COMO ISSO TRANSFORMA SUA LOJA:
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <p className="text-4xl md:text-5xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <Card className="bg-primary/10 border-primary/30 max-w-3xl mx-auto">
            <CardContent className="p-6">
              <p className="text-muted-foreground italic text-center">
                "Gastava R$3.000 por mês em produção fotográfica para minha loja. Com o PhotoBoss, criei mais de 200 fotos profissionais por uma fração do custo. Minhas vendas triplicaram e as devoluções caíram 40% graças ao provador virtual."
              </p>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">RESULTADOS REAIS:</h3>
            <p className="text-muted-foreground">
              Isso não é apenas mais um produto de IA. É a sua vantagem competitiva secreta.
            </p>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-black to-primary/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">
              O QUE VOCÊ RECEBE COM O PHOTOBOSS:
            </h2>
            <p className="text-muted-foreground">
              Acesso vitalício às 3 funcionalidades que vão transformar sua loja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-black/50 border-primary/30 text-center p-6">
              <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="font-bold text-white">Ensaios Fotográficos com IA</h4>
            </Card>
            <Card className="bg-black/50 border-primary/30 text-center p-6">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="font-bold text-white">Influenciadores Virtuais</h4>
            </Card>
            <Card className="bg-black/50 border-primary/30 text-center p-6">
              <Eye className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="font-bold text-white">Provador Virtual</h4>
            </Card>
          </div>

          {/* Bonus Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/40">
              <CardContent className="p-6 space-y-4">
                <Badge className="bg-primary text-primary-foreground">BÔNUS 1</Badge>
                <h4 className="font-bold text-lg text-white">Banco de Poses Premium</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    500+ poses organizadas por categoria de produto
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Cenários para todas as estações
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/40">
              <CardContent className="p-6 space-y-4">
                <Badge className="bg-primary text-primary-foreground">BÔNUS 2</Badge>
                <h4 className="font-bold text-lg text-white">Agente de IA para Prompts</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Ferramenta para criar prompts perfeitos
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Otimizado para qualquer nicho de e-commerce
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Different Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            POR QUE O PHOTOBOSS É DIFERENTE
          </h2>
          
          <p className="text-muted-foreground text-center text-lg max-w-3xl mx-auto">
            Além de criar fotos profissionais para qualquer tipo de produto, o PhotoBoss permite que seus clientes visualizem como os produtos ficam em uso real — aumentando a conversão e reduzindo devoluções.
          </p>

          <div className="flex justify-center">
            <div className="max-w-lg">
              <img 
                src={beforeAfter2} 
                alt="Provador Virtual - Cliente experimenta produtos virtualmente"
                className="w-full rounded-xl border border-primary/30"
              />
            </div>
          </div>

          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">O QUE TORNA O PHOTOBOSS ÚNICO:</h3>
            <p className="text-muted-foreground">
              É como ter fotógrafo, modelo, estúdio e provador virtual disponíveis 24/7 — por uma fração do custo de uma única sessão.
            </p>
          </div>
        </div>
      </section>

      {/* Price Comparison Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-black to-primary/10">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            VAMOS FAZER AS CONTAS:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Way */}
            <Card className="bg-black/50 border-muted/30">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-bold text-lg text-center text-muted-foreground">O JEITO ANTIGO</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Ensaio Fotográfico Profissional</span>
                    <span className="text-muted-foreground">R$1.000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Looks Específicos</span>
                    <span className="text-muted-foreground">R$$$</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Viagem/Tempo</span>
                    <span className="text-muted-foreground">R$200</span>
                  </div>
                </div>
                <div className="border-t border-muted/30 pt-4">
                  <p className="text-sm text-muted-foreground">Total para UMA sessão:</p>
                  <p className="text-2xl font-bold text-muted-foreground line-through">R$1.200+</p>
                </div>
              </CardContent>
            </Card>

            {/* New Way */}
            <Card className="bg-primary/10 border-primary/50 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Recomendado
              </Badge>
              <CardContent className="p-6 space-y-4">
                <h4 className="font-bold text-lg text-center text-primary">COM PHOTOBOSS</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Acesso vitalício ao app exclusivo</span>
                    <span className="text-primary">R$57</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Acesso à ferramenta secreta</span>
                    <span className="text-primary">Custo mínimo</span>
                  </div>
                </div>
                <div className="border-t border-primary/30 pt-4">
                  <p className="text-sm text-muted-foreground">Total para SESSÕES ILIMITADAS:</p>
                  <p className="text-2xl font-bold text-primary">Menos que um almoço</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg">Sua economia no primeiro ensaio: <span className="text-primary font-bold">Mais de R$1.000</span></p>
            <p className="text-muted-foreground">E o mais importante: você terá fotos ilimitadas, em cenários ilimitados, com looks ilimitados.</p>
          </div>
        </div>
      </section>

      {/* Extra Bonuses */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">Tempo Limitado</Badge>
            <h2 className="text-2xl md:text-3xl font-bold">BÔNUS EXCLUSIVOS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bonuses.map((bonus, index) => (
              <Card key={index} className="bg-gradient-to-br from-primary/15 to-black border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <Badge variant="outline" className="border-primary text-primary">BÔNUS {bonus.number}</Badge>
                  <h4 className="font-bold text-lg text-white">{bonus.title}</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {bonus.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <span className="text-muted-foreground line-through text-sm">VALOR: {bonus.value}</span>
                    <span className="text-primary font-bold ml-2">HOJE: GRÁTIS</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-black to-primary/5">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">GARANTIA DE 7 DIAS</h2>
          <Badge className="bg-primary text-primary-foreground">100% INCONDICIONAL</Badge>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Se por qualquer motivo você não conseguir criar fotos profissionais impressionantes usando o PhotoBoss, ou se não estiver 100% satisfeito com os resultados, basta enviar um e-mail solicitando reembolso.
          </p>
          <p className="text-white font-semibold">
            Devolvemos cada centavo. Sem perguntas. Sem burocracia.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-black">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <p className="text-muted-foreground">
            O PhotoBoss deveria custar pelo menos <span className="font-bold">R$597</span>, considerando:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• A economia de R$1.000+ por ensaio</li>
            <li>• Acesso vitalício ao app exclusivo</li>
            <li>• O método exclusivo e bônus</li>
          </ul>
          <p className="text-primary font-semibold">Mas para celebrar o lançamento...</p>

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Investimento Único:</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-3xl text-muted-foreground line-through">R$597</span>
              <span className="text-5xl font-bold text-primary">R$57</span>
            </div>
          </div>

          <Button 
            size="lg" 
            onClick={handleAccessPhotoBoss}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto gap-2 animate-pulse"
          >
            <Sparkles className="w-5 h-5" />
            QUERO MINHA IMAGEM PROFISSIONAL AGORA
            <ArrowRight className="w-5 h-5" />
          </Button>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Compra Segura
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Acesso Imediato
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              Garantia de Satisfação
            </div>
          </div>

          {/* Urgency */}
          <Card className="bg-primary/10 border-primary/30 mt-8">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-bold text-lg">ATENÇÃO: OFERTA COM VAGAS LIMITADAS</h4>
              <p className="text-sm text-muted-foreground">
                Para garantir suporte de qualidade... estamos limitando o acesso a apenas <span className="font-bold text-white">200 pessoas</span>. Já vendemos <span className="font-bold text-primary">103 acessos</span> nas primeiras 24 horas. Restam apenas <span className="font-bold text-white">97 vagas</span> e provavelmente esgotarão nas próximas horas.
              </p>
              
              {/* Countdown Timer (static for display) */}
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="bg-black rounded-lg px-4 py-2 border border-primary/30">
                    <span className="text-2xl font-bold text-primary">02</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Horas</span>
                </div>
                <div className="text-center">
                  <div className="bg-black rounded-lg px-4 py-2 border border-primary/30">
                    <span className="text-2xl font-bold text-primary">47</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Min</span>
                </div>
                <div className="text-center">
                  <div className="bg-black rounded-lg px-4 py-2 border border-primary/30">
                    <span className="text-2xl font-bold text-primary">30</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Seg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">PERGUNTAS FREQUENTES</h2>
          
          <div className="space-y-4">
            <Card className="bg-black/50 border-muted/30">
              <CardContent className="p-6">
                <h4 className="font-bold text-white mb-2">As fotos realmente parecem profissionais?</h4>
                <p className="text-muted-foreground text-sm">
                  Sim! A tecnologia de IA utilizada gera imagens de alta qualidade que rivalizações com produções tradicionais. Os resultados são impressionantes e prontos para uso imediato em seu e-commerce.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-muted/30">
              <CardContent className="p-6">
                <h4 className="font-bold text-white mb-2">Preciso ter experiência com IA?</h4>
                <p className="text-muted-foreground text-sm">
                  Não! O PhotoBoss foi desenvolvido para ser intuitivo. Qualquer pessoa pode usar, mesmo sem conhecimento técnico. Além disso, você recebe bônus com prompts prontos para começar imediatamente.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-muted/30">
              <CardContent className="p-6">
                <h4 className="font-bold text-white mb-2">Quanto custa para manter depois da compra?</h4>
                <p className="text-muted-foreground text-sm">
                  O acesso ao PhotoBoss é vitalício. Você paga apenas uma vez e tem acesso para sempre. Os únicos custos adicionais são os créditos das ferramentas de IA que você usar, que são mínimos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 px-4 bg-gradient-to-t from-primary/20 to-black">
        <div className="max-w-xl mx-auto text-center">
          <Button 
            size="lg" 
            onClick={handleAccessPhotoBoss}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto gap-2 w-full md:w-auto"
          >
            <Camera className="w-5 h-5" />
            GARANTIR MEU ACESSO AGORA
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
