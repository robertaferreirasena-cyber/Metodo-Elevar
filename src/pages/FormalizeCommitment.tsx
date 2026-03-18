import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileSignature, Loader2, CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { clearComingFromLearning } from "@/components/learning/FinishMissionButton";

export default function FormalizeCommitment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [copy, setCopy] = useState("");
  const [commitmentText, setCommitmentText] = useState("");
  const [userData, setUserData] = useState<{
    name: string;
    niche: string;
    business_name: string;
    annual_goal: string;
    quarterly_goal: string;
    current_revenue: string;
    main_challenge: string;
  }>({ name: "", niche: "", business_name: "", annual_goal: "", quarterly_goal: "", current_revenue: "", main_challenge: "" });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, personaRes, commitmentRes] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("persona_profiles").select("niche, business_name").eq("user_id", user.id).maybeSingle(),
      (supabase.from("strategic_commitments" as any).select("*").eq("user_id", user.id).maybeSingle() as any),
    ]);

    const data = {
      name: profileRes.data?.full_name || "",
      niche: personaRes.data?.niche || "",
      business_name: personaRes.data?.business_name || "",
      annual_goal: (commitmentRes.data as any)?.annual_goal || "",
      quarterly_goal: (commitmentRes.data as any)?.quarterly_goal || "",
      current_revenue: (commitmentRes.data as any)?.current_revenue || "",
      main_challenge: (commitmentRes.data as any)?.main_challenge || "",
    };

    setUserData(data);

    if ((commitmentRes.data as any)?.commitment_text) {
      setCommitmentText((commitmentRes.data as any).commitment_text);
      setSigned(true);
    }

    setLoading(false);
    generateCopy(data);
  };

  const generateCopy = async (data: typeof userData) => {
    setGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-commitment-copy", {
        body: data,
      });
      if (error) throw error;
      setCopy(result.copy || "");
    } catch (e) {
      console.error("Error generating copy:", e);
      setCopy(`Querida ${data.name || "Empreendedora"},\n\nVocê está dando um passo decisivo ao iniciar o Método ELEVAR. Com sua meta de faturar ${data.annual_goal || "mais"} por ano, e com a determinação de superar o desafio de "${data.main_challenge || "crescer seu negócio"}", você está pronta para transformar sua realidade.\n\nO Método ELEVAR é um caminho de 10 encontros práticos onde você vai executar, medir e crescer. Cada missão foi desenhada para gerar resultado real no seu negócio.\n\nComprometa-se com a execução. O resultado é consequência.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSign = async () => {
    if (!user || !commitmentText.trim()) {
      toast.error("Escreva seu compromisso pessoal antes de assinar.");
      return;
    }
    setSigning(true);
    try {
      const payload = { commitment_text: commitmentText, user_id: user.id, updated_at: new Date().toISOString() };
      
      // Check if record exists
      const { data: existing } = await (supabase.from("strategic_commitments" as any).select("id").eq("user_id", user.id).maybeSingle() as any);
      
      if (existing) {
        await (supabase.from("strategic_commitments" as any) as any).update(payload).eq("user_id", user.id);
      } else {
        await (supabase.from("strategic_commitments" as any) as any).insert(payload);
      }

      setSigned(true);
      toast.success("🎯 Compromisso formalizado com sucesso!", {
        description: "Sua jornada no Método ELEVAR está oficialmente iniciada!",
        duration: 5000,
      });

      // Return to learning after a brief delay
      setTimeout(() => {
        clearComingFromLearning();
        navigate("/aprendizado");
      }, 2000);
    } catch {
      toast.error("Erro ao salvar compromisso");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/aprendizado")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Formalizar Compromisso Estratégico
          </h1>
          <p className="text-xs text-muted-foreground">
            Assine seu compromisso com a execução do Método ELEVAR
          </p>
        </div>
      </div>

      {/* User Data Summary */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">📊 Seus Dados Estratégicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {userData.annual_goal && (
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Meta Anual</p>
                <p className="text-sm font-semibold">{userData.annual_goal}</p>
              </div>
            )}
            {userData.quarterly_goal && (
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Meta Trimestral</p>
                <p className="text-sm font-semibold">{userData.quarterly_goal}</p>
              </div>
            )}
            {userData.current_revenue && (
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Faturamento Atual</p>
                <p className="text-sm font-semibold">{userData.current_revenue}</p>
              </div>
            )}
            {userData.main_challenge && (
              <div className="p-2 rounded-md bg-muted/50 col-span-2">
                <p className="text-[10px] text-muted-foreground">Principal Desafio</p>
                <p className="text-sm font-semibold">{userData.main_challenge}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Generated Copy */}
      <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Carta de Compromisso ELEVAR</CardTitle>
            {generating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent>
          {generating ? (
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
              <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-line leading-relaxed">
              {copy}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Sign Area */}
      <Card className={`border-2 ${signed ? "border-emerald-500/30 bg-emerald-500/5" : "border-primary/20"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">
              {signed ? "✅ Compromisso Assinado" : "✍️ Assine Seu Compromisso"}
            </CardTitle>
            {signed && <Badge className="bg-emerald-500/20 text-emerald-600 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Assinado</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Eu me comprometo a executar todas as missões do Método ELEVAR com disciplina e constância, aplicando cada aprendizado diretamente no meu negócio..."
            value={commitmentText}
            onChange={(e) => setCommitmentText(e.target.value)}
            rows={4}
            disabled={signed}
            className={signed ? "opacity-70" : ""}
          />
          {!signed && (
            <Button 
              onClick={handleSign} 
              disabled={signing || !commitmentText.trim()} 
              className="w-full gap-2"
            >
              {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
              {signing ? "Assinando..." : "Assinar Compromisso 🎯"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
