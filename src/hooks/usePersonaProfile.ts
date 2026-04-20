import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useSessionPersistence } from "./useSessionPersistence";

export interface PersonaFormData {
  // Step 1: About You
  business_type: string;
  business_name: string;
  niche: string;
  sub_niche: string;
  time_in_market: string;
  sales_channels: string[];
  
  // Step 2: Product/Service
  product_description: string;
  price_range: string;
  main_differentiator: string;
  transformation: string;
  
  // Step 3: Target Audience
  target_gender: string;
  target_age_range: string;
  target_profession: string;
  target_location: string;
  main_pain: string;
  previous_attempts: string;
  
  // Step 4: Challenges
  sales_challenges: string;
  common_objections: string;
  improvement_goals: string;
}

export interface RaioXData {
  problemas_externos: string[];
  problemas_internos: string[];
  problemas_filosoficos: string[];
  desejos: string[];
  fontes_de_dor: string[];
  medos: string[];
  oportunidades: string[];
  sonhos: string[];
  problemas_financeiros: string[];
  padroes_de_compra: {
    gatilhos_decisao: string;
    objecoes_previsiveis: string;
    ciclo_decisao: string;
    influenciadores: string;
  };
  neurocomportamentos: {
    processamento_informacao: string;
    gatilhos_confianca: string;
    gatilhos_resistencia: string;
    canal_comunicacao_ideal: string;
  };
  estrategia_recomendada: {
    tom_comunicacao: string;
    gatilhos_mentais_prioritarios: string[];
    abordagem_venda: string;
    argumentos_chave: string[];
  };
  templates_indicados: string[];
  resumo_executivo: string;
}

export interface PersonaProfile extends PersonaFormData {
  id: string;
  user_id: string;
  generated_raio_x: RaioXData | null;
  suggested_templates: string[] | null;
  created_at: string;
  updated_at: string;
}

const INITIAL_FORM_DATA: PersonaFormData = {
  business_type: "",
  business_name: "",
  niche: "",
  sub_niche: "",
  time_in_market: "",
  sales_channels: [],
  product_description: "",
  price_range: "",
  main_differentiator: "",
  transformation: "",
  target_gender: "",
  target_age_range: "",
  target_profession: "",
  target_location: "",
  main_pain: "",
  previous_attempts: "",
  sales_challenges: "",
  common_objections: "",
  improvement_goals: "",
};

const PERSONA_GENERATOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/persona-generator`;

interface PersonaFormSession {
  formData: PersonaFormData;
  currentStep: number;
}

const SESSION_KEY = "session_persona_form";

export function usePersonaProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PersonaProfile | null>(null);
  
  // Session persistence for form progress
  const [sessionState, setSessionState, clearFormSession, hasRestoredSession] = useSessionPersistence<PersonaFormSession>(
    SESSION_KEY,
    { formData: INITIAL_FORM_DATA, currentStep: 1 }
  );
  
  const [formData, setFormData] = useState<PersonaFormData>(sessionState.formData);
  const [currentStep, setCurrentStep] = useState(sessionState.currentStep);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Sync form data and step to session storage
  useEffect(() => {
    setSessionState({ formData, currentStep });
  }, [formData, currentStep, setSessionState]);

  // Fetch existing profile
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("persona_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Cast the data to match our interface since the types file is read-only
        const profileData = data as unknown as PersonaProfile;
        setProfile(profileData);
        setFormData({
          business_name: profileData.business_name || "",
          niche: profileData.niche || "",
          sub_niche: profileData.sub_niche || "",
          time_in_market: profileData.time_in_market || "",
          sales_channels: profileData.sales_channels || [],
          product_description: profileData.product_description || "",
          price_range: profileData.price_range || "",
          main_differentiator: profileData.main_differentiator || "",
          transformation: profileData.transformation || "",
          target_gender: profileData.target_gender || "",
          target_age_range: profileData.target_age_range || "",
          target_profession: profileData.target_profession || "",
          target_location: profileData.target_location || "",
          main_pain: profileData.main_pain || "",
          previous_attempts: profileData.previous_attempts || "",
          sales_challenges: profileData.sales_challenges || "",
          common_objections: profileData.common_objections || "",
          improvement_goals: profileData.improvement_goals || "",
        });
      }
    } catch (error) {
      console.error("Error fetching persona profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update form data
  const updateFormData = useCallback((updates: Partial<PersonaFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Save profile (create or update)
  const saveProfile = useCallback(async (data: PersonaFormData): Promise<boolean> => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return false;
    }

    setSaving(true);

    try {
      if (profile) {
        // Update existing
        const { error } = await supabase
          .from("persona_profiles")
          .update(data as any)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Perfil atualizado com sucesso!");
      } else {
        // Create new
        const { error } = await supabase
          .from("persona_profiles")
          .insert({ ...data, user_id: user.id } as any);

        if (error) throw error;
        toast.success("Perfil criado com sucesso!");
      }

      await fetchProfile();
      return true;
    } catch (error) {
      console.error("Error saving persona profile:", error);
      toast.error("Erro ao salvar perfil");
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, profile, fetchProfile]);

  // Generate raio-x with AI
  const generateRaioX = useCallback(async (catalogFiles?: string[]): Promise<boolean> => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return false;
    }

    setGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(PERSONA_GENERATOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ profileData: formData, catalogFiles: catalogFiles || [] }),
      });

      if (response.status === 429) {
        toast.error("Limite de requisições excedido. Tente novamente em alguns minutos.");
        return false;
      }

      if (response.status === 402) {
        toast.error("Créditos esgotados. Por favor, adicione créditos.");
        return false;
      }

      if (!response.ok) {
        throw new Error("Failed to generate raio-x");
      }

      const { raioX } = await response.json();

      // Save raio-x to database
      const { error } = await supabase
        .from("persona_profiles")
        .update({
          generated_raio_x: raioX,
          suggested_templates: raioX.templates_indicados,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Raio-X gerado com sucesso!");
      await fetchProfile();
      return true;
    } catch (error) {
      console.error("Error generating raio-x:", error);
      toast.error("Erro ao gerar Raio-X");
      return false;
    } finally {
      setGenerating(false);
    }
  }, [user, formData, fetchProfile]);

  // Delete profile
  const deleteProfile = useCallback(async (): Promise<boolean> => {
    if (!user || !profile) return false;

    try {
      const { error } = await supabase
        .from("persona_profiles")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile(null);
      setFormData(INITIAL_FORM_DATA);
      toast.success("Perfil excluído com sucesso!");
      return true;
    } catch (error) {
      console.error("Error deleting persona profile:", error);
      toast.error("Erro ao excluir perfil");
      return false;
    }
  }, [user, profile]);

  // Clear form session
  const clearSession = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentStep(1);
    clearFormSession();
  }, [clearFormSession]);

  return {
    profile,
    formData,
    currentStep,
    setCurrentStep,
    loading,
    saving,
    generating,
    hasProfile: !!profile,
    hasRaioX: !!profile?.generated_raio_x,
    hasRestoredSession,
    updateFormData,
    saveProfile,
    generateRaioX,
    deleteProfile,
    clearSession,
    refetch: fetchProfile,
  };
}
