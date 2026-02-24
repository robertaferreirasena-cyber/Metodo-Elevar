import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LeadTag = 'novo' | 'frio' | 'morno' | 'quente' | 'cliente';

interface TagOption {
  value: LeadTag;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
}

const TAG_OPTIONS: TagOption[] = [
  { value: 'novo', label: 'Novo', color: '#94a3b8', bgClass: 'bg-muted', textClass: 'text-muted-foreground' },
  { value: 'frio', label: 'Frio', color: '#3b82f6', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400' },
  { value: 'morno', label: 'Morno', color: '#eab308', bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-400' },
  { value: 'quente', label: 'Quente', color: '#f97316', bgClass: 'bg-orange-500/20', textClass: 'text-orange-400' },
  { value: 'cliente', label: 'Cliente', color: '#22c55e', bgClass: 'bg-green-500/20', textClass: 'text-green-400' },
];

export function getTagConfig(tag: LeadTag): TagOption {
  return TAG_OPTIONS.find(t => t.value === tag) || TAG_OPTIONS[0];
}

interface LeadTagBadgeProps {
  tag: LeadTag;
  instanceId: string;
  contactPhone: string;
  onTagChange?: (phone: string, newTag: LeadTag) => void;
  compact?: boolean;
}

export function LeadTagBadge({ tag, instanceId, contactPhone, onTagChange, compact }: LeadTagBadgeProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const config = getTagConfig(tag);

  const handleSelect = async (newTag: LeadTag) => {
    if (newTag === tag) { setOpen(false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('whatsapp_contact_tags' as any).upsert(
        { instance_id: instanceId, contact_phone: contactPhone, tag: newTag },
        { onConflict: 'instance_id,contact_phone' }
      );
      if (error) throw error;
      onTagChange?.(contactPhone, newTag);
      setOpen(false);
    } catch {
      toast.error('Erro ao salvar etiqueta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center rounded-full font-medium transition-all hover:ring-2 hover:ring-ring/30 shrink-0",
            config.bgClass, config.textClass,
            compact ? "text-[9px] px-1.5 py-0 h-4" : "text-[10px] px-2 py-0.5"
          )}
          onClick={e => e.stopPropagation()}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: config.color }} />
          {config.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="start" onClick={e => e.stopPropagation()}>
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground px-2 py-1">Temperatura</p>
          {TAG_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:bg-muted",
                tag === opt.value && "bg-muted font-medium"
              )}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
