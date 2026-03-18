import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import FinishMissionButton from "@/components/learning/FinishMissionButton";
import { CheckCircle2, FileSignature, Sparkles, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function StrategicCommitmentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [contractData, setContractData] = useState<{ generated_copy?: string; commitment_text?: string; signature_name?: string } | null>(null);
  const [form, setForm] = useState({
    annual_goal: "",
    quarterly_goal: "",
    current_revenue: "",
    annual_revenue: "",
    main_challenge: "",
  });

  useEffect(() => {
    if (!user) return;
    (supabase.from("strategic_commitments" as any).select("*").eq("user_id", user.id).maybeSingle() as any)
      .then(({ data }: any) => {
        if (data) {
          setForm({
            annual_goal: data.annual_goal || "",
            quarterly_goal: data.quarterly_goal || "",
            current_revenue: data.current_revenue || "",
            annual_revenue: data.annual_revenue || "",
            main_challenge: data.main_challenge || "",
          });
          setSaved(true);
          if (data.commitment_text && data.signature_name) {
            setHasSigned(true);
            setContractData({
              generated_copy: data.generated_copy,
              commitment_text: data.commitment_text,
              signature_name: data.signature_name,
            });
          }
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = { ...form, user_id: user.id, updated_at: new Date().toISOString() };
      if (saved) {
        await (supabase.from("strategic_commitments" as any) as any).update(payload).eq("user_id", user.id);
      } else {
        await (supabase.from("strategic_commitments" as any) as any).insert(payload);
      }
      setSaved(true);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
      toast.success("Metas salvas com sucesso! 🎯", {
        description: "Agora formalize seu compromisso estratégico.",
        duration: 5000,
      });
    } catch {
      toast.error("Erro ao salvar metas");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-40 bg-muted animate-pulse rounded-lg" />;

  // If commitment is signed, show the contract card
  if (hasSigned && contractData) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">📜 Seu Contrato de Compromisso ELEVAR</CardTitle>
            <Badge className="bg-emerald-500/20 text-emerald-600 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Assinado</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generated Copy */}
          {contractData.generated_copy && (
            <div 
              className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-line leading-relaxed p-4 rounded-lg border border-dashed border-primary/20 bg-background/50"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {contractData.generated_copy}
            </div>
          )}

          {/* Commitment Text */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Meu compromisso:</p>
            <p className="text-sm text-foreground">{contractData.commitment_text}</p>
          </div>

          {/* Signature */}
          <div className="text-center p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
            <p className="text-xs text-muted-foreground mb-1">Assinado por:</p>
            <p 
              className="text-xl text-primary"
              style={{ fontFamily: "'Georgia', 'Palatino', cursive, serif", fontStyle: "italic" }}
            >
              {contractData.signature_name}
            </p>
          </div>

          {/* Goals Summary */}
          <div className="grid grid-cols-2 gap-2">
            {form.annual_goal && (
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Meta Anual (desejada)</p>
                <p className="text-sm font-semibold">{form.annual_goal}</p>
              </div>
            )}
            {form.quarterly_goal && (
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Meta Trimestral</p>
                <p className="text-sm font-semibold">{form.quarterly_goal}</p>
              </div>
            )}
            {form.current_revenue && (
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Faturamento Mensal</p>
                <p className="text-sm font-semibold">{form.current_revenue}</p>
              </div>
            )}
            {form.annual_revenue && (
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Faturamento Anual</p>
                <p className="text-sm font-semibold">{form.annual_revenue}</p>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate("/compromisso")}>
            <Eye className="h-4 w-4" /> Ver Contrato Completo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Definir Metas Anual e Trimestral</CardTitle>
          {saved && <Badge className="bg-emerald-500/20 text-emerald-600 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Preenchido</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">Defina suas metas de faturamento e identifique seus desafios para o Método ELEVAR.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">🎯 Meta Anual de Faturamento</Label>
            <p className="text-[10px] text-muted-foreground">Quanto você DESEJA faturar por ano</p>
            <Input
              placeholder="Ex: R$ 1.200.000"
              value={form.annual_goal}
              onChange={e => setForm(f => ({ ...f, annual_goal: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">📅 Meta Trimestral</Label>
            <Input
              placeholder="Ex: R$ 300.000"
              value={form.quarterly_goal}
              onChange={e => setForm(f => ({ ...f, quarterly_goal: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">💰 Faturamento Mensal Atual</Label>
            <Input
              placeholder="Ex: R$ 50.000"
              value={form.current_revenue}
              onChange={e => setForm(f => ({ ...f, current_revenue: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">💰 Faturamento Anual Atual</Label>
            <Input
              placeholder="Ex: R$ 600.000"
              value={form.annual_revenue}
              onChange={e => setForm(f => ({ ...f, annual_revenue: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">⚠️ Principal Desafio Atual</Label>
          <Textarea
            placeholder="Descreva o maior obstáculo que impede seu crescimento hoje..."
            value={form.main_challenge}
            onChange={e => setForm(f => ({ ...f, main_challenge: e.target.value }))}
            className="mt-1"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Salvando..." : saved ? "Atualizar Metas" : "Salvar Metas 🎯"}
          </Button>
          <FinishMissionButton />
        </div>
      </CardContent>
    </Card>
  );
}
