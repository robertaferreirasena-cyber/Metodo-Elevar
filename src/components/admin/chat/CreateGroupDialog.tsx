import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, participants: string[]) => Promise<void>;
}

export function CreateGroupDialog({ open, onClose, onCreateGroup }: CreateGroupDialogProps) {
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !participants.trim()) return;
    setCreating(true);
    try {
      const nums = participants
        .split(/[,;\n]+/)
        .map(n => n.trim().replace(/\D/g, ''))
        .filter(Boolean)
        .map(n => n.includes('@') ? n : `${n}@s.whatsapp.net`);
      await onCreateGroup(name.trim(), nums);
      setName("");
      setParticipants("");
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Grupo WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Grupo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Promoções VIP" />
          </div>
          <div className="space-y-2">
            <Label>Participantes (números)</Label>
            <Textarea
              value={participants}
              onChange={e => setParticipants(e.target.value)}
              placeholder={"5511999999999\n5511888888888\nOu separados por vírgula"}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Insira os números com DDD+DDI, um por linha ou separados por vírgula</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || !participants.trim() || creating}>
            {creating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Criar Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
