import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrmDeal, CrmContact, CrmPipelineStage } from '@/hooks/useCrmData';

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: CrmDeal | null;
  contacts: CrmContact[];
  stages: CrmPipelineStage[];
  defaultStageId?: string;
  onSave: (data: Partial<CrmDeal>) => Promise<void>;
}

export function DealDialog({ open, onOpenChange, deal, contacts, stages, defaultStageId, onSave }: DealDialogProps) {
  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState('');
  const [stageId, setStageId] = useState('');
  const [value, setValue] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (deal) {
      setTitle(deal.title);
      setContactId(deal.contact_id);
      setStageId(deal.stage_id);
      setValue(String(deal.value || ''));
      setExpectedCloseDate(deal.expected_close_date || '');
      setPriority(deal.priority || 'medium');
      setNotes(deal.notes || '');
    } else {
      setTitle(''); setContactId(''); setValue(''); setExpectedCloseDate('');
      setPriority('medium'); setNotes('');
      setStageId(defaultStageId || stages[0]?.id || '');
    }
  }, [deal, open, stages, defaultStageId]);

  const handleSave = async () => {
    if (!title.trim() || !contactId || !stageId) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      contact_id: contactId,
      stage_id: stageId,
      value: parseFloat(value) || 0,
      expected_close_date: expectedCloseDate || null,
      priority,
      notes: notes.trim() || null,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{deal ? 'Editar Deal' : 'Novo Deal'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Identificação do Lead" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Etapa *</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Contato *</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Observação</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observação" rows={2} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Valor (R$)</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} /></div>
            <div><Label>Previsão de fechamento</Label><Input type="date" value={expectedCloseDate} onChange={e => setExpectedCloseDate(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || !contactId}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
