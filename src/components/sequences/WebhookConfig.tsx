import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Webhook, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WebhookConfigProps {
  sequenceId: string;
  initialWebhookUrl: string;
  initialGroupId: string;
  initialGroupName: string;
  initialSendMode?: string;
  onSaved: (webhookUrl: string, groupId: string, groupName: string) => void;
}

export function WebhookConfig({
  sequenceId,
  initialWebhookUrl,
  initialGroupId,
  initialGroupName,
  initialSendMode = "uazapi",
  onSaved,
}: WebhookConfigProps) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [groupId, setGroupId] = useState(initialGroupId);
  const [groupName, setGroupName] = useState(initialGroupName);
  const [sendMode, setSendMode] = useState(initialSendMode);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("sequences")
        .update({
          webhook_url: webhookUrl || null,
          whatsapp_group_id: groupId || null,
          whatsapp_group_name: groupName || null,
          send_mode: sendMode,
        } as any)
        .eq("id", sequenceId);

      if (error) throw error;
      onSaved(webhookUrl, groupId, groupName);
      toast.success("Configuração salva!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Configuração de Envio
        </CardTitle>
        <CardDescription className="text-xs">
          Escolha como enviar os posts automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs value={sendMode} onValueChange={setSendMode}>
          <TabsList className="w-full">
            <TabsTrigger value="uazapi" className="flex-1 text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              UAZap
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex-1 text-xs">
              <Webhook className="h-3 w-3 mr-1" />
              Webhook
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uazapi" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Envio direto via UAZap API. Configure o token e URL no backend uma única vez.
            </p>
            <div className="space-y-1">
              <Label className="text-xs">ID do Grupo WhatsApp</Label>
              <Input
                placeholder="Ex: 5511999999999@g.us"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Formato: número@g.us (obtenha no painel do UAZap)
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nome do Grupo (opcional)</Label>
              <Input
                placeholder="Ex: Grupo VIP"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Envio via webhook genérico (FIQon, Make, Zapier, etc.)
            </p>
            <div className="space-y-1">
              <Label className="text-xs">URL do Webhook</Label>
              <Input
                placeholder="https://hooks.fiqon.com.br/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ID do Grupo WhatsApp</Label>
                <Input
                  placeholder="Ex: 5511999..."
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nome do Grupo</Label>
                <Input
                  placeholder="Ex: Grupo VIP"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} disabled={isSaving} size="sm" variant="outline" className="w-full">
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
          Salvar Configuração
        </Button>
      </CardContent>
    </Card>
  );
}
