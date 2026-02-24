import { useState, useEffect } from "react";
import { Download, Share, Smartphone, Monitor, Apple, ArrowLeft, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const PlatformIcon = platform === "ios" ? Apple : platform === "android" ? Smartphone : Monitor;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-foreground">Instalar App</h1>
      </header>

      <div className="flex-1 p-4 sm:p-6 max-w-lg mx-auto w-full space-y-6">
        {/* App Preview - iPhone Style */}
        <div className="text-center space-y-4">
          <div className="mx-auto relative">
            {/* iPhone Frame */}
            <div className="relative mx-auto w-48 h-96 rounded-[3rem] bg-gradient-to-br from-gray-800 to-gray-900 p-2 shadow-2xl">
              {/* Screen */}
              <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-background to-muted overflow-hidden border-4 border-gray-700">
                {/* Notch */}
                <div className="flex justify-center pt-2">
                  <div className="w-20 h-6 bg-gray-900 rounded-full" />
                </div>
                {/* Content */}
                <div className="flex flex-col items-center justify-center h-[calc(100%-3rem)] space-y-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-primary/40">
                    <AppLogo size={80} />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-semibold text-foreground">Estrategista IA</p>
                    <p className="text-xs text-muted-foreground">Vendas WhatsApp</p>
                  </div>
                </div>
                {/* Home Indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/20 rounded-full" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Estrategista IA</h2>
            <p className="text-sm text-muted-foreground">Vendas WhatsApp com IA</p>
          </div>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <PlatformIcon className="h-3 w-3" />
              {platform === "ios" ? "iOS" : platform === "android" ? "Android" : "Desktop"}
            </Badge>
            {isInstalled && (
              <Badge className="gap-1 bg-green-500/20 text-green-500 border-green-500/30">
                <Check className="h-3 w-3" />
                Instalado
              </Badge>
            )}
          </div>
        </div>

        {/* Installation Card */}
        {isInstalled ? (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">App Instalado!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  O Estrategista IA está na sua tela inicial
                </p>
              </div>
              <Button onClick={() => navigate("/")} className="w-full">
                Voltar para o App
              </Button>
            </CardContent>
          </Card>
        ) : platform === "ios" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                Como instalar no iPhone/iPad
              </CardTitle>
              <CardDescription>
                No iOS, siga estas etapas para adicionar à tela inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Toque no botão Compartilhar</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Share className="h-4 w-4" /> na barra inferior do Safari
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Role para baixo e toque em</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Plus className="h-4 w-4" /> "Adicionar à Tela de Início"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Confirme tocando em "Adicionar"</p>
                    <p className="text-sm text-muted-foreground">
                      O app aparecerá na sua tela inicial
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  💡 Dica: Após instalar, você pode acessar o app sem precisar abrir o Safari
                </p>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Download className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Pronto para instalar!</h3>
                <p className="text-sm text-muted-foreground">
                  Instale o app na sua tela inicial para acesso rápido
                </p>
              </div>
              <Button onClick={handleInstallClick} className="w-full gradient-primary glow-pink" size="lg">
                <Download className="h-5 w-5 mr-2" />
                Instalar Agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Como instalar
              </CardTitle>
              <CardDescription>
                Adicione o app à sua tela inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Abra o menu do navegador</p>
                    <p className="text-sm text-muted-foreground">
                      Toque nos 3 pontos (⋮) no canto superior direito
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Toque em "Instalar app"</p>
                    <p className="text-sm text-muted-foreground">
                      Ou "Adicionar à tela inicial"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Confirme a instalação</p>
                    <p className="text-sm text-muted-foreground">
                      O app aparecerá na sua tela inicial
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por que instalar?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                Acesso rápido pela tela inicial
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                Funciona offline
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                Experiência de app nativo
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                Sem ocupar espaço de armazenamento
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
