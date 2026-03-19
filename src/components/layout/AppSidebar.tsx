import { Home, Smartphone, BotMessageSquare, GraduationCap, Trophy, Brain, Lightbulb, Camera, MessageSquare, Heart, Clock, BookOpen, Download, LogOut, Settings, ChevronDown, DollarSign, Target, FileText, CheckCircle2, AlertCircle, Megaphone } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLogo } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CopyFormatsGlossary } from "@/components/CopyFormatsGlossary";
import { useState } from "react";

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "WhatsApp", url: "/whatsapp", icon: Smartphone },
  { title: "Mentora Gi", url: "/mentora-hub", icon: BotMessageSquare },
  { title: "Persona", url: "/persona", icon: Brain },
  { title: "Aprendizado", url: "/aprendizado", icon: GraduationCap },
  { title: "Conquistas", url: "/conquistas", icon: Trophy },
];

const financeItems = [
  { title: "Central Financeira", url: "/financeiro", icon: DollarSign },
  { title: "Metas Elevar", url: "/metas-elevar", icon: Target },
  { title: "Relatório Mensal", url: "/relatorio-financeiro", icon: FileText },
];

const moreItems = [
  { title: "Ideias", url: "/ideias", icon: Lightbulb },
  { title: "Ensaio Foto", url: "/ensaio-fotografico", icon: Camera },
  { title: "Comunidade", url: "/comunidade", icon: MessageSquare },
  { title: "Favoritos", url: "/favoritos", icon: Heart },
  { title: "Histórico", url: "/historico", icon: Clock },
  { title: "Instalar App", url: "/instalar", icon: Download },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile, subscription, signOut, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const { hasRaioX, hasProfile, loading: personaLoading } = usePersonaProfile();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  // Auto-open "Mais" if current path matches one of its items
  const isMoreActive = moreItems.some(item => isActive(item.url));

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
            <span className="font-semibold text-foreground text-xs">Mentoria Elevar</span>
            <span className="text-[10px] text-muted-foreground">Sua assistente de vendas</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {/* Main Navigation */}
        <SidebarGroup className="py-0.5 px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} size="sm">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-muted/50 flex items-center w-full py-1"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">{item.title}</span>
                      {item.title === "Persona" && !personaLoading && (
                        hasRaioX ? (
                          <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-green-500" />
                        ) : hasProfile ? (
                          <AlertCircle className="ml-auto h-3.5 w-3.5 text-yellow-500" />
                        ) : (
                          <AlertCircle className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
                        )
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financeiro Section */}
        <SidebarGroup className="py-0.5 px-2">
          <SidebarGroupLabel className="h-5 text-[10px] px-1">💰 Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {financeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} size="sm">
                    <NavLink
                      to={item.url}
                      className="hover:bg-muted/50 flex items-center w-full py-1"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* More - Collapsible */}
        <SidebarGroup className="py-0.5 px-2">
          <Collapsible open={moreOpen || isMoreActive} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="h-5 text-[10px] px-1 cursor-pointer flex items-center justify-between w-full">
                <span>📦 Mais</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${moreOpen || isMoreActive ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {moreItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} size="sm">
                        <NavLink
                          to={item.url}
                          className="hover:bg-muted/50 flex items-center w-full py-1"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <item.icon className="mr-2 h-3.5 w-3.5" />
                          <span className="text-xs">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {/* Glossário de Copy */}
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
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Admin Section */}
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
                  <SidebarMenuButton asChild isActive={isActive('/admin/aprendizado')} size="sm">
                    <NavLink to="/admin/aprendizado" className="hover:bg-muted/50 py-1" activeClassName="bg-muted text-primary font-medium">
                      <GraduationCap className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">Aprendizado</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
