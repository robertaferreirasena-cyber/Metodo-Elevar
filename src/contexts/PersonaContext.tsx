import { createContext, useContext, ReactNode } from "react";
import { usePersonaProfile, PersonaProfile, PersonaFormData, RaioXData } from "@/hooks/usePersonaProfile";

interface PersonaContextValue {
  profile: PersonaProfile | null;
  formData: PersonaFormData;
  hasProfile: boolean;
  hasRaioX: boolean;
  loading: boolean;
  raioX: RaioXData | null;
  /** Returns a persona-enriched prompt string */
  enrichPrompt: (basePrompt: string) => string;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const { profile, formData, hasProfile, hasRaioX, loading } = usePersonaProfile();

  const raioX = (profile?.generated_raio_x as RaioXData) ?? null;

  const enrichPrompt = (basePrompt: string): string => {
    if (!hasProfile) return basePrompt;

    const parts: string[] = [];
    if (formData.business_name) parts.push(`Meu negócio: ${formData.business_name}`);
    if (formData.niche) parts.push(`Nicho: ${formData.niche}`);
    if (formData.product_description) parts.push(`Produto/serviço: ${formData.product_description}`);
    if (formData.main_pain) parts.push(`Principal dor do público: ${formData.main_pain}`);
    if (formData.main_differentiator) parts.push(`Diferencial: ${formData.main_differentiator}`);
    if (formData.target_gender) parts.push(`Público: ${formData.target_gender}, ${formData.target_age_range || ""}`);

    if (raioX?.estrategia_recomendada?.tom_comunicacao) {
      parts.push(`Tom de comunicação ideal: ${raioX.estrategia_recomendada.tom_comunicacao}`);
    }

    if (!parts.length) return basePrompt;

    return `CONTEXTO DA MINHA PERSONA:\n${parts.join("\n")}\n\n${basePrompt}`;
  };

  return (
    <PersonaContext.Provider value={{ profile, formData, hasProfile, hasRaioX, loading, raioX, enrichPrompt }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersonaContext() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersonaContext must be used within PersonaProvider");
  return ctx;
}
