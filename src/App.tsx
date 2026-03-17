import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModuleGuard } from "@/components/auth/ModuleGuard";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "sonner";

// Pages
import Dashboard from "./pages/Dashboard";
import PrivateMode from "./pages/PrivateMode";
import GroupMode from "./pages/GroupMode";
import StrategyGenerator from "./pages/StrategyGenerator";
import ConversationAnalysis from "./pages/ConversationAnalysis";
import WhatsAppStrategies from "./pages/WhatsAppStrategies";
import GroupContent from "./pages/GroupContent";
import GroupSequences from "./pages/GroupSequences";
import GroupTemplates from "./pages/GroupTemplates";
import IdeasGenerator from "./pages/IdeasGenerator";
import PersonaRaioX from "./pages/PersonaRaioX";
import Favorites from "./pages/Favorites";
import History from "./pages/History";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import Community from "./pages/Community";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminPayments from "./pages/AdminPayments";
import AdminTokens from "./pages/AdminTokens";
import CrmDashboard from "./pages/admin/CrmDashboard";
import CrmContacts from "./pages/admin/CrmContacts";
import CrmPipeline from "./pages/admin/CrmPipeline";
import CrmActivities from "./pages/admin/CrmActivities";
import WhatsAppInstances from "./pages/admin/WhatsAppInstances";
import WhatsAppChat from "./pages/admin/WhatsAppChat";
import WhatsAppAgents from "./pages/admin/WhatsAppAgents";
import WhatsAppSchedule from "./pages/admin/WhatsAppSchedule";
import WhatsAppAnalytics from "./pages/admin/WhatsAppAnalytics";
import WhatsAppOrganizer from "./pages/admin/WhatsAppOrganizer";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import AccessBlocked from "./pages/AccessBlocked";
import PhotoBoss from "./pages/PhotoBoss";
import AdminCredentials from "./pages/AdminCredentials";
import PriceCalculator from "./pages/PriceCalculator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      
      // Prevent the default browser error handling
      event.preventDefault();
      
      // Only show toast for non-network errors to avoid spam
      const errorMessage = event.reason?.message || String(event.reason);
      if (!errorMessage.includes("Failed to fetch") && !errorMessage.includes("NetworkError")) {
        toast.error("Ocorreu um erro. Por favor, tente novamente.");
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
      
      // Prevent the default browser error handling
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <GlobalErrorHandler>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            {/* Auth routes - no layout */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/assinatura-expirada" element={<SubscriptionExpired />} />
              <Route path="/acesso-bloqueado" element={<AccessBlocked />} />
              
              {/* Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Private Mode Routes */}
              <Route
                path="/privado"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_private">
                      <AppLayout>
                        <PrivateMode />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/privado/estrategias"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_private">
                      <AppLayout>
                        <StrategyGenerator />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/privado/analise"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_conversation_analysis">
                      <AppLayout>
                        <ConversationAnalysis />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/privado/scripts"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_private">
                      <AppLayout>
                        <WhatsAppStrategies />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Group Mode Routes */}
              <Route
                path="/grupo"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_group">
                      <AppLayout>
                        <GroupMode />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grupo/conteudo"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_group">
                      <AppLayout>
                        <GroupContent />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grupo/sequencias"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_sequences">
                      <AppLayout>
                        <GroupSequences />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grupo/templates"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_group">
                      <AppLayout>
                        <GroupTemplates />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Library Routes */}
              <Route
                path="/favoritos"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_favorites">
                      <AppLayout>
                        <Favorites />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historico"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_history">
                      <AppLayout>
                        <History />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Ideas */}
              <Route
                path="/ideias"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_ideas">
                      <AppLayout>
                        <IdeasGenerator />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Persona Raio-X */}
              <Route
                path="/persona"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_persona">
                      <AppLayout>
                        <PersonaRaioX />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Community */}
              <Route
                path="/comunidade"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_community">
                      <AppLayout>
                        <Community />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AppLayout>
                        <Admin />
                      </AppLayout>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AppLayout>
                        <AdminUsers />
                      </AppLayout>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pagamentos"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AppLayout>
                        <AdminPayments />
                      </AppLayout>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tokens"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AppLayout>
                        <AdminTokens />
                      </AppLayout>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              {/* CRM Admin Routes */}
              <Route path="/admin/crm" element={<ProtectedRoute><AdminRoute><AppLayout><CrmDashboard /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/crm/contatos" element={<ProtectedRoute><AdminRoute><AppLayout><CrmContacts /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/crm/pipeline" element={<ProtectedRoute><AdminRoute><AppLayout><CrmPipeline /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/crm/atividades" element={<ProtectedRoute><AdminRoute><AppLayout><CrmActivities /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/whatsapp" element={<ProtectedRoute><AdminRoute><AppLayout><WhatsAppInstances /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/whatsapp-chat" element={<ProtectedRoute><AdminRoute><AppLayout><WhatsAppChat /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/whatsapp-agents" element={<ProtectedRoute><AdminRoute><AppLayout><WhatsAppAgents /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/whatsapp-schedule" element={<ProtectedRoute><AdminRoute><AppLayout><WhatsAppSchedule /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/whatsapp-analytics" element={<ProtectedRoute><AdminRoute><AppLayout><WhatsAppAnalytics /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/whatsapp-organizer" element={<ProtectedRoute><AdminRoute><AppLayout><WhatsAppOrganizer /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/admin-credentials" element={<ProtectedRoute><AdminRoute><AppLayout><AdminCredentials /></AppLayout></AdminRoute></ProtectedRoute>} />

              {/* Legacy redirects */}
              <Route path="/estrategias" element={<Navigate to="/privado/estrategias" replace />} />
              <Route path="/analise" element={<Navigate to="/privado/analise" replace />} />
              <Route path="/whatsapp" element={<Navigate to="/privado/scripts" replace />} />

              {/* Install Page - no layout needed */}
              <Route path="/instalar" element={<Install />} />

              {/* PhotoBoss - Ensaio Fotográfico */}
              <Route
                path="/ensaio-fotografico"
                element={
                  <ProtectedRoute>
                    <ModuleGuard module="module_photoboss">
                      <AppLayout>
                        <PhotoBoss />
                      </AppLayout>
                    </ModuleGuard>
                  </ProtectedRoute>
                }
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </GlobalErrorHandler>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
