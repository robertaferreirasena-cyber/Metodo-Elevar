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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, FolderOpen, FileText, BarChart3, Loader2, Pencil, Check, X, Download, Copy, ClipboardCheck } from "lucide-react";
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

export default function AdManagerSimulator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set([0]));
  const [selectedAdIndex, setSelectedAdIndex] = useState<{ setIdx: number; adIdx: number } | null>(null);
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
      const suffix = String.fromCharCode(65 + existingVariations); // A, B, C...
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

  const exportPDF = () => {
    if (!selectedCampaign || !sd) return;
    const doc = new jsPDF();
    const margin = 15;
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    const addText = (text: string, size: number, bold = false, color: [number, number, number] = [33, 33, 33]) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.5 + 1;
      }
    };

    const addSpacer = (h = 4) => { y += h; };

    // Title
    addText("PLANO DE CAMPANHA - GERENCIADOR DE ANUNCIOS", 14, true, [100, 50, 200]);
    addSpacer(6);

    // Campaign info
    addText(`Campanha: ${sd.campaign?.name}`, 12, true);
    addText(`Plataforma: ${selectedCampaign.platform}`, 10, false, [100, 100, 100]);
    addText(`Objetivo: ${sd.campaign?.objective}`, 10, false, [100, 100, 100]);
    addText(`Orcamento Total: ${sd.campaign?.budget_value}`, 10, false, [100, 100, 100]);
    addSpacer(8);

    // Ad Sets
    sd.ad_sets?.forEach((adSet: any, si: number) => {
      addText(`CONJUNTO ${si + 1}: ${adSet.name}`, 11, true, [30, 100, 200]);
      addText(`Orcamento: ${adSet.budget}`, 9, false, [80, 80, 80]);
      addText(`Publico: ${adSet.audience?.description || "N/A"}`, 9, false, [80, 80, 80]);
      addText(`Posicionamentos: ${adSet.placements?.join(", ") || "N/A"}`, 9, false, [80, 80, 80]);
      if (adSet.audience?.locations?.length) {
        addText(`Localizacoes: ${adSet.audience.locations.join(", ")}`, 9, false, [80, 80, 80]);
      }
      if (adSet.audience?.interests?.length) {
        addText(`Interesses: ${adSet.audience.interests.join(", ")}`, 9, false, [80, 80, 80]);
      }
      addText(`Faixa etaria: ${adSet.audience?.age_min || "?"}-${adSet.audience?.age_max || "?"} | Genero: ${adSet.audience?.gender || "todos"}`, 9, false, [80, 80, 80]);
      addSpacer(4);

      adSet.ads?.forEach((ad: any, ai: number) => {
        addText(`  Anuncio ${ai + 1}: ${ad.name}`, 10, true);
        addText(`  Formato: ${ad.format} | CTA: ${ad.cta}`, 9, false, [80, 80, 80]);
        addText(`  Headline: ${ad.headline}`, 9, false, [50, 50, 50]);
        addText(`  Texto: ${ad.primary_text}`, 9, false, [50, 50, 50]);
        if (ad.description) addText(`  Descricao: ${ad.description}`, 9, false, [80, 80, 80]);
        if (ad.video_script) addText(`  Roteiro: ${ad.video_script}`, 9, false, [80, 80, 80]);
        if (ad.visual_brief) addText(`  Briefing Visual: ${ad.visual_brief}`, 9, false, [80, 80, 80]);
        addSpacer(3);
      });
      addSpacer(6);
    });

    // Footer
    addSpacer(8);
    addText("Gerado pelo Metodo ANDROMEDA - Mentoria Elevar", 8, false, [150, 150, 150]);

    doc.save(`campanha-${sd.campaign?.name?.replace(/\s+/g, "-").toLowerCase() || "export"}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedAd = selectedAdIndex && sd?.ad_sets?.[selectedAdIndex.setIdx]?.ads?.[selectedAdIndex.adIdx];

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
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hierarchical table */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Nome</TableHead>
                        <TableHead className="text-xs">Orçamento</TableHead>
                        <TableHead className="text-xs">Público</TableHead>
                        <TableHead className="text-xs">Posicionamentos</TableHead>
                        <TableHead className="text-xs w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sd.ad_sets?.map((adSet: any, si: number) => (
                        <Collapsible key={si} open={expandedSets.has(si)} onOpenChange={() => toggleSet(si)} asChild>
                          <>
                            <CollapsibleTrigger asChild>
                              <TableRow className="cursor-pointer hover:bg-muted/50">
                                <TableCell className="p-2">
                                  <ChevronRight className={cn("h-3 w-3 transition-transform", expandedSets.has(si) && "rotate-90")} />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <Switch defaultChecked className="scale-75" />
                                    <span className="text-[10px] text-green-600">Ativo</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="text-xs font-medium">{adSet.name}</span>
                                  </div>
                                </TableCell>
                                {/* Budget - editable */}
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  {editing?.setIdx === si && editing.field === "budget" ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={editing.value}
                                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                        className="h-6 text-xs w-24"
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                                      />
                                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={saveEdit}><Check className="h-3 w-3 text-green-600" /></Button>
                                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={cancelEdit}><X className="h-3 w-3 text-destructive" /></Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 group">
                                      <span className="text-xs">{adSet.budget}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); startEditing(si, "budget", adSet.budget || ""); }}
                                      >
                                        <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                                {/* Audience - editable */}
                                <TableCell className="max-w-[150px]" onClick={(e) => e.stopPropagation()}>
                                  {editing?.setIdx === si && editing.field === "audience" ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={editing.value}
                                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                        className="h-6 text-[10px] w-32"
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                                      />
                                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={saveEdit}><Check className="h-3 w-3 text-green-600" /></Button>
                                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={cancelEdit}><X className="h-3 w-3 text-destructive" /></Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 group">
                                      <span className="text-[10px] truncate">{adSet.audience?.description || `${adSet.audience?.gender} ${adSet.audience?.age_min}-${adSet.audience?.age_max}`}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                        onClick={(e) => { e.stopPropagation(); startEditing(si, "audience", adSet.audience?.description || ""); }}
                                      >
                                        <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 flex-wrap">
                                    {adSet.placements?.map((p: string, pi: number) => (
                                      <Badge key={pi} variant="outline" className="text-[8px] h-4">{p}</Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </CollapsibleTrigger>
                            <CollapsibleContent asChild>
                              <>
                                {adSet.ads?.map((ad: any, ai: number) => (
                                  <TableRow key={ai} className="bg-muted/20">
                                    <TableCell></TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1.5 pl-4">
                                        <Switch defaultChecked className="scale-75" />
                                        <span className="text-[10px] text-green-600">Ativo</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1.5 pl-4">
                                        <FileText className="h-3 w-3 text-green-500" />
                                        <span className="text-xs">{ad.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">—</TableCell>
                                    <TableCell className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                      {ad.headline}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-[8px] h-4">{ad.format}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px]"
                                        onClick={() => setSelectedAdIndex({ setIdx: si, adIdx: ai })}
                                      >
                                        👁 Ver
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </>
                            </CollapsibleContent>
                          </>
                        </Collapsible>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Ad Preview */}
            {selectedAd && (
              <AdPreviewMock ad={selectedAd} platform={selectedCampaign.platform} />
            )}

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
