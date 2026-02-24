import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Users, User, MessageSquare, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { LeadTagBadge, type LeadTag, getTagConfig } from "./LeadTagBadge";

export interface ChatItem {
  id: string;
  name: string;
  phone: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  profilePic?: string;
  isGroup?: boolean;
}

type FilterTab = 'all' | 'contacts' | 'groups';
type TagFilter = 'all' | LeadTag;

interface ChatListProps {
  chats: ChatItem[];
  selectedChat: string | null;
  onSelectChat: (phone: string) => void;
  loading?: boolean;
  contactTags?: Record<string, LeadTag>;
  instanceId?: string;
  onTagChange?: (phone: string, newTag: LeadTag) => void;
}

export function ChatList({ chats, selectedChat, onSelectChat, loading, contactTags, instanceId, onTagChange }: ChatListProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>('all');
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');

  const filtered = useMemo(() => {
    let list = chats;
    if (tab === 'contacts') list = list.filter(c => !c.isGroup);
    if (tab === 'groups') list = list.filter(c => c.isGroup);
    if (tagFilter !== 'all' && contactTags) {
      list = list.filter(c => (contactTags[c.phone] || 'novo') === tagFilter);
    }
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [chats, search, tab, tagFilter, contactTags]);

  const formatTime = (t?: string) => {
    if (!t) return '';
    try { return format(new Date(t), 'HH:mm'); } catch { return ''; }
  };

  const tabs: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Todos', icon: <MessageSquare className="h-3 w-3" /> },
    { key: 'contacts', label: 'Contatos', icon: <User className="h-3 w-3" /> },
    { key: 'groups', label: 'Grupos', icon: <Users className="h-3 w-3" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors",
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value as TagFilter)}
            className="h-6 text-[10px] bg-muted border-none rounded px-1.5 text-muted-foreground cursor-pointer"
          >
            <option value="all">🏷️ Todos</option>
            <option value="novo">⚪ Novo</option>
            <option value="frio">🔵 Frio</option>
            <option value="morno">🟡 Morno</option>
            <option value="quente">🟠 Quente</option>
            <option value="cliente">🟢 Cliente</option>
          </select>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa</p>
        ) : (
          filtered.map(chat => (
            <button
              key={chat.phone}
              onClick={() => onSelectChat(chat.phone)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50",
                selectedChat === chat.phone && "bg-muted"
              )}
            >
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden relative">
                {chat.profilePic ? (
                  <img src={chat.profilePic} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-medium text-primary">
                    {chat.isGroup ? <Users className="h-4 w-4" /> : chat.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium truncate flex items-center gap-1">
                    {chat.isGroup && <Users className="h-3 w-3 text-muted-foreground inline shrink-0" />}
                    {chat.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {!chat.isGroup && instanceId && (
                      <LeadTagBadge
                        tag={(contactTags?.[chat.phone] as LeadTag) || 'novo'}
                        instanceId={instanceId}
                        contactPhone={chat.phone}
                        onTagChange={onTagChange}
                        compact
                      />
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {chat.lastMessage || chat.phone}
                </p>
              </div>
              {chat.unreadCount && chat.unreadCount > 0 && (
                <span className="h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center px-1">
                  {chat.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
