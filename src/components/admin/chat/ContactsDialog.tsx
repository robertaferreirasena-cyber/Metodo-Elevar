import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  profilePic?: string;
}

interface ContactsDialogProps {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
  loading: boolean;
  onSelectContact: (phone: string, name: string) => void;
}

export function ContactsDialog({ open, onClose, contacts, loading, onSelectContact }: ContactsDialogProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [contacts, search]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum contato encontrado</p>
          ) : (
            filtered.map(contact => (
              <button
                key={contact.id}
                onClick={() => { onSelectContact(contact.phone, contact.name); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors rounded-md"
              >
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  {contact.profilePic ? (
                    <img src={contact.profilePic} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.phone}</p>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
