import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Type, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { FONT_OPTIONS } from "./CarouselTemplates";

export interface BrandKit {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family_title: string;
  font_family_body: string;
  logo_url: string | null;
}

export default function BrandKitManager({ onApply }: { onApply: (kit: BrandKit) => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKit>({
    primary_color: "#E11D48",
    secondary_color: "#1A1A1A",
    accent_color: "#FBBF24",
    font_family_title: FONT_OPTIONS[0].name,
    font_family_body: FONT_OPTIONS[2].name,
    logo_url: null,
  });

  useEffect(() => {
    if (!user) return;
    const fetchBrandKit = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("brand_kit")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setBrandKit({
          primary_color: data.primary_color || "#E11D48",
          secondary_color: data.secondary_color || "#1A1A1A",
          accent_color: data.accent_color || "#FBBF24",
          font_family_title: data.font_family_title || FONT_OPTIONS[0].name,
          font_family_body: data.font_family_body || FONT_OPTIONS[2].name,
          logo_url: data.logo_url,
        });
      }
      setLoading(false);
    };
    fetchBrandKit();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("brand_kit")
      .upsert({
        user_id: user.id,
        ...brandKit,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast.error("Erro ao salvar Identidade Visual");
    } else {
      toast.success("Identidade Visual salva!");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Cores da Marca</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase">Primária</Label>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded border" style={{ backgroundColor: brandKit.primary_color }} />
              <Input 
                type="color" 
                value={brandKit.primary_color} 
                onChange={(e) => setBrandKit({ ...brandKit, primary_color: e.target.value })}
                className="w-full h-8 p-0 border-none cursor-pointer"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase">Secundária</Label>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded border" style={{ backgroundColor: brandKit.secondary_color }} />
              <Input 
                type="color" 
                value={brandKit.secondary_color} 
                onChange={(e) => setBrandKit({ ...brandKit, secondary_color: e.target.value })}
                className="w-full h-8 p-0 border-none cursor-pointer"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase">Destaque</Label>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded border" style={{ backgroundColor: brandKit.accent_color }} />
              <Input 
                type="color" 
                value={brandKit.accent_color} 
                onChange={(e) => setBrandKit({ ...brandKit, accent_color: e.target.value })}
                className="w-full h-8 p-0 border-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Type className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Tipografia</h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase">Título</Label>
            <select 
              value={brandKit.font_family_title}
              onChange={(e) => setBrandKit({ ...brandKit, font_family_title: e.target.value })}
              className="w-full bg-background border rounded-md p-2 text-sm"
            >
              {FONT_OPTIONS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase">Corpo</Label>
            <select 
              value={brandKit.font_family_body}
              onChange={(e) => setBrandKit({ ...brandKit, font_family_body: e.target.value })}
              className="w-full bg-background border rounded-md p-2 text-sm"
            >
              {FONT_OPTIONS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={() => onApply(brandKit)} variant="default" className="w-full gap-2">
          <Check className="h-4 w-4" /> Aplicar ao Carrossel
        </Button>
        <Button onClick={handleSave} variant="outline" disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar no Perfil"}
        </Button>
      </div>
    </div>
  );
}
