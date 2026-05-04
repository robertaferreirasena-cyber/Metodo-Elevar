import { useState, useEffect } from "react";
import { Key, Loader2, CheckCircle, XCircle, ExternalLink, Eye, EyeOff, RefreshCw, Users, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { scopedLocal } from "@/lib/userScopedKey";

interface ManyChatAccount {
  name: string;
  category: string;
  subscribersCount: number;
  status: string;
}

export default function ManyChatApiConfig() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [accountData, setAccountData] = useState<ManyChatAccount | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Load saved key (scoped per-user)
  useEffect(() => {
    if (user) {
      const stored = scopedLocal.get("manychat_api_key");
      if (stored) {
        setSavedKey(stored);
        setApiKey(stored);
      }
    }
  }, [user]);

  const handleValidate = async () => {
    const keyToValidate = apiKey.trim();
    if (!keyToValidate || !user) return;

    setIsValidating(true);
    setAccountData(null);
    setIsValid(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Sessão expirada.");
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/manychat-validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ apiKey: keyToValidate }),
      });

      const data = await resp.json();

      if (resp.ok && data.valid) {
        setIsValid(true);
        setAccountData(data.account);
        // Save the key
        scopedLocal.set("manychat_api_key", keyToValidate);
        setSavedKey(keyToValidate);
        toast.success("API Key válida! Dados da conta carregados.");
      } else {
        setIsValid(false);
        toast.error(data.error || "API Key inválida");
      }
    } catch (e) {
      console.error("Validation error:", e);
      setIsValid(false);
      toast.error("Erro ao validar API Key");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveKey = () => {
    if (user) {
      scopedLocal.remove("manychat_api_key");
      setSavedKey("");
      setApiKey("");
      setAccountData(null);
      setIsValid(null);
      toast.success("API Key removida");
    }
  };

  const maskedKey = (key: string) => {
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Instructions */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4 text-blue-500" />
            Configurar API Key do ManyChat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Para conectar com sua conta ManyChat e validar seus dados, você precisa inserir sua API Key. 
            A chave fica armazenada apenas no seu navegador (localStorage) e é enviada ao servidor apenas para validação.
          </p>
          <div className="bg-background rounded-lg p-3 space-y-2 border border-border">
            <p className="text-xs font-semibold text-foreground">Como obter sua API Key:</p>
            <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Acesse <span className="font-medium text-foreground">manychat.com</span> e faça login</li>
              <li>Vá em <span className="font-medium text-foreground">Settings → Integrations → ManyChat API</span></li>
              <li>Clique em <span className="font-medium text-foreground">"Get API Key"</span> ou copie a chave existente</li>
              <li>Cole a chave no campo abaixo</li>
            </ol>
          </div>
          <a
            href="https://manychat.com/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir ManyChat Settings
          </a>
        </CardContent>
      </Card>

      {/* API Key Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sua API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Cole sua API Key aqui..."
                className="text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              onClick={handleValidate}
              disabled={!apiKey.trim() || isValidating}
              className="gap-1.5"
            >
              {isValidating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Validando...</>
              ) : (
                <><RefreshCw className="h-4 w-4" /> Validar</>
              )}
            </Button>
          </div>

          {/* Validation status */}
          {isValid !== null && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              isValid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}>
              {isValid ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                {isValid ? 'API Key válida e conectada' : 'API Key inválida ou expirada'}
              </span>
            </div>
          )}

          {/* Saved key indicator */}
          {savedKey && (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Chave salva: <code className="bg-background px-1 py-0.5 rounded text-[10px]">{maskedKey(savedKey)}</code>
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemoveKey} className="h-7 text-xs text-red-500 hover:text-red-600">
                Remover
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Data */}
      {accountData && (
        <Card className="border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Dados da Conta ManyChat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Página / Bot</p>
                <p className="text-sm font-semibold text-foreground">{accountData.name}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Categoria</p>
                <p className="text-sm font-semibold text-foreground">{accountData.category || 'N/A'}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Subscribers</p>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {accountData.subscribersCount?.toLocaleString('pt-BR') || '0'}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Status</p>
                </div>
                <Badge className={`text-[10px] ${
                  accountData.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300' 
                    : 'bg-amber-500/10 text-amber-600 border-amber-300'
                }`}>
                  {accountData.status === 'active' ? '🟢 Ativo' : '🟡 ' + accountData.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
