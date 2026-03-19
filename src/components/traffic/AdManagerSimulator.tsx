import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronRight, ChevronDown, FolderOpen, FileText, BarChart3, Loader2,
  Pencil, Check, X, Download, Copy, ClipboardCheck, Users, MapPin,
  Target, Zap, Eye, MonitorPlay, Image, LayoutGrid, Clipboard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import CampaignStructurePanel from "./CampaignStructurePanel";
import AdPreviewMock from "./AdPreviewMock";

const CHECKLIST_STEPS: Record<string, string[]> = {
  Meta: [
    "Criar campanha no Meta Ads Manager",
    "Configurar objetivo da campanha",
    "Definir orçamento diário/total",
    "Configurar público-alvo (idade, gênero, localização, interesses)",
    "Selecionar posicionamentos (Feed, Stories, Reels)",
    "Criar anúncios com criativos e textos",
    "Instalar e configurar o Meta Pixel",
    "Revisar e publicar campanha",
  ],
  Google: [
    "Criar campanha no Google Ads",
    "Configurar objetivo da campanha",
    "Definir estratégia de lances",
    "Configurar grupos de anúncios e palavras-chave",
    "Criar anúncios com títulos e descrições",
    "Vincular conversões (Google Tag)",
    "Revisar e publicar campanha",
  ],
  TikTok: [
    "Criar campanha no TikTok Ads Manager",
    "Configurar objetivo da campanha",
    "Definir orçamento diário/total",
    "Configurar público-alvo (idade, gênero, interesses)",
    "Criar anúncios com criativos de vídeo",
    "Instalar e configurar o TikTok Pixel",
    "Revisar e publicar campanha",
  ],
};

