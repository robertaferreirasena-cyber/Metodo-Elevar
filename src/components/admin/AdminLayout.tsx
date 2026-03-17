import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, CreditCard, Cpu, Shield, GraduationCap, Brain } from 'lucide-react';

const adminTabs = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/usuarios', label: 'Usuários', icon: Users },
  { path: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { path: '/admin/tokens', label: 'Tokens', icon: Cpu },
  { path: '/admin/credenciais', label: 'Credenciais', icon: Shield },
  { path: '/admin/aprendizado', label: 'Aprendizado', icon: GraduationCap },
  { path: '/admin/base-conhecimento', label: 'Base IA', icon: Brain },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-border">
        {adminTabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
