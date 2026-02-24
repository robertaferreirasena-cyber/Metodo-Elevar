import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrmActivity, CrmContact, CrmDeal } from '@/hooks/useCrmData';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: CrmContact[];
  deals: CrmDeal[];
  defaultContactId?: string;
  defaultDealId?: string;
  onSave: (data: Partial<CrmActivity>) => Promise<void>;
}

const activityTypes = [
  { value: 'note', label: '📝 Nota' },
  { value: 'call', label: '📞 Ligação' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'email', label: '📧 Email' },
  { value: 'meeting', label: '🤝 Reunião' },
  { value: 'task', label: '✅ Tarefa' },
];

export function ActivityDialog({ open, onOpenChange, contacts, deals, defaultContactId, defaultDealId, onSave }: ActivityDialogProps) {
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactId, setContactId] = useState('');
  const [dealId, setDealId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setType('note'); setTitle(''); setDescription(''); setDueDate('');
    setContactId(defaultContactId || '');
    setDealId(defaultDealId || '');
  }, [open, defaultContactId, defaultDealId]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      type,
      title: title.trim(),
      description: description.trim() || null,
      contact_id: contactId || null,
      deal_id: dealId || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {activityTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Contato</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deal</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  {deals.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {type === 'task' && (
            <div><Label>Data limite</Label><Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          )}
          <div><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
