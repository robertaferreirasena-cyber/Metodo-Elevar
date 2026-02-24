import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Ban, ShieldCheck, Phone, Users, Link2, Loader2, Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContactDetailPanelProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  isGroup: boolean;
  profilePic?: string;
  onAction: (action: string, extraData?: Record<string, unknown>) => Promise<unknown>;
}

export function ContactDetailPanel({ open, onClose, chatId, chatName, isGroup, profilePic, onAction }: ContactDetailPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<Record<string, unknown>>>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  if (!open) return null;

  const doAction = async (actionName: string, extra?: Record<string, unknown>) => {
    setLoading(actionName);
    try {
      return await onAction(actionName, extra);
    } catch {
      toast.error(`Erro: ${actionName}`);
    } finally {
      setLoading(null);
    }
  };

  // Load group members from /group/list (already includes Participants)
  const loadMembers = async () => {
    const data = await doAction('getGroups') as unknown;
    const res = data as Record<string, unknown>;
    const groups = (res?.groups as Array<Record<string, unknown>>) || (Array.isArray(data) ? data as Array<Record<string, unknown>> : []);
    const group = groups.find(g => (g.JID as string) === chatId);
    if (group && Array.isArray(group.Participants)) {
      setMembers(group.Participants as Array<Record<string, unknown>>);
    } else {
      toast.info('Grupo não encontrado ou sem membros');
    }
  };

  const handleCheckNumber = async () => {
    const r = await doAction('checkNumber', { phone: chatId });
    const res = Array.isArray(r) ? r[0] as Record<string, unknown> : r as Record<string, unknown>;
    toast.info(res?.isInWhatsapp ? 'Número tem WhatsApp ✅' : 'Número NÃO tem WhatsApp ❌');
  };

  const handleBlock = () => doAction('blockContact', { phone: chatId }).then(() => toast.success('Contato bloqueado'));

  const handleInviteLink = async () => {
    const r = await doAction('getGroupInviteLink', { groupId: chatId });
    const res = r as Record<string, unknown>;
    const link = (res?.link as string) || (res?.inviteLink as string) || '';
    setInviteLink(link);
    if (link) { navigator.clipboard.writeText(link); toast.success('Link copiado!'); }
  };

  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold">{isGroup ? 'Detalhes do Grupo' : 'Detalhes do Contato'}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3 w-3" /></Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-3 space-y-3">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-2 pb-3 border-b border-border">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {profilePic ? (
              <img src={profilePic} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary">{chatName.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <p className="text-sm font-semibold">{chatName}</p>
          <p className="text-[10px] text-muted-foreground">{chatId}</p>
        </div>

        {/* Actions */}
        <div className="space-y-2 py-3">
          {!isGroup && (
            <>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs justify-start" onClick={handleCheckNumber} disabled={!!loading}>
                {loading === 'checkNumber' ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <ShieldCheck className="h-3 w-3 mr-2" />}
                Verificar Número
              </Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs justify-start" onClick={handleBlock} disabled={!!loading}>
                {loading === 'blockContact' ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Ban className="h-3 w-3 mr-2" />}
                Bloquear
              </Button>
            </>
          )}

          {isGroup && (
            <>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs justify-start" onClick={loadMembers} disabled={!!loading}>
                {loading === 'getGroups' ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Users className="h-3 w-3 mr-2" />}
                Carregar Membros
              </Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs justify-start" onClick={handleInviteLink} disabled={!!loading}>
                {loading === 'getGroupInviteLink' ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Link2 className="h-3 w-3 mr-2" />}
                Link de Convite
              </Button>
              {inviteLink && <p className="text-[10px] text-primary break-all">{inviteLink}</p>}

              {/* Members list */}
              {members.length > 0 && (
                <div className="pt-2 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {members.length} membros
                  </p>
                  {members.map((m, i) => {
                    const jid = (m.JID as string) || (m.LID as string) || String(i);
                    const phone = (m.PhoneNumber as string) || jid;
                    const isAdmin = (m.IsAdmin as boolean) || false;
                    const isSuperAdmin = (m.IsSuperAdmin as boolean) || false;
                    return (
                      <div key={jid} className="flex items-center gap-1 text-[10px] py-0.5">
                        <span className="flex-1 truncate">{phone.replace('@s.whatsapp.net', '')}</span>
                        {isSuperAdmin && <span title="Super Admin"><Crown className="h-3 w-3 text-accent shrink-0" /></span>}
                        {isAdmin && !isSuperAdmin && <span title="Admin"><Crown className="h-3 w-3 text-muted-foreground shrink-0" /></span>}
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-[9px] text-muted-foreground italic pt-2">
                Gerenciamento de participantes (adicionar/remover/promover) não disponível na API v2.
              </p>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
