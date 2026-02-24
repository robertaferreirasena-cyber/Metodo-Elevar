import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, subscription, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admins have full access without subscription checks
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check if subscription is expired (only for routes that need it)
  // Skip check for /assinatura-expirada and /instalar routes
  const skipExpirationCheck = ['/assinatura-expirada', '/instalar'].includes(location.pathname);
  
  if (!skipExpirationCheck) {
    // No subscription at all = redirect to expired page
    if (!subscription) {
      return <Navigate to="/assinatura-expirada" replace />;
    }
    
    // Subscription exists - check if it's active
    // If status is 'active', user has access regardless of expires_at
    if (subscription.status !== 'active') {
      return <Navigate to="/assinatura-expirada" replace />;
    }
    
    // Only check expiration date if status is active AND expires_at exists
    // This handles cases where expires_at might be set but subscription is still considered active
    if (subscription.expires_at) {
      const isExpired = new Date(subscription.expires_at) < new Date();
      if (isExpired) {
        return <Navigate to="/assinatura-expirada" replace />;
      }
    }
  }

  return <>{children}</>;
}
