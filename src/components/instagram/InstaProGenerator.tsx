import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ProfileGeneratorForm, { type InstaFormData } from "./ProfileGeneratorForm";
import InstagramProfilePreview, { type InstaProfile } from "./InstagramProfilePreview";

interface Props {
  personaData?: {
    niche?: string;
    product?: string;
    differentiator?: string;
    transformation?: string;
    targetAudience?: string;
    ageRange?: string;
    brandName?: string;
  };
}

type ViewState = "form" | "generating" | "result";

export default function InstaProGenerator({ personaData }: Props) {
  const [view, setView] = useState<ViewState>("form");
  const [profile, setProfile] = useState<InstaProfile | null>(null);
  const [lastFormData, setLastFormData] = useState<InstaFormData | null>(null);

  const handleSubmit = async (formData: InstaFormData) => {
    setLastFormData(formData);
    setView("generating");
    try {
      const { data, error } = await supabase.functions.invoke("instagram-profile-generator", {
        body: { formData },
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
          <p className="text-sm font-medium text-foreground">Gerando seu perfil Instagram...</p>
          <p className="text-xs text-muted-foreground">A IA está criando um perfil otimizado para alta conversão</p>
        </div>
      </div>
    );
  }

  if (view === "result" && profile) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Preview do Perfil</h3>
          <button onClick={() => setView("form")} className="text-xs text-primary hover:underline">
            ← Editar dados
          </button>
        </div>
        <InstagramProfilePreview profile={profile} onRegenerate={handleRegenerate} />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <ProfileGeneratorForm
        onSubmit={handleSubmit}
        isGenerating={view === "generating"}
        personaData={personaData}
      />
    </div>
  );
}
