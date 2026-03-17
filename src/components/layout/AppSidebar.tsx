import { Home, MessageCircle, Search, FileText, Users, Calendar, Layout, Heart, Clock, Lightbulb, LogOut, Brain, Download, MessageSquare, Settings, Camera, BookOpen, BarChart3, Contact, Kanban, ListTodo, Smartphone, MessagesSquare, Bot, CalendarDays, Sparkles, Calculator, Trophy, GraduationCap, BotMessageSquare } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLogo } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CopyFormatsGlossary } from "@/components/CopyFormatsGlossary";

const menuGroups = [
  {
    label: null,
    items: [
      { title: "Dashboard", url: "/", icon: Home },
    ],
  },
  {
    label: "💬 Privado",
    items: [
      { title: "Estratégias 1:1", url: "/privado/estrategias", icon: MessageCircle },
      { title: "Análise", url: "/privado/analise", icon: Search },
      { title: "Scripts", url: "/privado/scripts", icon: FileText },
    ],
  },
  {
    label: "👥 Grupo",
    items: [
      { title: "Conteúdo", url: "/grupo/conteudo", icon: Users },
      { title: "Sequências", url: "/grupo/sequencias", icon: Calendar },
      { title: "Templates", url: "/grupo/templates", icon: Layout },
    ],
  },
  {
    label: "📚 Biblioteca",
    items: [
      { title: "Favoritos", url: "/favoritos", icon: Heart },
      { title: "Histórico", url: "/historico", icon: Clock },
    ],
  },
  {
    label: "🛠️ Ferramentas",
    items: [
      { title: "Raio-X Persona", url: "/persona", icon: Brain },
      { title: "Ideias", url: "/ideias", icon: Lightbulb },
      { title: "Comunidade", url: "/comunidade", icon: MessageSquare },
      { title: "Ensaio Foto", url: "/ensaio-fotografico", icon: Camera, isNew: true },
      { title: "Calculadora", url: "/calculadora", icon: Calculator },
      { title: "Conquistas", url: "/conquistas", icon: Trophy, isNew: true },
      { title: "Aprendizado", url: "/aprendizado", icon: GraduationCap, isNew: true },
      { title: "Mentora Gi", url: "/mentora", icon: BotMessageSquare, isNew: true },
    ],
  },
  {
    label: "📚 Recursos",
    items: [
      { title: "Instalar App", url: "/instalar", icon: Download },
    ],
    hasGlossary: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile, subscription, signOut, loading } = useAuth();
  const { isAdmin } = useAdmin();

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao sair da conta');
    } else {
      toast.success('Até logo!');
    }
  };

  const getInitials = () => {
    if (!profile?.full_name) {
      return profile?.email?.substring(0, 2).toUpperCase() || 'US';
    }
    const names = profile.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const isPro = subscription?.plan === 'pro';

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shadow-md shadow-primary/20">
            <AppLogo size={32} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-xs">Estrategista IA</span>
            <span className="text-[10px] text-muted-foreground">Vendas & Marketing</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex} className="py-0.5 px-2">
            {group.label && <SidebarGroupLabel className="h-5 text-[10px] px-1">{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} size="sm">
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className="hover:bg-muted/50 flex items-center justify-between w-full py-1" 
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <div className="flex items-center">
                          <item.icon className="mr-2 h-3.5 w-3.5" />
                          <span className="text-xs">{item.title}</span>
                        </div>
                        {'isNew' in item && item.isNew && (
                          <Badge className="ml-1 bg-primary text-primary-foreground text-[8px] px-1 py-0 animate-pulse">
                            NOVO
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {/* Glossário de Copy - aparece no grupo Recursos */}
                {'hasGlossary' in group && group.hasGlossary && (
                  <SidebarMenuItem>
                    <CopyFormatsGlossary 
                      trigger={
                        <SidebarMenuButton size="sm" className="hover:bg-muted/50 py-1 cursor-pointer">
                          <BookOpen className="mr-2 h-3.5 w-3.5" />
                          <span className="text-xs">Glossário de Copy</span>
                        </SidebarMenuButton>
                      }
                    />
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <SidebarGroup className="py-0.5 px-2">
            <SidebarGroupLabel className="h-5 text-[10px] px-1">🔐 Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={currentPath === '/admin'} size="sm">
                    <NavLink to="/admin" className="hover:bg-muted/50 py-1" activeClassName="bg-muted text-primary font-medium">
                      <Settings className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">Painel Admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/whatsapp')} size="sm">
                    <NavLink to="/admin/whatsapp" className="hover:bg-muted/50 py-1" activeClassName="bg-muted text-primary font-medium">
                      <Smartphone className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">WhatsApp</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/whatsapp-chat')} size="sm">
                    <NavLink to="/admin/whatsapp-chat" className="hover:bg-muted/50 py-1" activeClassName="bg-muted text-primary font-medium">
                      <MessagesSquare className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">Chat</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/whatsapp-agents')} size="sm">
                    <NavLink to="/admin/whatsapp-agents" className="hover:bg-muted/50 py-1" activeClassName="bg-muted text-primary font-medium">
                      <Bot className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">Agentes IA</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/whatsapp-schedule')} size="sm">
                    <NavLink to="/admin/whatsapp-schedule" className="hover:bg-muted/50 py-1" activeClassName="bg-muted text-primary font-medium">
                      <CalendarDays className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">Agenda</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/whatsapp-analytics')} size="sm">
                    <NavLink to="/admin/whatsapp-analytics" className="hover:bg-muted/50 py-1" activeClassName="bg-muted text-primary font-medium">
                      <BarChart3 className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">Analytics</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/whatsapp-organizer')} size="sm">
                    <NavLink to="/admin/whatsapp-organizer" className="hover:bg-muted/50 flex items-center justify-between w-full py-1" activeClassName="bg-muted text-primary font-medium">
                      <div className="flex items-center">
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        <span className="text-xs">Organizador</span>
                      </div>
                      <Badge className="ml-1 bg-primary text-primary-foreground text-[8px] px-1 py-0 animate-pulse">
                        NOVO
                      </Badge>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/aprendizado')} size="sm">
                    <NavLink to="/admin/aprendizado" className="hover:bg-muted/50 flex items-center justify-between w-full py-1" activeClassName="bg-muted text-primary font-medium">
                      <div className="flex items-center">
                        <GraduationCap className="mr-2 h-3.5 w-3.5" />
                        <span className="text-xs">Aprendizado</span>
                      </div>
                      <Badge className="ml-1 bg-primary text-primary-foreground text-[8px] px-1 py-0 animate-pulse">
                        NOVO
                      </Badge>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {isAdmin && (
          <SidebarGroup className="py-0.5 px-2">
            <SidebarGroupLabel className="h-5 text-[10px] px-1">📊 CRM</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {[
                  { title: 'Dashboard', url: '/admin/crm', icon: BarChart3 },
                  { title: 'Contatos', url: '/admin/crm/contatos', icon: Contact },
                  { title: 'Pipeline', url: '/admin/crm/pipeline', icon: Kanban },
                  { title: 'Atividades', url: '/admin/crm/atividades', icon: ListTodo },
                ].map(item => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} size="sm">
                      <NavLink to={item.url} className="hover:bg-muted/50 py-1" activeClassName="bg-muted text-primary font-medium">
                        <item.icon className="mr-2 h-3.5 w-3.5" />
                        <span className="text-xs">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              <div className="h-2 w-12 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || ''} alt="User" />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                  {profile?.full_name || profile?.email?.split('@')[0] || 'Usuário'}
                </span>
                <div className="flex items-center gap-0.5">
                  <Badge 
                    variant={isPro ? "default" : "secondary"} 
                    className="text-[8px] px-1 py-0 w-fit"
                  >
                    {isPro ? 'Pro' : 'Free'}
                  </Badge>
                  {isAdmin && (
                    <Badge 
                      variant="outline" 
                      className="text-[8px] px-1 py-0 w-fit"
                    >
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
