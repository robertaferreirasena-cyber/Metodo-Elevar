import { useState, useEffect } from "react";
import { Loader2, Save, History, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ProfileGeneratorForm, { type InstaFormData } from "./ProfileGeneratorForm";
import InstagramProfilePreview, { type InstaProfile } from "./InstagramProfilePreview";
import { useAuth } from "@/hooks/useAuth";
import type { RaioXData } from "@/hooks/usePersonaProfile";

interface Props {
  personaData?: {
    niche?: string;
    product?: string;
    differentiator?: string;
    transformation?: string;
    targetAudience?: string;
    ageRange?: string;
    brandName?: string;
    raioX?: RaioXData | null;
  };
  onCreateContent?: (post: InstaProfile["posts_sugeridos"][0]) => void;
}

type ViewState = "form" | "generating" | "result" | "history";

interface SavedProfile {
  id: string;
  label: string | null;
  profile_data: InstaProfile;
  created_at: string;
}

export default function InstaProGenerator({ personaData, onCreateContent }: Props) {
  const [view, setView] = useState<ViewState>("form");
  const [profile, setProfile] = useState<InstaProfile | null>(null);
  const [lastFormData, setLastFormData] = useState<InstaFormData | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<SavedProfile | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadSavedProfiles();
  }, [user]);

  const loadSavedProfiles = async () => {
    const { data } = await supabase
      .from("saved_instagram_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setSavedProfiles(data as unknown as SavedProfile[]);
  };

  const handleSave = async () => {
    if (!profile || !user) return;
    setSaving(true);
    try {
      const label = profile.nome_perfil || "Perfil sem nome";
      const { data, error } = await supabase
        .from("saved_instagram_profiles")
        .insert({ user_id: user.id, profile_data: profile as any, label })
        .select("id")
        .single();
      if (error) throw error;
      setCurrentProfileId(data.id);
      toast.success("Perfil salvo com sucesso!");
      loadSavedProfiles();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("saved_instagram_profiles")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro ao deletar perfil");
      return;
    }
    toast.success("Perfil deletado!");
    setSavedProfiles(prev => prev.filter(p => p.id !== id));
    if (currentProfileId === id) {
      setCurrentProfileId(null);
      setView("form");
    }
  };

  const handleEditSave = async () => {
    if (!editingProfile) return;
    const { error } = await supabase
      .from("saved_instagram_profiles")
      .update({ label: editLabel })
      .eq("id", editingProfile.id);
    if (error) {
      toast.error("Erro ao renomear");
      return;
    }
    toast.success("Nome atualizado!");
    setSavedProfiles(prev => prev.map(p => p.id === editingProfile.id ? { ...p, label: editLabel } : p));
    setEditingProfile(null);
  };

  const handleLoadProfile = (saved: SavedProfile) => {
    setProfile(saved.profile_data);
    setCurrentProfileId(saved.id);
    setView("result");
  };

  const handleSubmit = async (formData: InstaFormData) => {
    setLastFormData(formData);
    setView("generating");
    setCurrentProfileId(null);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-profile-generator", {
        body: { formData, raioXData: personaData?.raioX || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.profile) throw new Error("Resposta vazia da IA");

      setProfile(data.profile);
      setView("result");
      toast.success("Perfil gerado com sucesso! 🎉");
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err.message || "Erro ao gerar perfil");
      setView("form");
    }
  };

  const handleRegenerate = () => {
    if (lastFormData) {
      handleSubmit(lastFormData);
    } else {
      setView("form");
    }
  };

  if (view === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Loader2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">Gerando seu perfil Instagram estratégico...</p>
          <p className="text-xs text-muted-foreground">A IA está criando 9 posts com funil de atração, retenção e conversão</p>
        </div>
      </div>
    );
  }

  if (view === "history") {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Perfis Salvos</h3>
          <button onClick={() => setView("form")} className="text-xs text-primary hover:underline">← Voltar</button>
        </div>
        {savedProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum perfil salvo ainda.</p>
        ) : (
          <div className="space-y-2">
            {savedProfiles.map(sp => (
              <div key={sp.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <button onClick={() => handleLoadProfile(sp)} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{sp.label || "Perfil"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(sp.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {sp.profile_data.username_sugestoes?.slice(0, 2).map((u, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{u}</Badge>
                    ))}
                  </div>
                </button>
                <div className="flex gap-1 mt-2 justify-end">
                  <Button
                    size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"
                    onClick={(e) => { e.stopPropagation(); setEditingProfile(sp); setEditLabel(sp.label || ""); }}
                  >
                    <Pencil className="h-3 w-3" /> Renomear
                  </Button>
                  <Button
                    size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(sp.id); }}
                  >
                    <Trash2 className="h-3 w-3" /> Deletar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-base">Renomear Perfil</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Nome do perfil" />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditingProfile(null)}>Cancelar</Button>
                <Button size="sm" onClick={handleEditSave}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (view === "result" && profile) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground">Preview do Perfil</h3>
          <div className="flex gap-2">
            {!currentProfileId && (
              <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="gap-1 text-xs">
                <Save className="h-3 w-3" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
            )}
            {currentProfileId && (
              <Badge variant="secondary" className="text-[10px]">✓ Salvo</Badge>
            )}
            <button onClick={() => setView("form")} className="text-xs text-primary hover:underline">
              ← Editar dados
            </button>
          </div>
        </div>
        <InstagramProfilePreview
          profile={profile}
          onRegenerate={handleRegenerate}
          onCreateContent={onCreateContent}
        />
      </div>
    );
  }

  return (
    <div className="mt-4">
      {savedProfiles.length > 0 && (
        <div className="mb-4">
          <Button size="sm" variant="ghost" onClick={() => setView("history")} className="gap-1 text-xs">
            <History className="h-3 w-3" /> Ver perfis salvos ({savedProfiles.length})
          </Button>
        </div>
      )}
      <ProfileGeneratorForm
        onSubmit={handleSubmit}
        isGenerating={false}
        personaData={personaData}
      />
    </div>
  );
}
