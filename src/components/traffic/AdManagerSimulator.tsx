import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, Folder, FolderOpen, FileText, BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CampaignStructurePanel from "./CampaignStructurePanel";
import AdPreviewMock from "./AdPreviewMock";

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

export default function AdManagerSimulator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set([0]));
  const [selectedAdIndex, setSelectedAdIndex] = useState<{ setIdx: number; adIdx: number } | null>(null);

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
      {/* Sidebar - Campaign tree */}
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
          />
        </CardContent>
      </Card>

      {/* Main content - Manager table */}
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
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Objetivo: <strong>{sd.campaign?.objective}</strong></span>
                    <span>Orçamento: <strong>{sd.campaign?.budget_value}</strong></span>
                    <Badge variant="outline" className="text-[10px]">{selectedCampaign.platform}</Badge>
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
                        <TableHead className="text-xs w-20">Preview</TableHead>
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
                                <TableCell className="text-xs">{adSet.budget}</TableCell>
                                <TableCell className="text-[10px] max-w-[150px] truncate">
                                  {adSet.audience?.description || `${adSet.audience?.gender} ${adSet.audience?.age_min}-${adSet.audience?.age_max}`}
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
          </>
        )}
      </div>
    </div>
  );
}
