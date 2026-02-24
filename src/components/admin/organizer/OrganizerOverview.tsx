import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { callUazapi } from "@/pages/admin/WhatsAppOrganizer";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Edit, MessageSquare, Users, UserMinus, Activity, Loader2, Camera } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  token: string;
  instanceId: string;
}

interface ProfileInfo {
  name?: string;
  status?: string;
  profilePicUrl?: string;
  phone?: string;
}

export function OrganizerOverview({ token, instanceId }: Props) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [metrics, setMetrics] = useState({ chats: 0, groups: 0, contacts: 0 });
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }
    setUploadingPhoto(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await callUazapi('setProfilePic', token, { image: base64 });
      setProfile(prev => prev ? { ...prev, profilePicUrl: base64 } : prev);
      toast.success('Foto de perfil atualizada!');
    } catch {
      toast.error('Erro ao atualizar foto de perfil');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
    return () => { abortRef.current?.abort(); };
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [infoData, chatsData, groupsData] = await Promise.all([
        callUazapi('status', token),
        callUazapi('getChats', token),
        callUazapi('getGroups', token),
      ]);

      const info = infoData as Record<string, unknown>;
      const profileData: ProfileInfo = {
        name: (info.wa_name as string) || (info.name as string) || (info.profileName as string) || '',
        status: (info.wa_status as string) || (info.status as string) || '',
        profilePicUrl: (info.wa_profilePicUrl as string) || (info.profilePicUrl as string) || '',
        phone: (info.wa_chatid as string) || (info.phone as string) || '',
      };
      setProfile(profileData);
      setNewName(profileData.name || '');
      setNewStatus(profileData.status || '');

      const chatsList = Array.isArray(chatsData) ? chatsData : ((chatsData as any)?.chats || []);
      const groupsList = Array.isArray(groupsData) ? groupsData : ((groupsData as any)?.groups || (groupsData as any)?.data || []);

      const chatCount = chatsList.length;
      const groupCount = groupsList.length;

      setMetrics({ chats: chatCount, groups: groupCount, contacts: chatCount - groupCount });

      // Auto-run diagnosis
      runDiagnosis(profileData, chatCount, groupCount);
    } catch {
      toast.error("Erro ao carregar dados da instância");
    } finally {
      setLoading(false);
    }
  };

  const runDiagnosis = async (profileData: ProfileInfo, chatCount: number, groupCount: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setDiagnosisLoading(true);
    setDiagnosis("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const prompt = `Você é um consultor de WhatsApp Business. Analise o perfil e dê um diagnóstico com score de saúde (0-100) e sugestões práticas.

Dados:
- Nome do perfil: "${profileData.name || 'Não definido'}"
- Status: "${profileData.status || 'Não definido'}"  
- Foto de perfil: ${profileData.profilePicUrl ? 'Tem foto' : 'Sem foto'}
- Total de conversas: ${chatCount}
- Total de grupos: ${groupCount}

Responda em formato:
## 🏥 Diagnóstico do WhatsApp - Score: X/100

### ✅ Pontos positivos
- ...

### ⚠️ Pontos de atenção  
- ...

### 🎯 Ações recomendadas
1. ...
2. ...
3. ...

Seja direto, prático e use emojis.`;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-strategist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], mode: 'private', userId: user?.id }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error('Erro na IA');
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let full = '', buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { full += content; setDiagnosis(full); }
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setDiagnosis('Erro ao gerar diagnóstico. Tente novamente.');
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const handleSaveName = async () => {
    try {
      await callUazapi('setProfileName', token, { name: newName });
      setProfile(prev => prev ? { ...prev, name: newName } : prev);
      setEditingName(false);
      toast.success("Nome atualizado!");
    } catch { toast.error("Erro ao atualizar nome"); }
  };

  const handleSaveStatus = async () => {
    try {
      await callUazapi('setProfileStatus', token, { status: newStatus });
      setProfile(prev => prev ? { ...prev, status: newStatus } : prev);
      setEditingStatus(false);
      toast.success("Status atualizado!");
    } catch { toast.error("Erro ao atualizar status"); }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        <Skeleton className="h-64 md:col-span-3" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Profile + Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col items-center gap-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handlePhotoChange}
              />
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.profilePicUrl || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {profile?.name?.substring(0, 2).toUpperCase() || 'WA'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </Button>
              </div>

              {editingName ? (
                <div className="flex gap-1 w-full">
                  <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-7 text-xs" />
                  <Button size="sm" className="h-7 text-xs" onClick={handleSaveName}>Ok</Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{profile?.name || 'Sem nome'}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingName(true)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {editingStatus ? (
                <div className="flex gap-1 w-full">
                  <Input value={newStatus} onChange={e => setNewStatus(e.target.value)} className="h-7 text-xs" />
                  <Button size="sm" className="h-7 text-xs" onClick={handleSaveStatus}>Ok</Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{profile?.status || 'Sem status'}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingStatus(true)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        {[
          { label: 'Conversas', value: metrics.chats, icon: MessageSquare, color: 'text-blue-500' },
          { label: 'Grupos', value: metrics.groups, icon: Users, color: 'text-green-500' },
          { label: 'Contatos', value: metrics.contacts, icon: UserMinus, color: 'text-orange-500' },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold">{m.value}</p>
                </div>
                <m.icon className={`h-8 w-8 ${m.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Diagnosis */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Diagnóstico IA
            </CardTitle>
            <div className="flex items-center gap-2">
              {diagnosisLoading && (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Analisando...
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={loadData} disabled={diagnosisLoading}>
                <Activity className="h-3 w-3 mr-1" /> Reanalisar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {diagnosis ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{diagnosis}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Carregando diagnóstico...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
