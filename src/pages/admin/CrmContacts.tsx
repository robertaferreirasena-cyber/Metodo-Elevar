import { useState } from 'react';
import { useCrmContacts, useCrmDeals, useCrmActivities } from '@/hooks/useCrmData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ContactDialog } from '@/components/crm/ContactDialog';
import { ContactDetails } from '@/components/crm/ContactDetails';
import { Plus, Search, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CrmContact } from '@/hooks/useCrmData';

export default function CrmContacts() {
  const { user } = useAuth();
  const { contacts, loading, create, update, remove } = useCrmContacts();
  const { deals } = useCrmDeals();
  const { activities } = useCrmActivities();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CrmContact | null>(null);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const handleSave = async (data: Partial<CrmContact>) => {
    if (editingContact) {
      const { error } = await update(editingContact.id, data);
      if (error) toast.error('Erro ao atualizar contato');
      else toast.success('Contato atualizado!');
    } else {
      const { error } = await create({ ...data, created_by: user!.id });
      if (error) toast.error('Erro ao criar contato');
      else toast.success('Contato criado!');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Contatos</h1>
        <Button size="sm" onClick={() => { setEditingContact(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum contato encontrado</TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => { setSelectedContact(c); setDetailsOpen(true); }}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.email || '-'}</TableCell>
                <TableCell>{c.phone || '-'}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{c.source}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {c.tags?.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    {(c.tags?.length || 0) > 2 && <Badge variant="secondary" className="text-[10px]">+{c.tags!.length - 2}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingContact(c); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                      const { error } = await remove(c.id);
                      if (error) toast.error('Erro ao excluir'); else toast.success('Contato excluído');
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ContactDialog open={dialogOpen} onOpenChange={setDialogOpen} contact={editingContact} onSave={handleSave} />
      <ContactDetails contact={selectedContact} deals={deals} activities={activities} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  );
}
