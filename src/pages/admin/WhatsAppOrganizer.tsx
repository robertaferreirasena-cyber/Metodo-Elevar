import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, MessageSquare, Users, UserCheck } from "lucide-react";
import { OrganizerOverview } from "@/components/admin/organizer/OrganizerOverview";
import { ConversationCleanup } from "@/components/admin/organizer/ConversationCleanup";
import { GroupManager } from "@/components/admin/organizer/GroupManager";
import { DormantContacts } from "@/components/admin/organizer/DormantContacts";

interface Instance {
  id: string;
  name: string;
  instance_token: string;
  status: string | null;
}

export async function callUazapi(action: string, instanceToken: string, extraData?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('uazapi-manager', {
    body: { action, instanceToken, extraData },
  });
  if (error) throw error;
  return data;
}

export default function WhatsAppOrganizer() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState("");

  const getToken = useCallback(() => {
    return instances.find(i => i.id === selectedInstance)?.instance_token || "";
  }, [instances, selectedInstance]);

  useEffect(() => {
    supabase.from('whatsapp_instances').select('*').then(({ data }) => {
      if (data) {
        setInstances(data);
        if (data.length === 1) setSelectedInstance(data[0].id);
      }
    });
  }, []);

  return (
    <div className="flex flex-col h-full gap-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Organizador WhatsApp</h1>
        </div>
        <Select value={selectedInstance} onValueChange={setSelectedInstance}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecione a instância" />
          </SelectTrigger>
          <SelectContent>
            {instances.map(i => (
              <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedInstance ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Selecione uma instância para começar
        </div>
      ) : (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Conversas
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Grupos
            </TabsTrigger>
            <TabsTrigger value="dormant" className="gap-1.5">
              <UserCheck className="h-3.5 w-3.5" /> Reativação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1">
            <OrganizerOverview token={getToken()} instanceId={selectedInstance} />
          </TabsContent>
          <TabsContent value="conversations" className="flex-1">
            <ConversationCleanup token={getToken()} />
          </TabsContent>
          <TabsContent value="groups" className="flex-1">
            <GroupManager token={getToken()} />
          </TabsContent>
          <TabsContent value="dormant" className="flex-1">
            <DormantContacts token={getToken()} instanceId={selectedInstance} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
