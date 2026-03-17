import { useState, useCallback } from "react";
import { Eye, EyeOff, Copy, Check, ShieldAlert, Key, Download, Loader2, Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface CredentialsData {
  project_url: string | null;
  anon_key: string | null;
  service_role_key: string | null;
  secrets: Record<string, string>;
  edge_functions: string[];
  edge_functions_count: number;
}

const edgeFunctionSources = import.meta.glob(
  '/supabase/functions/*/index.ts',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

function mask(val: string): string {
  if (val.length <= 20) return '•'.repeat(val.length);
  return val.slice(0, 12) + '•••••' + val.slice(-8);
}

export default function AdminCredentials() {
  const [data, setData] = useState<CredentialsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<Set<string>>(new Set());

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-credentials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao buscar credenciais');
      }

      const result: CredentialsData = await res.json();
      setData(result);
      toast.success("Credenciais reveladas com sucesso!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleReveal = (key: string) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const copyToClipboard = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(prev => new Set(prev).add(key));
    setTimeout(() => setCopied(prev => { const n = new Set(prev); n.delete(key); return n; }), 2000);
  };

  const credentialEntries: [string, string][] = data ? [
    ['SUPABASE_URL', data.project_url || ''],
    ['SUPABASE_ANON_KEY', data.anon_key || ''],
    ['SUPABASE_SERVICE_ROLE_KEY', data.service_role_key || ''],
  ].filter(([, v]) => v) as [string, string][] : [];

  const secretEntries: [string, string][] = data ? Object.entries(data.secrets) : [];

  const copyAll = async () => {
    if (!data) return;
    const lines: string[] = [
      '═══════════════════════════════════',
      '  CREDENCIAIS DO PROJETO',
      '═══════════════════════════════════',
      '',
      ...credentialEntries.map(([k, v]) => `${k}=${v}`),
      '',
      '═══════════════════════════════════',
      '  SECRETS',
      '═══════════════════════════════════',
      '',
      ...secretEntries.map(([k, v]) => `${k}=${v}`),
      '',
      '═══════════════════════════════════',
      '  EDGE FUNCTIONS',
      '═══════════════════════════════════',
      '',
      ...data.edge_functions.join(', ').split(', '),
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    toast.success("Tudo copiado para a área de transferência!");
  };

  const downloadSecretsTs = () => {
    if (!data) return;
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const allSecrets: Record<string, string> = {};
    credentialEntries.forEach(([k, v]) => allSecrets[k] = v);
    secretEntries.forEach(([k, v]) => allSecrets[k] = v);

    const entries = Object.entries(allSecrets)
      .map(([k, v]) => `  ${k}: "${v}",`)
      .join('\n');

    const content = `// Secrets do projeto - Gerado em ${dateStr}\n\nexport const SECRETS = {\n${entries}\n} as const;\n\nexport type SecretKey = keyof typeof SECRETS;\n`;

    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'secrets.ts';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("secrets.ts baixado!");
  };

  const downloadEdgeFunctionsTs = () => {
    const entries = Object.entries(edgeFunctionSources);
    if (entries.length === 0) {
      toast.error("Nenhuma edge function encontrada no build.");
      return;
    }

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const sections = entries.map(([path, source]) => {
      const name = path.match(/\/supabase\/functions\/([^/]+)\//)?.[1] || path;
      return `// ═══════════════════════════════════\n// Edge Function: ${name}\n// ═══════════════════════════════════\n\n${source}`;
    });

    const content = `// Edge Functions do projeto - Gerado em ${dateStr}\n// Total: ${entries.length} funções\n\n${sections.join('\n\n')}`;

    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edge-functions.ts';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${entries.length} edge functions exportadas!`);
  };

  const ValueRow = ({ label, value }: { label: string; value: string }) => {
    const isRevealed = revealed.has(label);
    const isCopied = copied.has(label);
    return (
      <div className="flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0">
        <span className="text-sm font-mono text-muted-foreground shrink-0">{label}</span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-mono truncate max-w-[300px]">
            {isRevealed ? value : mask(value)}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleReveal(label)}>
            {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(label, value)}>
            {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credenciais do Projeto</h1>
          <p className="text-muted-foreground text-sm">Gerencie secrets, credenciais e edge functions</p>
        </div>
        <div className="flex gap-2">
          {data && (
            <>
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="h-4 w-4 mr-2" /> Copiar Tudo
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSecretsTs}>
                <Download className="h-4 w-4 mr-2" /> Download .ts
              </Button>
            </>
          )}
          <Button onClick={fetchCredentials} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
            {data ? 'Atualizar' : 'Revelar Tudo'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-red-500/10">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Credenciais</p>
              <p className="text-2xl font-bold">{data ? credentialEntries.length : '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Secrets</p>
              <p className="text-2xl font-bold">{data ? secretEntries.length : '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Code2 className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Edge Functions</p>
              <p className="text-2xl font-bold">{data ? data.edge_functions_count : '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Credentials Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-red-500" /> Credenciais
              </CardTitle>
            </CardHeader>
            <CardContent>
              {credentialEntries.map(([k, v]) => (
                <ValueRow key={k} label={k} value={v} />
              ))}
            </CardContent>
          </Card>

          {/* Secrets Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 text-primary" /> Secrets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {secretEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum secret extra encontrado</p>
              ) : (
                secretEntries.map(([k, v]) => (
                  <ValueRow key={k} label={k} value={v} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Edge Functions Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code2 className="h-4 w-4 text-blue-500" /> Edge Functions ({data.edge_functions_count})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={downloadEdgeFunctionsTs}>
                  <Download className="h-4 w-4 mr-2" /> Download .ts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.edge_functions.map(fn => (
                  <Badge key={fn} variant="secondary" className="font-mono text-xs">
                    {fn}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
