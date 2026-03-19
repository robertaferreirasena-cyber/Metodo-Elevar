import { useState, useEffect } from "react";
import { GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MissionContext {
  missionTitle: string;
  prompt: string;
  route: string;
}

export function MissionContextBanner() {
  const [context, setContext] = useState<MissionContext | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("elevar_mission_context");
      if (raw) setContext(JSON.parse(raw));
    } catch {}
  }, []);

  const handleDismiss = () => {
    sessionStorage.removeItem("elevar_mission_context");
    setContext(null);
  };

  if (!context) return null;

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <GraduationCap className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between gap-2">
        <span className="text-sm">
          <strong className="text-primary">Missão ELEVAR:</strong>{" "}
          {context.missionTitle}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
