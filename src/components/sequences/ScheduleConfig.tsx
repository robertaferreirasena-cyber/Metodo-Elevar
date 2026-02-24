import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

interface ScheduleConfigProps {
  totalPosts: number;
  onScheduleAll: (startDate: string, startTime: string, intervalHours: number) => void;
}

export function ScheduleConfig({ totalPosts, onScheduleAll }: ScheduleConfigProps) {
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [interval, setInterval] = useState("24");

  const handleApply = () => {
    if (!startDate || !startTime) {
      toast.error("Preencha a data e hora de início");
      return;
    }
    onScheduleAll(startDate, startTime, parseInt(interval));
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Agendar com Intervalo
        </CardTitle>
        <CardDescription className="text-xs">
          Define automaticamente data/hora para os {totalPosts} posts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Data início</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hora início</Label>
            <div className="relative">
              <Clock className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Intervalo entre posts</Label>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 horas</SelectItem>
              <SelectItem value="12">12 horas</SelectItem>
              <SelectItem value="24">1 dia</SelectItem>
              <SelectItem value="48">2 dias</SelectItem>
              <SelectItem value="72">3 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleApply} size="sm" className="w-full">
          Aplicar Agendamento
        </Button>
      </CardContent>
    </Card>
  );
}
