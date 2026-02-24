import { CrmContact, CrmDeal, CrmActivity } from '@/hooks/useCrmData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactDetailsProps {
  contact: CrmContact | null;
  deals: CrmDeal[];
  activities: CrmActivity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetails({ contact, deals, activities, open, onOpenChange }: ContactDetailsProps) {
  if (!contact) return null;

  const contactDeals = deals.filter(d => d.contact_id === contact.id);
  const contactActivities = activities.filter(a => a.contact_id === contact.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{contact.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="grid gap-2 text-sm">
            {contact.email && <p>📧 {contact.email}</p>}
            {contact.phone && <p>📱 {contact.phone}</p>}
            {contact.company && <p>🏢 {contact.company}</p>}
            <p>📍 Origem: {contact.source}</p>
            {contact.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {contact.tags.map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
              </div>
            )}
            {contact.notes && <p className="text-muted-foreground">{contact.notes}</p>}
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-semibold mb-2">Deals ({contactDeals.length})</h4>
            {contactDeals.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum deal associado</p>
            ) : (
              <div className="space-y-2">
                {contactDeals.map(deal => (
                  <div key={deal.id} className="p-2 rounded border border-border text-xs">
                    <p className="font-medium">{deal.title}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">R$ {Number(deal.value).toLocaleString('pt-BR')}</Badge>
                      <Badge variant={deal.status === 'won' ? 'default' : deal.status === 'lost' ? 'destructive' : 'outline'} className="text-[10px]">
                        {deal.status === 'won' ? 'Ganho' : deal.status === 'lost' ? 'Perdido' : 'Aberto'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-semibold mb-2">Atividades ({contactActivities.length})</h4>
            {contactActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma atividade registrada</p>
            ) : (
              <div className="space-y-2">
                {contactActivities.map(act => (
                  <div key={act.id} className="p-2 rounded border border-border text-xs">
                    <p className="font-medium">{act.title}</p>
                    <p className="text-muted-foreground">{format(new Date(act.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
