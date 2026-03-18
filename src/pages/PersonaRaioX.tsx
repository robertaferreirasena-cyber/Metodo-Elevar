import { useState } from "react";
import { 
  User, 
  Package, 
  Target, 
  AlertTriangle, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  RefreshCw,
  Edit,
  Brain,
  Heart,
  Lightbulb,
  TrendingUp,
  Shield,
  DollarSign,
  Star,
  Zap,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionIndicator } from "@/components/SessionIndicator";
import { usePersonaProfile, type PersonaFormData, type RaioXData } from "@/hooks/usePersonaProfile";
import { toast } from "sonner";
import FinishMissionButton from "@/components/learning/FinishMissionButton";
const NICHES = [
  "Moda & Acessórios",
  "Beleza & Estética",
  "Saúde & Bem-estar",
  "Educação & Cursos",
  "Gastronomia",
  "Tecnologia",
  "Finanças",
  "Imóveis",
  "Serviços Profissionais",
  "Outro",
];

const TIME_OPTIONS = [
  "Menos de 6 meses",
  "6 meses a 1 ano",
  "1 a 3 anos",
  "Mais de 3 anos",
];

const PRICE_RANGES = [
  "Até R$ 100",
  "R$ 100 - R$ 500",
  "R$ 500 - R$ 2.000",
  "R$ 2.000 - R$ 10.000",
  "Acima de R$ 10.000",
];

const SALES_CHANNELS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "site", label: "Site próprio" },
  { id: "marketplace", label: "Marketplaces" },
  { id: "presencial", label: "Presencial" },
];

const GENDER_OPTIONS = [
  "Predominantemente feminino",
  "Predominantemente masculino",
  "Misto",
];

const AGE_RANGES = [
  "18-25 anos",
  "25-35 anos",
  "35-45 anos",
  "45-55 anos",
  "55+ anos",
];

const STEPS = [
  { id: 1, title: "Sobre Você", icon: User, description: "Informações do seu negócio" },
  { id: 2, title: "Produto", icon: Package, description: "O que você vende" },
  { id: 3, title: "Público", icon: Target, description: "Quem é seu cliente" },
  { id: 4, title: "Desafios", icon: AlertTriangle, description: "Suas dificuldades" },
];

