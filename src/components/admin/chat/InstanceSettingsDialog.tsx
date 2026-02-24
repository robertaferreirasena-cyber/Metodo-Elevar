import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Settings } from "lucide-react";

interface InstanceSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: string, extraData?: Record<string, unknown>) => Promise<unknown>;
}

export function InstanceSettingsDialog({ open, onClose, onAction }: InstanceSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileStatus, setProfileStatus] = useState("");

  const loadInfo = async () => {
    setLoading(true);
    try {
      const data = await onAction('status') as Record<string, unknown>;
      setInfo(data);
    } catch {
      toast.error('Erro ao carregar info');
    } finally {
      setLoading(false);
    }
  };

  const handleSetName = async () => {
    if (!profileName.trim()) return;
    setLoading(true);
    try {
      await onAction('setProfileName', { name: profileName });
      toast.success('Nome atualizado!');
      setProfileName("");
    } catch {
      toast.error('Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleSetStatus = async () => {
    if (!profileStatus.trim()) return;
    setLoading(true);
    try {
      await onAction('setProfileStatus', { status: profileStatus });
      toast.success('Status atualizado!');
      setProfileStatus("");
    } catch {
      toast.error('Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" /> Configurações da Instância
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={loadInfo} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
            Carregar Info da Instância
          </Button>

          {info && (
            <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(info, null, 2)}</pre>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Nome do Perfil</Label>
            <div className="flex gap-2">
              <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Novo nome..." className="h-8 text-xs" />
              <Button size="sm" className="h-8 text-xs" onClick={handleSetName} disabled={loading}>Salvar</Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status / Recado</Label>
            <div className="flex gap-2">
              <Input value={profileStatus} onChange={e => setProfileStatus(e.target.value)} placeholder="Novo status..." className="h-8 text-xs" />
              <Button size="sm" className="h-8 text-xs" onClick={handleSetStatus} disabled={loading}>Salvar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
