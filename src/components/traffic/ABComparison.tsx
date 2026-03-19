import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GitCompare, ArrowRight } from "lucide-react";
import AdPreviewMock from "./AdPreviewMock";

interface CampaignRow {
  id: string;
  platform: string;
  structured_data: any;
}

interface ABComparisonProps {
  campaigns: CampaignRow[];
}

interface AdOption {
  key: string;
  label: string;
  ad: any;
  platform: string;
  campaignName: string;
  setName: string;
}

export default function ABComparison({ campaigns }: ABComparisonProps) {
  const [leftKey, setLeftKey] = useState<string>("");
  const [rightKey, setRightKey] = useState<string>("");

  // Build flat list of all ads
  const allAds: AdOption[] = [];
  campaigns.forEach(c => {
    const sd = c.structured_data;
    if (!sd?.ad_sets) return;
    sd.ad_sets.forEach((adSet: any, si: number) => {
      adSet.ads?.forEach((ad: any, ai: number) => {
        const key = `${c.id}-${si}-${ai}`;
        allAds.push({
          key,
          label: `${sd.campaign?.name} › ${adSet.name} › ${ad.name}`,
          ad,
          platform: c.platform,
          campaignName: sd.campaign?.name || "Campanha",
          setName: adSet.name,
        });
      });
    });
  });

  const leftAd = allAds.find(a => a.key === leftKey);
  const rightAd = allAds.find(a => a.key === rightKey);

  if (allAds.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-48 text-center space-y-2">
          <GitCompare className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Você precisa de pelo menos 2 anúncios aprovados para comparar.</p>
          <p className="text-xs text-muted-foreground">Crie e aprove anúncios na aba "Criar Anúncio", depois duplique para criar variações A/B.</p>
        </CardContent>
      </Card>
    );
  }

  const compareField = (label: string, leftVal: string, rightVal: string) => {
    if (!leftVal && !rightVal) return null;
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start py-2 border-b border-border/50 last:border-0">
        <p className="text-xs">{leftVal || "—"}</p>
        <Badge variant="outline" className="text-[8px] h-5 shrink-0">{label}</Badge>
        <p className="text-xs text-right">{rightVal || "—"}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            Comparar Criativos — Teste A/B
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Criativo A</p>
              <Select value={leftKey} onValueChange={setLeftKey}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {allAds.filter(a => a.key !== rightKey).map(a => (
                    <SelectItem key={a.key} value={a.key} className="text-xs">{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground mb-2" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Criativo B</p>
              <Select value={rightKey} onValueChange={setRightKey}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {allAds.filter(a => a.key !== leftKey).map(a => (
                    <SelectItem key={a.key} value={a.key} className="text-xs">{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {leftAd && rightAd && (
        <>
          {/* Side-by-side previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">A</Badge>
                <span className="text-xs font-medium truncate">{leftAd.ad.name}</span>
              </div>
              <AdPreviewMock ad={leftAd.ad} platform={leftAd.platform} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">B</Badge>
                <span className="text-xs font-medium truncate">{rightAd.ad.name}</span>
              </div>
              <AdPreviewMock ad={rightAd.ad} platform={rightAd.platform} />
            </div>
          </div>

          {/* Copy comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Comparação de Copy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {compareField("Headline", leftAd.ad.headline, rightAd.ad.headline)}
              {compareField("Texto Principal", leftAd.ad.primary_text, rightAd.ad.primary_text)}
              {compareField("Descrição", leftAd.ad.description, rightAd.ad.description)}
              {compareField("CTA", leftAd.ad.cta, rightAd.ad.cta)}
              {compareField("Formato", leftAd.ad.creative_format_label || leftAd.ad.format, rightAd.ad.creative_format_label || rightAd.ad.format)}
              {leftAd.ad.video_script || rightAd.ad.video_script ? compareField("Roteiro", leftAd.ad.video_script, rightAd.ad.video_script) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
