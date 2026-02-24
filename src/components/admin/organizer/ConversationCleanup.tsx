import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { callUazapi } from "@/pages/admin/WhatsAppOrganizer";
import { Trash2, Archive, CheckSquare, ToggleLeft, Search, Loader2, MessageSquare } from "lucide-react";

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime?: string;
  isGroup: boolean;
  timestamp: number;
}

interface Props {
  token: string;
}

type DateFilter = 'all' | '24h' | '7d' | '30d' | '90d' | '1y';
type TypeFilter = 'all' | 'contacts' | 'groups';

export function ConversationCleanup({ token }: Props) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadChats();
  }, [token]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const data = await callUazapi('getChats', token);
      const rawChats = Array.isArray(data) ? data : ((data as any)?.chats || []);
      const mapped: ChatItem[] = rawChats.map((c: any) => ({
        id: c.wa_chatid || c.phone || c.id || '',
        name: c.wa_name || c.name || c.wa_contactName || c.wa_chatid || '',
        lastMessage: c.wa_lastMessage || c.lastMessage || '',
        lastMessageTime: c.wa_lastMsgTimestamp ? new Date(c.wa_lastMsgTimestamp * 1000).toISOString() : undefined,
        isGroup: c.wa_isGroup || c.isGroup || false,
        timestamp: c.wa_lastMsgTimestamp || 0,
      }));
      setChats(mapped.sort((a, b) => b.timestamp - a.timestamp));
    } catch { toast.error('Erro ao buscar conversas'); }
    finally { setLoading(false); }
  };

  const getDateThreshold = (filter: DateFilter): number => {
    const now = Date.now() / 1000;
    const day = 86400;
    switch (filter) {
      case '24h': return now - day;
      case '7d': return now - 7 * day;
      case '30d': return now - 30 * day;
      case '90d': return now - 90 * day;
      case '1y': return now - 365 * day;
      default: return 0;
    }
  };

  const filteredChats = chats.filter(c => {
    if (typeFilter === 'contacts' && c.isGroup) return false;
    if (typeFilter === 'groups' && !c.isGroup) return false;
    if (dateFilter !== 'all') {
      const threshold = getDateThreshold(dateFilter);
      if (c.timestamp > threshold) return false; // show only OLDER than threshold
    }
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filteredChats.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredChats.map(c => c.id)));
    }
  };

  const invertSelection = () => {
    const inverted = new Set(filteredChats.filter(c => !selected.has(c.id)).map(c => c.id));
    setSelected(inverted);
  };

  const executeBulkAction = async (action: 'deleteChat' | 'archiveChat') => {
    if (selected.size === 0) return;
    setProcessing(true);
    let success = 0, fail = 0;
    for (const chatId of selected) {
      try {
        await callUazapi(action, token, { chatId });
        success++;
      } catch { fail++; }
    }
    toast.success(`${action === 'deleteChat' ? 'Apagadas' : 'Arquivadas'}: ${success} | Erros: ${fail}`);
    setSelected(new Set());
    setProcessing(false);
    loadChats();
  };

  const formatDate = (ts: number) => {
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 86400000;
    if (diff < 1) return 'Hoje';
    if (diff < 2) return 'Ontem';
    if (diff < 7) return `${Math.floor(diff)} dias atrás`;
    return d.toLocaleDateString('pt-BR');
  };

  if (loading) return <div className="space-y-2 mt-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>;

  return (
    <div className="space-y-4 mt-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar conversa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={dateFilter} onValueChange={v => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                <SelectItem value="24h">+24 horas</SelectItem>
                <SelectItem value="7d">+7 dias</SelectItem>
                <SelectItem value="30d">+30 dias</SelectItem>
                <SelectItem value="90d">+90 dias</SelectItem>
                <SelectItem value="1y">+1 ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={v => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="contacts">Contatos</SelectItem>
                <SelectItem value="groups">Grupos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 items-center mt-3">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              {selected.size === filteredChats.length ? 'Desmarcar' : 'Selecionar'} Todos
            </Button>
            <Button variant="outline" size="sm" onClick={invertSelection}>
              <ToggleLeft className="h-3.5 w-3.5 mr-1" /> Inverter
            </Button>

            {selected.size > 0 && (
              <>
                <Badge variant="secondary">{selected.size} selecionada(s)</Badge>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={processing}>
                      {processing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                      Apagar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar {selected.size} conversa(s)?</AlertDialogTitle>
                      <AlertDialogDescription>Essa ação não pode ser desfeita. As conversas serão removidas do WhatsApp.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => executeBulkAction('deleteChat')}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline" size="sm" disabled={processing} onClick={() => executeBulkAction('archiveChat')}>
                  {processing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Archive className="h-3.5 w-3.5 mr-1" />}
                  Arquivar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{filteredChats.length} conversas encontradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {filteredChats.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma conversa encontrada</p>
            ) : (
              filteredChats.map(chat => (
                <div key={chat.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <Checkbox checked={selected.has(chat.id)} onCheckedChange={() => toggleSelect(chat.id)} />
                  <MessageSquare className={`h-4 w-4 shrink-0 ${chat.isGroup ? 'text-green-500' : 'text-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{chat.name}</span>
                      {chat.isGroup && <Badge variant="outline" className="text-[10px] px-1 py-0">Grupo</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || '—'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(chat.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
