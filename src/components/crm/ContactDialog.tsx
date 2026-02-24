import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrmContact } from '@/hooks/useCrmData';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: CrmContact | null;
  onSave: (data: Partial<CrmContact>) => Promise<void>;
}

const sources = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'kiwify', label: 'Kiwify' },
  { value: 'outro', label: 'Outro' },
];

export function ContactDialog({ open, onOpenChange, contact, onSave }: ContactDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('outro');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
      setCompany(contact.company || '');
      setSource(contact.source || 'outro');
      setNotes(contact.notes || '');
      setTags(contact.tags?.join(', ') || '');
    } else {
      setName(''); setEmail(''); setPhone(''); setCompany('');
      setSource('outro'); setNotes(''); setTags('');
    }
  }, [contact, open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      company: company.trim() || null,
      source,
      notes: notes.trim() || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Empresa</Label><Input value={company} onChange={e => setCompany(e.target.value)} /></div>
            <div>
              <Label>Origem</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sources.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Tags (separadas por vírgula)</Label><Input value={tags} onChange={e => setTags(e.target.value)} placeholder="lead, vip, quente" /></div>
          <div><Label>Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