export default function PersonaRaioX() {
  const {
    profile,
    formData,
    currentStep,
    setCurrentStep,
    loading,
    saving,
    generating,
    hasProfile,
    hasRaioX,
    hasRestoredSession,
    updateFormData,
    saveProfile,
    generateRaioX,
    clearSession,
  } = usePersonaProfile();

  const [isEditing, setIsEditing] = useState(false);

  const handleChannelToggle = (channelId: string) => {
    const current = formData.sales_channels || [];
    const updated = current.includes(channelId)
      ? current.filter((c) => c !== channelId)
      : [...current, channelId];
    updateFormData({ sales_channels: updated });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.business_name && !!formData.niche;
      case 2:
        return !!formData.product_description;
      case 3:
        return !!formData.main_pain;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveAndGenerate = async () => {
    const saved = await saveProfile(formData);
    if (saved) {
      const generated = await generateRaioX();
      if (generated) {
        setIsEditing(false);
      }
    }
  };

  const handleRegenerate = async () => {
    await generateRaioX();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show RaioX view if profile exists with generated raioX and not editing
  if (hasProfile && hasRaioX && !isEditing) {
    return <RaioXView profile={profile!} onEdit={() => setIsEditing(true)} onRegenerate={handleRegenerate} isRegenerating={generating} />;
  }

  // Show wizard
  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Raio-X de Persona
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {hasProfile 
            ? "Atualize as informações do seu negócio para um raio-x mais preciso"
            : "Preencha as informações do seu negócio para gerar um diagnóstico completo"}
        </p>
      </div>

      {/* Session Restored Indicator */}
      <SessionIndicator
        show={hasRestoredSession && !hasProfile && (!!formData.business_name || currentStep > 1)}
        onClear={clearSession}
        message="Formulário anterior restaurado"
      />

      {/* Progress Steps */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-1 sm:gap-2 ${
                currentStep === step.id
                  ? "text-primary"
                  : currentStep > step.id
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
            </div>
          ))}
        </div>
        <Progress value={(currentStep / 4) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const StepIcon = STEPS[currentStep - 1].icon; return <StepIcon className="h-5 w-5" />; })()}
            Etapa {currentStep} de 4 - {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: About You */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="business_name">Nome do Negócio/Marca *</Label>
                <Input
                  id="business_name"
                  placeholder="Ex: Loja da Maria"
                  value={formData.business_name}
                  onChange={(e) => updateFormData({ business_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="niche">Nicho de Atuação *</Label>
                  <Select value={formData.niche} onValueChange={(v) => updateFormData({ niche: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {NICHES.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub_niche">Sub-nicho (opcional)</Label>
                  <Input
                    id="sub_niche"
                    placeholder="Ex: Moda Plus Size"
                    value={formData.sub_niche}
                    onChange={(e) => updateFormData({ sub_niche: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tempo de Mercado</Label>
                <Select value={formData.time_in_market} onValueChange={(v) => updateFormData({ time_in_market: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Canais de Venda Atuais</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SALES_CHANNELS.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={channel.id}
                        checked={formData.sales_channels?.includes(channel.id)}
                        onCheckedChange={() => handleChannelToggle(channel.id)}
                      />
                      <label htmlFor={channel.id} className="text-sm cursor-pointer">
                        {channel.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Product */}
          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="product_description">O que você vende? *</Label>
                <Textarea
                  id="product_description"
                  placeholder="Descreva seu produto ou serviço principal..."
                  value={formData.product_description}
                  onChange={(e) => updateFormData({ product_description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Faixa de Preço</Label>
                <Select value={formData.price_range} onValueChange={(v) => updateFormData({ price_range: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_differentiator">Seu Diferencial Principal</Label>
                <Textarea
                  id="main_differentiator"
                  placeholder="O que te diferencia dos concorrentes?"
                  value={formData.main_differentiator}
                  onChange={(e) => updateFormData({ main_differentiator: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transformation">Transformação que Entrega</Label>
                <Textarea
                  id="transformation"
                  placeholder="Como a vida do cliente muda após usar seu produto/serviço?"
                  value={formData.transformation}
                  onChange={(e) => updateFormData({ transformation: e.target.value })}
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Step 3: Target Audience */}
          {currentStep === 3 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gênero do Público</Label>
                  <Select value={formData.target_gender} onValueChange={(v) => updateFormData({ target_gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Faixa Etária</Label>
                  <Select value={formData.target_age_range} onValueChange={(v) => updateFormData({ target_age_range: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_RANGES.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_profession">Profissão/Ocupação Típica</Label>
                <Input
                  id="target_profession"
                  placeholder="Ex: Empreendedoras, Mães, Profissionais liberais..."
                  value={formData.target_profession}
                  onChange={(e) => updateFormData({ target_profession: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_location">Onde seu Cliente Está</Label>
                <Input
                  id="target_location"
                  placeholder="Ex: Instagram, grupos de Facebook, comunidades..."
                  value={formData.target_location}
                  onChange={(e) => updateFormData({ target_location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_pain">Qual a MAIOR dor que você resolve? *</Label>
                <Textarea
                  id="main_pain"
                  placeholder="Descreva o principal problema que seu cliente enfrenta..."
                  value={formData.main_pain}
                  onChange={(e) => updateFormData({ main_pain: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_attempts">O que seu cliente já tentou antes?</Label>
                <Textarea
                  id="previous_attempts"
                  placeholder="Soluções anteriores que não funcionaram..."
                  value={formData.previous_attempts}
                  onChange={(e) => updateFormData({ previous_attempts: e.target.value })}
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Step 4: Challenges */}
          {currentStep === 4 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sales_challenges">Maiores Dificuldades na Venda</Label>
                <Textarea
                  id="sales_challenges"
                  placeholder="O que mais te atrapalha na hora de vender?"
                  value={formData.sales_challenges}
                  onChange={(e) => updateFormData({ sales_challenges: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="common_objections">Objeções Mais Frequentes</Label>
                <Textarea
                  id="common_objections"
                  placeholder="O que os clientes costumam dizer para não comprar?"
                  value={formData.common_objections}
                  onChange={(e) => updateFormData({ common_objections: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvement_goals">O que Você Gostaria de Melhorar?</Label>
                <Textarea
                  id="improvement_goals"
                  placeholder="Qual resultado você quer alcançar?"
                  value={formData.improvement_goals}
                  onChange={(e) => updateFormData({ improvement_goals: e.target.value })}
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 safe-area-bottom">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="touch-target"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={handleNext}
            disabled={!validateStep(currentStep)}
            className="touch-target"
          >
            <span className="hidden sm:inline">Próximo</span>
            <span className="sm:hidden">Avançar</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSaveAndGenerate}
            disabled={saving || generating}
            className="gap-2"
          >
            {saving || generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {saving ? "Salvando..." : "Gerando..."}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Raio-X
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// RaioX View Component
interface RaioXViewProps {
  profile: NonNullable<ReturnType<typeof usePersonaProfile>["profile"]>;
  onEdit: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

function generatePDFContent(profile: RaioXViewProps["profile"], raioX: RaioXData): string {
  const date = new Date(profile.updated_at).toLocaleDateString("pt-BR");
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Raio-X de Persona - ${profile.business_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ec4899; padding-bottom: 20px; }
    .header h1 { color: #ec4899; font-size: 28px; margin-bottom: 5px; }
    .header .meta { color: #666; font-size: 14px; }
    .summary { background: #fdf2f8; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ec4899; }
    .summary h2 { color: #ec4899; font-size: 16px; margin-bottom: 10px; }
    .section { margin-bottom: 25px; }
    .section h2 { color: #ec4899; font-size: 18px; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #fce7f3; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { background: #f9fafb; padding: 15px; border-radius: 8px; }
    .card h3 { font-size: 14px; color: #374151; margin-bottom: 10px; }
    .card ul { list-style: none; }
    .card li { padding: 5px 0; font-size: 13px; color: #4b5563; }
    .card li::before { content: "•"; color: #ec4899; margin-right: 8px; }
    .strategy { background: #fdf2f8; padding: 20px; border-radius: 8px; }
    .strategy h3 { color: #be185d; margin-bottom: 10px; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .badge { background: #ec4899; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Raio-X de Persona</h1>
    <p class="meta">${profile.business_name} • ${profile.niche} • Atualizado em ${date}</p>
  </div>

  <div class="summary">
    <h2>💡 Resumo Executivo</h2>
    <p>${raioX.resumo_executivo}</p>
  </div>

  <div class="section">
    <h2>😰 Dores e Problemas</h2>
    <div class="grid">
      <div class="card">
        <h3>Problemas Externos</h3>
        <ul>${raioX.problemas_externos.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <h3>Problemas Internos</h3>
        <ul>${raioX.problemas_internos.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <h3>Fontes de Dor</h3>
        <ul>${raioX.fontes_de_dor.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <h3>Medos</h3>
        <ul>${raioX.medos.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>✨ Desejos e Sonhos</h2>
    <div class="grid">
      <div class="card">
        <h3>Desejos</h3>
        <ul>${raioX.desejos.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <h3>Sonhos</h3>
        <ul>${raioX.sonhos.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>🛒 Padrões de Compra</h2>
    <div class="card">
      <p><strong>Gatilhos de Decisão:</strong> ${raioX.padroes_de_compra.gatilhos_decisao}</p>
      <p><strong>Objeções Previsíveis:</strong> ${raioX.padroes_de_compra.objecoes_previsiveis}</p>
      <p><strong>Ciclo de Decisão:</strong> ${raioX.padroes_de_compra.ciclo_decisao}</p>
      <p><strong>Influenciadores:</strong> ${raioX.padroes_de_compra.influenciadores}</p>
    </div>
  </div>

  <div class="section">
    <h2>🧠 Neurocomportamentos</h2>
    <div class="card">
      <p><strong>Processamento de Informação:</strong> ${raioX.neurocomportamentos.processamento_informacao}</p>
      <p><strong>Gatilhos de Confiança:</strong> ${raioX.neurocomportamentos.gatilhos_confianca}</p>
      <p><strong>Gatilhos de Resistência:</strong> ${raioX.neurocomportamentos.gatilhos_resistencia}</p>
      <p><strong>Canal Ideal:</strong> ${raioX.neurocomportamentos.canal_comunicacao_ideal}</p>
    </div>
  </div>

  <div class="section">
    <h2>⚡ Estratégia Recomendada</h2>
    <div class="strategy">
      <h3>Tom de Comunicação</h3>
      <p>${raioX.estrategia_recomendada.tom_comunicacao}</p>
      
      <h3 style="margin-top: 15px;">Gatilhos Mentais Prioritários</h3>
      <div class="badges">
        ${raioX.estrategia_recomendada.gatilhos_mentais_prioritarios.map(g => `<span class="badge">${g}</span>`).join("")}
      </div>
      
      <h3 style="margin-top: 15px;">Abordagem de Venda</h3>
      <p>${raioX.estrategia_recomendada.abordagem_venda}</p>
      
      <h3 style="margin-top: 15px;">Argumentos Chave</h3>
      <ul style="margin-top: 5px;">
        ${raioX.estrategia_recomendada.argumentos_chave.map(a => `<li style="padding: 3px 0;">${a}</li>`).join("")}
      </ul>
    </div>
  </div>

  <div class="footer">
    <p>Gerado pela IA Estrategista de Vendas • ${new Date().toLocaleDateString("pt-BR")}</p>
  </div>
</body>
</html>`;
}

function handleExportPDF(profile: RaioXViewProps["profile"], raioX: RaioXData) {
  const htmlContent = generatePDFContent(profile, raioX);
  const printWindow = window.open("", "_blank");
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success("PDF pronto para impressão/download!");
  } else {
    toast.error("Não foi possível abrir a janela de impressão. Verifique se pop-ups estão habilitados.");
  }
}

function RaioXView({ profile, onEdit, onRegenerate, isRegenerating }: RaioXViewProps) {
  const raioX = profile.generated_raio_x!;

  const sections = [
    { id: "dores", label: "Dores", icon: Heart },
    { id: "desejos", label: "Desejos", icon: Star },
    { id: "medos", label: "Medos", icon: Shield },
    { id: "estrategia", label: "Estratégia", icon: Zap },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Raio-X de Persona
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile.business_name} • {profile.niche}
          </p>
          <p className="text-xs text-muted-foreground">
            Atualizado em {new Date(profile.updated_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportPDF(profile, raioX)}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <FinishMissionButton />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Regenerar
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Resumo Executivo</h3>
              <p className="text-muted-foreground">{raioX.resumo_executivo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Tabs defaultValue="dores" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} className="gap-2">
                <section.icon className="h-4 w-4" />
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <TabsContent value="dores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RaioXCard
              title="Problemas Externos"
              items={raioX.problemas_externos}
              color="destructive"
            />
            <RaioXCard
              title="Problemas Internos"
              items={raioX.problemas_internos}
              color="destructive"
            />
            <RaioXCard
              title="Problemas Filosóficos"
              items={raioX.problemas_filosoficos}
              color="secondary"
            />
            <RaioXCard
              title="Fontes de Dor"
              items={raioX.fontes_de_dor}
              color="destructive"
            />
            <RaioXCard
              title="Problemas Financeiros"
              items={raioX.problemas_financeiros}
              icon={DollarSign}
              color="secondary"
            />
          </div>
        </TabsContent>

        <TabsContent value="desejos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RaioXCard
              title="Desejos"
              items={raioX.desejos}
              color="default"
            />
            <RaioXCard
              title="Sonhos"
              items={raioX.sonhos}
              icon={Star}
              color="default"
            />
            <RaioXCard
              title="Oportunidades"
              items={raioX.oportunidades}
              icon={TrendingUp}
              color="default"
            />
          </div>
        </TabsContent>

        <TabsContent value="medos" className="space-y-4">
          <RaioXCard
            title="Medos"
            items={raioX.medos}
            icon={Shield}
            color="destructive"
          />
        </TabsContent>

        <TabsContent value="estrategia" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purchase Patterns */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Padrões de Compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Gatilhos de Decisão:</span>
                  <p>{raioX.padroes_de_compra.gatilhos_decisao}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Objeções Previsíveis:</span>
                  <p>{raioX.padroes_de_compra.objecoes_previsiveis}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Ciclo de Decisão:</span>
                  <p>{raioX.padroes_de_compra.ciclo_decisao}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Influenciadores:</span>
                  <p>{raioX.padroes_de_compra.influenciadores}</p>
                </div>
              </CardContent>
            </Card>

            {/* Neurobehaviors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Neurocomportamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Processa Informação:</span>
                  <p>{raioX.neurocomportamentos.processamento_informacao}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Gera Confiança:</span>
                  <p>{raioX.neurocomportamentos.gatilhos_confianca}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Gera Resistência:</span>
                  <p>{raioX.neurocomportamentos.gatilhos_resistencia}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Canal Ideal:</span>
                  <p>{raioX.neurocomportamentos.canal_comunicacao_ideal}</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Strategy */}
            <Card className="md:col-span-2 bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Estratégia Recomendada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium text-muted-foreground text-sm">Tom de Comunicação:</span>
                  <p className="text-sm">{raioX.estrategia_recomendada.tom_comunicacao}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground text-sm">Gatilhos Mentais Prioritários:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {raioX.estrategia_recomendada.gatilhos_mentais_prioritarios.map((g, i) => (
                      <Badge key={i} variant="secondary">{g}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground text-sm">Abordagem de Venda:</span>
                  <p className="text-sm">{raioX.estrategia_recomendada.abordagem_venda}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground text-sm">Argumentos Chave:</span>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {raioX.estrategia_recomendada.argumentos_chave.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for RaioX cards
interface RaioXCardProps {
  title: string;
  items: string[];
  icon?: React.ComponentType<{ className?: string }>;
  color?: "default" | "secondary" | "destructive";
}

function RaioXCard({ title, items, icon: Icon, color = "default" }: RaioXCardProps) {
  const colorClasses = {
    default: "bg-primary/10 text-primary",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Badge variant="outline" className={`${colorClasses[color]} text-xs px-1.5 mt-0.5`}>
                {index + 1}
              </Badge>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
