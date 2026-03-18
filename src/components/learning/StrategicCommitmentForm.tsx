import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileSignature } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function StrategicCommitmentForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    annual_goal: "",
    quarterly_goal: "",
    current_revenue: "",
    main_challenge: "",
    commitment_text: "",
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
            main_challenge: data.main_challenge || "",
            commitment_text: data.commitment_text || "",
          });
          setSaved(true);
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
      toast.success("Compromisso salvo com sucesso! 🎯", {
        description: "Seu compromisso estratégico foi registrado. Continue com as missões do Método ELEVAR!",
        duration: 5000,
      });
    } catch {
      toast.error("Erro ao salvar compromisso");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-40 bg-muted animate-pulse rounded-lg" />;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Compromisso Estratégico ELEVAR</CardTitle>
          {saved && <Badge className="bg-emerald-500/20 text-emerald-600 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Preenchido</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">Assine seu compromisso com a execução do Método ELEVAR. Comprometa-se com as entregas e prazos da mentoria.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">🎯 Meta Anual de Faturamento</Label>
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
        <div>
          <Label className="text-xs">💰 Faturamento Atual Mensal</Label>
          <Input
            placeholder="Ex: R$ 50.000"
            value={form.current_revenue}
            onChange={e => setForm(f => ({ ...f, current_revenue: e.target.value }))}
            className="mt-1"
          />
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
        <div>
          <Label className="text-xs">✍️ Seu Compromisso</Label>
          <Textarea
            placeholder="Eu me comprometo a executar todas as missões do Método ELEVAR com disciplina e constância..."
            value={form.commitment_text}
            onChange={e => setForm(f => ({ ...f, commitment_text: e.target.value }))}
            className="mt-1"
            rows={3}
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Salvando..." : saved ? "Atualizar Compromisso" : "Formalizar Compromisso 🎯"}
        </Button>
      </CardContent>
    </Card>
  );
}
