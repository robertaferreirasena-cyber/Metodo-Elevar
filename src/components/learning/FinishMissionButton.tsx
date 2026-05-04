import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { consumePendingMission } from "@/hooks/useMissionAutoComplete";
import { scopedLocal } from "@/lib/userScopedKey";

const COMING_FROM_KEY = "coming_from_learning";

export function setComingFromLearning() {
  scopedLocal.set(COMING_FROM_KEY, "true");
}

export function isComingFromLearning(): boolean {
  return scopedLocal.get(COMING_FROM_KEY) === "true";
}

export function clearComingFromLearning() {
  scopedLocal.remove(COMING_FROM_KEY);
}

export default function FinishMissionButton() {
  const navigate = useNavigate();

  if (!isComingFromLearning()) return null;

  const handleFinish = () => {
    clearComingFromLearning();
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
