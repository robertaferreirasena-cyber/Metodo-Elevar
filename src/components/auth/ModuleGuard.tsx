import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions, ROUTE_MODULE_MAP, ModuleKey } from '@/hooks/usePermissions';

interface ModuleGuardProps {
  children: ReactNode;
  module?: ModuleKey;
}

export function ModuleGuard({ children, module }: ModuleGuardProps) {
  const location = useLocation();
  const { hasModuleAccess, loading, isAdmin } = usePermissions();

  // Determine which module to check
  const requiredModule = module || ROUTE_MODULE_MAP[location.pathname];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Admins bypass all permission checks
  if (isAdmin) {
    return <>{children}</>;
  }

  // If no module mapping exists, allow access (default behavior)
  if (!requiredModule) {
    return <>{children}</>;
  }

  // Check if user has access to the required module
  if (!hasModuleAccess(requiredModule)) {
    return <Navigate to="/acesso-bloqueado" state={{ from: location, module: requiredModule }} replace />;
  }

  return <>{children}</>;
}
