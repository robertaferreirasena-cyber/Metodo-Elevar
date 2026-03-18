import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { consumePendingMission } from "@/hooks/useMissionAutoComplete";

const COMING_FROM_KEY = "coming_from_learning";

export function setComingFromLearning() {
  localStorage.setItem(COMING_FROM_KEY, "true");
}

export function isComingFromLearning(): boolean {
  return localStorage.getItem(COMING_FROM_KEY) === "true";
}

export function clearComingFromLearning() {
  localStorage.removeItem(COMING_FROM_KEY);
}

export default function FinishMissionButton() {
  const navigate = useNavigate();

  if (!isComingFromLearning()) return null;

  const handleFinish = () => {
    clearComingFromLearning();
    // Consume any pending mission
    consumePendingMission();
    navigate("/aprendizado");
  };

  return (
    <Button
      onClick={handleFinish}
      size="sm"
      className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      <CheckCircle2 className="h-4 w-4" />
      Finalizar e Voltar
      <ArrowLeft className="h-3.5 w-3.5" />
    </Button>
  );
}
