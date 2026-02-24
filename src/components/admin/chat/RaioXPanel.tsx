import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RaioXPanelProps {
  open: boolean;
  onClose: () => void;
}

export function RaioXPanel({ open, onClose }: RaioXPanelProps) {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase.from('persona_profiles').select('*').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          setProfile(data as Record<string, unknown> | null);
          setLoading(false);
        });
    });
  }, [open]);

  if (!open) return null;

  const raioX = profile?.generated_raio_x as Record<string, unknown> | null;

  const fields: { label: string; key: string }[] = [
    { label: 'Nicho', key: 'niche' },
    { label: 'Sub-nicho', key: 'sub_niche' },
    { label: 'Negócio', key: 'business_name' },
    { label: 'Produto', key: 'product_description' },
    { label: 'Dor principal', key: 'main_pain' },
    { label: 'Diferencial', key: 'main_differentiator' },
    { label: 'Transformação', key: 'transformation' },
    { label: 'Objeções', key: 'common_objections' },
    { label: 'Faixa de preço', key: 'price_range' },
    { label: 'Público-alvo', key: 'target_profession' },
  ];

  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold">🎯 Raio-X da Persona</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3 w-3" /></Button>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : !profile ? (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhum Raio-X encontrado. Preencha o diagnóstico na página Raio-X.</p>
        ) : (
          <div className="space-y-2">
            {fields.map(f => {
              const val = (profile?.[f.key] as string) || '';
              if (!val) return null;
              return (
                <div key={f.key}>
                  <p className="text-[10px] font-bold text-primary uppercase">{f.label}</p>
                  <p className="text-[11px] text-foreground">{val}</p>
                </div>
              );
            })}
            {raioX && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] font-bold text-primary uppercase mb-1">Diagnóstico IA</p>
                <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-60 whitespace-pre-wrap">{typeof raioX === 'string' ? raioX : JSON.stringify(raioX, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
