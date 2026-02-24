import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen-mobile flex w-full bg-background safe-area-all">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-12 sm:h-14 flex items-center border-b border-border px-3 sm:px-4 md:hidden safe-area-top">
            <SidebarTrigger className="touch-target" />
          </header>
          <div className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