interface CampaignRow {
  id: string;
  platform: string;
  objective: string;
  product: string | null;
  audience: string | null;
  budget: string | null;
  tone: string | null;
  raw_result: string;
  structured_data: any;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface EditingField {
  setIdx: number;
  field: "budget" | "audience";
  value: string;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copiado!`);
  }).catch(() => {
    toast.error("Erro ao copiar");
  });
}

function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      onClick={(e) => { e.stopPropagation(); copyToClipboard(text, label); }}
      title={`Copiar ${label}`}
    >
      <Clipboard className="h-3 w-3 text-muted-foreground" />
    </Button>
  );
}

function CopyableField({ label, value, className }: { label: string; value: string; className?: string }) {
  if (!value) return null;
  return (
    <div className={cn("group flex items-start gap-2", className)}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xs mt-0.5 whitespace-pre-wrap">{value}</p>
      </div>
      <CopyButton text={value} label={label} />
    </div>
  );
}

function FormatIcon({ format }: { format: string }) {
  if (format === "video") return <MonitorPlay className="h-3.5 w-3.5 text-red-500" />;
  if (format === "carousel") return <LayoutGrid className="h-3.5 w-3.5 text-blue-500" />;
  return <Image className="h-3.5 w-3.5 text-green-500" />;
}

function FormatBadge({ ad }: { ad: any }) {
  const label = ad.creative_format_label || ad.format;
  const dims = ad.recommended_dimensions;
  return (
    <div className="flex items-center gap-1.5">
      <FormatIcon format={ad.format} />
      <Badge variant="outline" className="text-[9px] h-5">{label}</Badge>
      {dims && <span className="text-[9px] text-muted-foreground">{dims}</span>}
    </div>
  );
}

export default function AdManagerSimulator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set([0]));
  const [expandedAds, setExpandedAds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingField | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["ad-campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CampaignRow[];
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, structured_data }: { id: string; structured_data: any }) => {
      const { error } = await supabase
        .from("ad_campaigns")
        .update({ structured_data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-campaigns"] });
      toast.success("Campanha atualizada");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-campaigns"] });
      setSelectedCampaignId(null);
      toast.success("Campanha excluída");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (campaign: CampaignRow) => {
      const existingVariations = campaigns.filter(c =>
        c.structured_data?.campaign?.name?.startsWith(campaign.structured_data?.campaign?.name?.replace(/ \(Variação [A-Z]\)$/, ""))
      ).length;
      const suffix = String.fromCharCode(65 + existingVariations);
      const baseName = campaign.structured_data?.campaign?.name?.replace(/ \(Variação [A-Z]\)$/, "") || "Campanha";
      const newSd = JSON.parse(JSON.stringify(campaign.structured_data));
      newSd.campaign.name = `${baseName} (Variação ${suffix})`;

      const { data, error } = await supabase.from("ad_campaigns").insert({
        user_id: campaign.user_id,
        platform: campaign.platform,
        objective: campaign.objective,
        product: campaign.product,
        audience: campaign.audience,
        budget: campaign.budget,
        tone: campaign.tone,
        raw_result: campaign.raw_result,
        structured_data: newSd,
        status: "approved",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ad-campaigns"] });
      if (data) setSelectedCampaignId(data.id);
      toast.success("Variação A/B criada com sucesso!");
    },
  });

  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const sd = selectedCampaign?.structured_data;

  const toggleSet = (idx: number) => {
    setExpandedSets(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleAd = (key: string) => {
    setExpandedAds(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const startEditing = (setIdx: number, field: "budget" | "audience", currentValue: string) => {
    setEditing({ setIdx, field, value: currentValue });
  };

  const saveEdit = () => {
    if (!editing || !selectedCampaign || !sd) return;
    const newSd = JSON.parse(JSON.stringify(sd));
    if (editing.field === "budget") {
      newSd.ad_sets[editing.setIdx].budget = editing.value;
    } else {
      newSd.ad_sets[editing.setIdx].audience.description = editing.value;
    }
    updateMutation.mutate({ id: selectedCampaign.id, structured_data: newSd });
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  const exportAudienceText = (adSet: any, setIndex: number) => {
    const a = adSet.audience || {};
    const dt = a.detailed_targeting || {};
    const genderLabel = a.gender === "all" ? "Todos" : a.gender === "male" ? "Masculino" : "Feminino";

    const sections = [
      `========================================`,
      `CONFIGURACAO DE PUBLICO - META ADS 2026`,
      `Conjunto: ${adSet.name}`,
      `========================================`,
      ``,
      `--- DADOS BASICOS ---`,
      `Genero: ${genderLabel}`,
      `Faixa Etaria: ${a.age_min || 18} - ${a.age_max || 65} anos`,
      `Localizacoes: ${a.locations?.join(", ") || "N/A"}`,
      ``,
      `--- SEGMENTACAO DETALHADA ---`,
      dt.interests?.length ? `Interesses: ${dt.interests.join(" | ")}` : null,
      dt.behaviors?.length ? `Comportamentos: ${dt.behaviors.join(" | ")}` : null,
      dt.demographics?.length ? `Dados Demograficos: ${dt.demographics.join(" | ")}` : null,
      ``,
      a.custom_audiences?.length ? `--- PUBLICOS PERSONALIZADOS ---` : null,
      a.custom_audiences?.length ? a.custom_audiences.map((ca: string) => `  - ${ca}`).join("\n") : null,
      ``,
      `--- CONFIGURACOES ---`,
      `Advantage+ Audience: ${a.advantage_plus ? "ATIVADO (recomendado)" : "Desativado"}`,
      adSet.optimization_goal ? `Objetivo de Otimizacao: ${adSet.optimization_goal}` : null,
      `Orcamento: ${adSet.budget}`,
      `Posicionamentos: ${adSet.placements?.join(", ") || "Automatico"}`,
      ``,
      `--- DESCRICAO DO PUBLICO ---`,
      a.description || "N/A",
      ``,
      `Gerado pelo Metodo ANDROMEDA - Mentoria Elevar`,
    ].filter(v => v !== null).join("\n");

    copyToClipboard(sections, `Publico do Conjunto ${setIndex + 1}`);
  };

  const exportPDF = () => {
    if (!selectedCampaign || !sd) return;
    const doc = new jsPDF("p", "mm", "a4");
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const ml = 20;
    const mr = 20;
    const maxW = pw - ml - mr;
    let y = 0;

    const checkPage = (needed = 12) => {
      if (y > ph - 25 - needed) {
        doc.addPage();
        y = 20;
      }
    };

    const drawLine = (x1: number, yy: number, x2: number, color: [number, number, number] = [200, 200, 200]) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      doc.line(x1, yy, x2, yy);
    };

    const sanitize = (text: string): string =>
      text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const writeText = (text: string, x: number, size: number, bold = false, color: [number, number, number] = [40, 40, 40]) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(sanitize(text), maxW - (x - ml));
      for (const line of lines) {
        checkPage(size * 0.45);
        doc.text(line, x, y);
        y += size * 0.45 + 0.5;
      }
    };

    // ===== COVER HEADER =====
    doc.setFillColor(30, 15, 45);
    doc.rect(0, 0, pw, 55, "F");
    doc.setFillColor(200, 50, 120);
    doc.rect(0, 55, pw, 1.5, "F");

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(sanitize("PLANO DE CAMPANHA"), ml, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 180, 220);
    doc.text(sanitize("Metodo ANDROMEDA  |  Mentoria Elevar"), ml, 35);

    doc.setFontSize(9);
    doc.setTextColor(180, 160, 200);
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    doc.text(sanitize(dateStr), ml, 45);

    y = 68;

    // ===== CAMPAIGN INFO =====
    doc.setFillColor(245, 240, 250);
    doc.roundedRect(ml, y - 5, maxW, 28, 3, 3, "F");
    writeText(sd.campaign?.name || "Campanha", ml + 5, 13, true, [60, 20, 100]);
    y += 2;
    writeText(`Plataforma: ${selectedCampaign.platform}   |   Objetivo: ${sd.campaign?.objective || "N/A"}   |   Orcamento: ${sd.campaign?.budget_value || "N/A"}`, ml + 5, 9, false, [100, 80, 120]);
    y += 10;

    // ===== AD SETS =====
    sd.ad_sets?.forEach((adSet: any, si: number) => {
      checkPage(30);
      const a = adSet.audience || {};
      const dt = a.detailed_targeting || {};

      // Set header
      doc.setFillColor(200, 50, 120);
      doc.roundedRect(ml, y, maxW, 8, 2, 2, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(sanitize(`CONJUNTO ${si + 1}: ${adSet.name}`), ml + 4, y + 5.5);
      y += 14;

      // Optimization & Budget
      if (adSet.optimization_goal) {
        writeText(`Otimizacao: ${adSet.optimization_goal}`, ml, 9, true, [50, 50, 50]);
      }
      writeText(`Orcamento: ${adSet.budget}`, ml, 9, false, [80, 80, 80]);
      y += 2;

      // Audience section
      drawLine(ml, y, pw - mr, [200, 50, 120]);
      y += 5;
      writeText("PUBLICO-ALVO", ml, 9, true, [60, 20, 100]);
      y += 1;
      const genderLabel = a.gender === "all" ? "Todos" : a.gender === "male" ? "Masculino" : "Feminino";
      writeText(`Genero: ${genderLabel}   |   Idade: ${a.age_min || 18}-${a.age_max || 65} anos`, ml + 2, 9, false, [60, 60, 60]);
      if (a.locations?.length) writeText(`Localizacoes: ${a.locations.join(", ")}`, ml + 2, 9, false, [60, 60, 60]);
      if (a.description) writeText(`Descricao: ${a.description}`, ml + 2, 8, false, [100, 100, 100]);
      y += 2;

      // Detailed Targeting
      if (dt.interests?.length || dt.behaviors?.length || dt.demographics?.length) {
        writeText("SEGMENTACAO DETALHADA", ml, 8, true, [60, 20, 100]);
        if (dt.interests?.length) writeText(`Interesses: ${dt.interests.join("  |  ")}`, ml + 2, 8, false, [60, 60, 60]);
        if (dt.behaviors?.length) writeText(`Comportamentos: ${dt.behaviors.join("  |  ")}`, ml + 2, 8, false, [60, 60, 60]);
        if (dt.demographics?.length) writeText(`Demograficos: ${dt.demographics.join("  |  ")}`, ml + 2, 8, false, [60, 60, 60]);
        y += 1;
      }

      if (a.custom_audiences?.length) {
        writeText(`Publicos Personalizados: ${a.custom_audiences.join("  |  ")}`, ml + 2, 8, false, [100, 60, 140]);
      }
      if (a.advantage_plus) {
        writeText("Advantage+ Audience: ATIVADO", ml + 2, 8, true, [0, 130, 80]);
      }

      // Placements
      writeText(`Posicionamentos: ${adSet.placements?.join(", ") || "Automatico"}`, ml + 2, 8, false, [80, 80, 80]);
      y += 4;

      // Ads
      drawLine(ml, y, pw - mr, [220, 220, 220]);
      y += 5;
      adSet.ads?.forEach((ad: any, ai: number) => {
        checkPage(25);
        const fmtLabel = ad.creative_format_label || ad.format;
        doc.setFillColor(248, 245, 252);
        doc.roundedRect(ml + 2, y - 3, maxW - 4, 7, 1, 1, "F");
        writeText(`Anuncio ${ai + 1}: ${ad.name}  [${fmtLabel}${ad.recommended_dimensions ? ` - ${ad.recommended_dimensions}` : ""}]`, ml + 4, 9, true, [40, 40, 40]);
        y += 2;
        writeText(`Headline: ${ad.headline}`, ml + 4, 9, false, [50, 50, 50]);
        writeText(`Texto Principal: ${ad.primary_text}`, ml + 4, 8, false, [70, 70, 70]);
        if (ad.description) writeText(`Descricao: ${ad.description}`, ml + 4, 8, false, [90, 90, 90]);
        writeText(`CTA: ${ad.cta}`, ml + 4, 8, true, [200, 50, 120]);
        if (ad.creative_description) {
          writeText(`Criativo: ${ad.creative_description}`, ml + 4, 8, false, [90, 90, 90]);
        }
        if (ad.video_script) writeText(`Roteiro: ${ad.video_script}`, ml + 4, 8, false, [90, 90, 90]);
        if (ad.visual_brief) writeText(`Briefing Visual: ${ad.visual_brief}`, ml + 4, 8, false, [90, 90, 90]);
        y += 5;
      });
      y += 4;
    });

    // ===== FOOTER =====
    checkPage(15);
    drawLine(ml, y, pw - mr, [200, 50, 120]);
    y += 6;
    writeText("Gerado pelo Metodo ANDROMEDA - Mentoria Elevar", ml, 7, false, [160, 140, 180]);
    writeText("Este documento e confidencial e de uso exclusivo do destinatario.", ml, 7, false, [180, 170, 190]);

    doc.save(`campanha-${sd.campaign?.name?.replace(/\s+/g, "-").toLowerCase() || "export"}.pdf`);
    toast.success("PDF Premium exportado com sucesso!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Campanhas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CampaignStructurePanel
            campaigns={campaigns.filter(c => c.structured_data) as any}
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={setSelectedCampaignId}
            onDeleteCampaign={(id) => deleteMutation.mutate(id)}
            onDuplicateCampaign={(id) => {
              const c = campaigns.find(x => x.id === id);
              if (c) duplicateMutation.mutate(c);
            }}
          />
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="lg:col-span-3 space-y-4">
        {!selectedCampaign || !sd ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center space-y-3">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium">Selecione uma campanha</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aprove um anúncio na aba "Criar Anúncio" para ver o simulador
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Campaign header */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px]">
                      🟢 {sd.campaign?.status === "active" ? "Ativo" : "Pausado"}
                    </Badge>
                    <span className="text-sm font-semibold">{sd.campaign?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Objetivo: <strong>{sd.campaign?.objective}</strong></span>
                      <span>Orçamento: <strong>{sd.campaign?.budget_value}</strong></span>
                      <Badge variant="outline" className="text-[10px]">{selectedCampaign.platform}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => duplicateMutation.mutate(selectedCampaign)}
                      disabled={duplicateMutation.isPending}
                    >
                      <Copy className="h-3 w-3" />
                      Duplicar A/B
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={exportPDF}>
                      <Download className="h-3 w-3" />
                      PDF Premium
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ad Sets - Detailed Cards */}
            {sd.ad_sets?.map((adSet: any, si: number) => {
              const isExpanded = expandedSets.has(si);
              const audience = adSet.audience || {};
              const dt = audience.detailed_targeting || {};

              return (
                <Card key={si}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleSet(si)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <FolderOpen className="h-4 w-4 text-blue-500" />
                            <CardTitle className="text-sm">{adSet.name}</CardTitle>
                            <Switch defaultChecked className="scale-75" />
                          </div>
                          <div className="flex items-center gap-2">
                            {adSet.optimization_goal && (
                              <Badge variant="secondary" className="text-[9px]">
                                <Target className="h-3 w-3 mr-1" />
                                {adSet.optimization_goal}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[9px]">{adSet.budget}</Badge>
                            {audience.advantage_plus && (
                              <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[9px]">
                                <Zap className="h-3 w-3 mr-0.5" />
                                Advantage+
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        {/* Audience Section */}
                        <div className="rounded-lg border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-violet-500" />
                              Público-Alvo
                            </h4>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] gap-1"
                                onClick={() => exportAudienceText(adSet, si)}
                              >
                                <FileText className="h-3 w-3" />
                                Exportar Publico
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] gap-1"
                                onClick={() => {
                                  const parts = [
                                    `Genero: ${audience.gender || "todos"}`,
                                    `Idade: ${audience.age_min || "18"}-${audience.age_max || "65"}`,
                                    `Localizacoes: ${audience.locations?.join(", ") || "N/A"}`,
                                    dt.interests?.length ? `Interesses: ${dt.interests.join(", ")}` : "",
                                    dt.behaviors?.length ? `Comportamentos: ${dt.behaviors.join(", ")}` : "",
                                    dt.demographics?.length ? `Dados demograficos: ${dt.demographics.join(", ")}` : "",
                                    audience.custom_audiences?.length ? `Publicos personalizados: ${audience.custom_audiences.join(", ")}` : "",
                                  ].filter(Boolean).join("\n");
                                  copyToClipboard(parts, "Configuracao de publico");
                                }}
                              >
                                <Clipboard className="h-3 w-3" />
                                Copiar tudo
                              </Button>
                            </div>
                          </div>

                          {/* Audience description */}
                          {audience.description && (
                            <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                              {audience.description}
                            </p>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Gênero</p>
                              <p className="mt-0.5">{audience.gender === "all" ? "Todos" : audience.gender === "male" ? "Masculino" : "Feminino"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Faixa Etária</p>
                              <p className="mt-0.5">{audience.age_min || 18} — {audience.age_max || 65} anos</p>
                            </div>
                            <div className="group">
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Localizações</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                <p className="truncate">{audience.locations?.join(", ") || "N/A"}</p>
                                {audience.locations?.length > 0 && (
                                  <CopyButton text={audience.locations.join(", ")} label="Localizações" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Detailed Targeting */}
                          {(dt.interests?.length > 0 || dt.behaviors?.length > 0 || dt.demographics?.length > 0) && (
                            <div className="space-y-2 pt-1">
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                                Segmentação Detalhada (Meta Ads 2026)
                              </p>
                              {dt.interests?.length > 0 && (
                                <div className="group">
                                  <p className="text-[10px] text-muted-foreground mb-1">Interesses</p>
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {dt.interests.map((i: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-[9px] h-5 cursor-pointer hover:bg-primary/10"
                                        onClick={() => copyToClipboard(i, "Interesse")}
                                      >{i}</Badge>
                                    ))}
                                    <CopyButton text={dt.interests.join(", ")} label="Interesses" />
                                  </div>
                                </div>
                              )}
                              {dt.behaviors?.length > 0 && (
                                <div className="group">
                                  <p className="text-[10px] text-muted-foreground mb-1">Comportamentos</p>
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {dt.behaviors.map((b: string, idx: number) => (
                                      <Badge key={idx} variant="secondary" className="text-[9px] h-5 cursor-pointer hover:bg-primary/10"
                                        onClick={() => copyToClipboard(b, "Comportamento")}
                                      >{b}</Badge>
                                    ))}
                                    <CopyButton text={dt.behaviors.join(", ")} label="Comportamentos" />
                                  </div>
                                </div>
                              )}
                              {dt.demographics?.length > 0 && (
                                <div className="group">
                                  <p className="text-[10px] text-muted-foreground mb-1">Dados Demográficos</p>
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {dt.demographics.map((d: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-[9px] h-5 border-dashed cursor-pointer hover:bg-primary/10"
                                        onClick={() => copyToClipboard(d, "Demográfico")}
                                      >{d}</Badge>
                                    ))}
                                    <CopyButton text={dt.demographics.join(", ")} label="Dados Demográficos" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Custom Audiences */}
                          {audience.custom_audiences?.length > 0 && (
                            <div className="group">
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">
                                Públicos Personalizados / Lookalike
                              </p>
                              <div className="flex flex-wrap gap-1 items-center">
                                {audience.custom_audiences.map((ca: string, idx: number) => (
                                  <Badge key={idx} className="bg-violet-500/10 text-violet-600 border-violet-200 text-[9px] h-5 cursor-pointer hover:bg-violet-500/20"
                                    onClick={() => copyToClipboard(ca, "Público")}
                                  >{ca}</Badge>
                                ))}
                                <CopyButton text={audience.custom_audiences.join(", ")} label="Públicos Personalizados" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Placements Section */}
                        <div className="rounded-lg border p-3">
                          <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                            <MapPin className="h-3.5 w-3.5 text-orange-500" />
                            Posicionamentos
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {adSet.placements?.map((p: string, pi: number) => (
                              <Badge key={pi} variant="outline" className="text-[10px] h-6 capitalize">{p}</Badge>
                            ))}
                          </div>
                        </div>

                        {/* Ads Section */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-green-500" />
                            Anúncios ({adSet.ads?.length || 0})
                          </h4>

                          {adSet.ads?.map((ad: any, ai: number) => {
                            const adKey = `${si}-${ai}`;
                            const isAdExpanded = expandedAds.has(adKey);

                            return (
                              <Card key={ai} className="border-dashed">
                                <Collapsible open={isAdExpanded} onOpenChange={() => toggleAd(adKey)}>
                                  <CollapsibleTrigger asChild>
                                    <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/30 transition-colors">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {isAdExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                          <FormatIcon format={ad.format} />
                                          <span className="text-xs font-medium">{ad.name}</span>
                                        </div>
                                        <FormatBadge ad={ad} />
                                      </div>
                                    </CardHeader>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <CardContent className="pt-0 pb-3 px-3 space-y-3">
                                      {/* Creative info */}
                                      {ad.creative_description && (
                                        <div className="rounded-md bg-muted/50 p-2">
                                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Descrição do Criativo</p>
                                          <p className="text-xs">{ad.creative_description}</p>
                                        </div>
                                      )}

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Ad copy fields */}
                                        <div className="space-y-3">
                                          <CopyableField label="Texto Principal" value={ad.primary_text} />
                                          <CopyableField label="Headline" value={ad.headline} />
                                          <CopyableField label="Descrição" value={ad.description} />
                                          <div className="flex items-center gap-2">
                                            <Badge className="text-[10px]">{ad.cta}</Badge>
                                            <CopyButton text={ad.cta} label="CTA" />
                                          </div>
                                          {ad.video_script && (
                                            <CopyableField label="Roteiro de Vídeo" value={ad.video_script} />
                                          )}
                                          {ad.visual_brief && (
                                            <CopyableField label="Briefing Visual" value={ad.visual_brief} />
                                          )}
                                        </div>

                                        {/* Preview */}
                                        <div>
                                          <AdPreviewMock ad={ad} platform={selectedCampaign.platform} />
                                        </div>
                                      </div>
                                    </CardContent>
                                  </CollapsibleContent>
                                </Collapsible>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}

            {/* Implementation Checklist */}
            {(() => {
              const platformKey = selectedCampaign.platform.includes("Meta") ? "Meta"
                : selectedCampaign.platform.includes("Google") ? "Google" : "TikTok";
              const steps = CHECKLIST_STEPS[platformKey];
              const progress = steps.length > 0 ? Math.round((checkedSteps.size / steps.length) * 100) : 0;

              return (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-1.5">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Checklist de Implementação — {platformKey} Ads
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground font-medium">{progress}%</span>
                    </div>
                    <div className="space-y-2">
                      {steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Checkbox
                            id={`step-${i}`}
                            checked={checkedSteps.has(i)}
                            onCheckedChange={(checked) => {
                              setCheckedSteps(prev => {
                                const next = new Set(prev);
                                checked ? next.add(i) : next.delete(i);
                                return next;
                              });
                            }}
                          />
                          <label
                            htmlFor={`step-${i}`}
                            className={cn(
                              "text-xs cursor-pointer",
                              checkedSteps.has(i) && "line-through text-muted-foreground"
                            )}
                          >
                            {i + 1}. {step}
                          </label>
                        </div>
                      ))}
                    </div>
                    {progress === 100 && (
                      <p className="text-xs text-green-600 font-medium">
                        🎉 Checklist completo! Sua campanha está pronta para ir ao ar.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
