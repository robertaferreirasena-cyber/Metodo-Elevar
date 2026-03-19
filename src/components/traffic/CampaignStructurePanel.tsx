import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, FolderOpen, Folder, FileText, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignItem {
  id: string;
  platform: string;
  status: string;
  created_at: string;
  structured_data: {
    campaign: { name: string; objective: string; budget_value: string; status: string };
    ad_sets: Array<{
      name: string;
      budget: string;
      ads: Array<{ name: string; headline: string }>;
    }>;
  };
}

interface CampaignStructurePanelProps {
  campaigns: CampaignItem[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  onDeleteCampaign: (id: string) => void;
}

export default function CampaignStructurePanel({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  onDeleteCampaign,
}: CampaignStructurePanelProps) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 p-4">
        <Folder className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Nenhuma campanha aprovada ainda</p>
        <p className="text-[10px] text-muted-foreground">Gere um anúncio e clique em "Aprovar Campanha"</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-1 p-2">
        {campaigns.map(campaign => {
          const sd = campaign.structured_data;
          const isExpanded = expandedCampaigns.has(campaign.id);
          const isSelected = selectedCampaignId === campaign.id;

          return (
            <div key={campaign.id}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(campaign.id)}>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs hover:bg-muted/50 transition-colors",
                      isSelected && "bg-primary/10 border border-primary/20"
                    )}
                    onClick={() => { onSelectCampaign(campaign.id); }}
                  >
                    <ChevronRight className={cn("h-3 w-3 transition-transform shrink-0", isExpanded && "rotate-90")} />
                    <Folder className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span className="truncate flex-1 font-medium">{sd.campaign.name}</span>
                    <Badge variant="outline" className="text-[8px] h-4 shrink-0">
                      {campaign.platform.includes("Meta") ? "Meta" : campaign.platform.includes("Google") ? "Google" : "TikTok"}
                    </Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 border-l pl-2 space-y-0.5">
                    {sd.ad_sets?.map((adSet, si) => (
                      <div key={si}>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground">
                          <FolderOpen className="h-3 w-3 text-blue-500 shrink-0" />
                          <span className="truncate">{adSet.name}</span>
                          <span className="text-[9px] ml-auto shrink-0">{adSet.budget}</span>
                        </div>
                        <div className="ml-4 border-l pl-2 space-y-0.5">
                          {adSet.ads?.map((ad, ai) => (
                            <div key={ai} className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-muted-foreground">
                              <FileText className="h-2.5 w-2.5 text-green-500 shrink-0" />
                              <span className="truncate">{ad.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-1 px-2 pt-1 pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1"
                        onClick={() => onSelectCampaign(campaign.id)}
                      >
                        <Eye className="h-3 w-3" /> Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1 text-destructive hover:text-destructive"
                        onClick={() => onDeleteCampaign(campaign.id)}
                      >
                        <Trash2 className="h-3 w-3" /> Excluir
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
