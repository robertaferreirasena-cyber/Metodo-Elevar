import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Search, ThumbsUp } from "lucide-react";

interface Ad {
  name: string;
  headline: string;
  primary_text: string;
  description?: string;
  cta: string;
  format: string;
  video_script?: string;
  visual_brief?: string;
  creative_format_label?: string;
  creative_description?: string;
  recommended_dimensions?: string;
}

interface AdPreviewMockProps {
  ad: Ad;
  platform: string;
}

function MetaFeedPreview({ ad }: { ad: Ad }) {
  return (
    <div className="bg-background border rounded-lg max-w-sm mx-auto overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="w-8 h-8 rounded-full bg-primary/20" />
        <div className="flex-1">
          <p className="text-xs font-semibold">Sua Marca</p>
          <p className="text-[10px] text-muted-foreground">Patrocinado · 🌐</p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="px-3 pb-2">
        <p className="text-xs leading-relaxed line-clamp-3">{ad.primary_text}</p>
      </div>
      <div className="bg-muted/50 aspect-video flex items-center justify-center border-y">
        <div className="text-center p-4">
          {ad.format === "video" ? (
            <div className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">▶</div>
              <p className="text-[10px] text-muted-foreground">Vídeo do anúncio</p>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">{ad.visual_brief || "Imagem do anúncio"}</p>
          )}
        </div>
      </div>
      <div className="p-3 border-b bg-muted/30">
        <p className="text-[10px] text-muted-foreground uppercase">sua-marca.com</p>
        <p className="text-xs font-semibold truncate">{ad.headline}</p>
        {ad.description && <p className="text-[10px] text-muted-foreground truncate">{ad.description}</p>}
        <Button size="sm" variant="secondary" className="mt-2 h-7 text-xs w-full">{ad.cta}</Button>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex gap-4">
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <Send className="h-4 w-4 text-muted-foreground" />
        </div>
        <Bookmark className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function MetaStoriesPreview({ ad }: { ad: Ad }) {
  return (
    <div className="bg-gradient-to-b from-primary/20 to-primary/5 rounded-2xl max-w-[200px] mx-auto aspect-[9/16] relative overflow-hidden border">
      <div className="absolute top-2 left-2 right-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-background/80 border" />
        <p className="text-[9px] font-semibold text-foreground">Sua Marca</p>
        <Badge variant="outline" className="text-[8px] h-4 ml-auto">Patrocinado</Badge>
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <p className="text-xs text-center font-medium">{ad.headline}</p>
      </div>
      <div className="absolute bottom-4 left-2 right-2">
        <Button size="sm" className="w-full h-7 text-[10px]">{ad.cta}</Button>
      </div>
    </div>
  );
}

function GoogleSearchPreview({ ad }: { ad: Ad }) {
  return (
    <div className="bg-background border rounded-lg max-w-md mx-auto p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 bg-muted/50 rounded-full px-3 py-1.5">
          <p className="text-[10px] text-muted-foreground">pesquisa relacionada...</p>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1 mb-0.5">
          <Badge variant="outline" className="text-[8px] h-4">Anúncio</Badge>
          <p className="text-[10px] text-muted-foreground">sua-marca.com</p>
        </div>
        <p className="text-sm text-primary font-medium hover:underline cursor-pointer">{ad.headline}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ad.primary_text}</p>
      </div>
    </div>
  );
}

function TikTokPreview({ ad }: { ad: Ad }) {
  return (
    <div className="bg-black rounded-2xl max-w-[200px] mx-auto aspect-[9/16] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-12 left-3 right-10">
        <p className="text-white text-[10px] font-semibold mb-1">@suamarca</p>
        <p className="text-white/90 text-[9px] line-clamp-2">{ad.primary_text}</p>
        <Badge className="mt-1 text-[8px] h-4 bg-white/20 text-white border-none">{ad.cta}</Badge>
      </div>
      <div className="absolute right-2 bottom-20 flex flex-col gap-3 items-center">
        <Heart className="h-5 w-5 text-white" />
        <MessageCircle className="h-5 w-5 text-white" />
        <Send className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}

export default function AdPreviewMock({ ad, platform }: AdPreviewMockProps) {
  const isMetaPlatform = platform.toLowerCase().includes("meta") || platform.toLowerCase().includes("facebook") || platform.toLowerCase().includes("instagram");
  const isGoogle = platform.toLowerCase().includes("google");
  const isTikTok = platform.toLowerCase().includes("tiktok");

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <p className="text-xs font-medium text-muted-foreground text-center">Preview: {ad.name}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {isMetaPlatform && (
            <>
              <div className="space-y-1">
                <p className="text-[10px] text-center text-muted-foreground">Feed</p>
                <MetaFeedPreview ad={ad} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-center text-muted-foreground">Stories</p>
                <MetaStoriesPreview ad={ad} />
              </div>
            </>
          )}
          {isGoogle && (
            <div className="space-y-1">
              <p className="text-[10px] text-center text-muted-foreground">Pesquisa</p>
              <GoogleSearchPreview ad={ad} />
            </div>
          )}
          {isTikTok && (
            <div className="space-y-1">
              <p className="text-[10px] text-center text-muted-foreground">For You</p>
              <TikTokPreview ad={ad} />
            </div>
          )}
          {!isMetaPlatform && !isGoogle && !isTikTok && <MetaFeedPreview ad={ad} />}
        </div>
      </CardContent>
    </Card>
  );
}
