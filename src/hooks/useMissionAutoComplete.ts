import { useEffect } from "react";
import { scopedLocal } from "@/lib/userScopedKey";

const PENDING_KEY = "pending_mission_complete";
const COMING_KEY = "coming_from_learning";

/** Save a mission ID to be auto-completed when returning to /aprendizado */
export function markMissionPending(lessonId: string) {
  scopedLocal.set(PENDING_KEY, lessonId);
  scopedLocal.set(COMING_KEY, "true");
}

/** Check and consume pending mission. Returns lessonId or null. */
export function consumePendingMission(): string | null {
  const id = scopedLocal.get(PENDING_KEY);
  if (id) scopedLocal.remove(PENDING_KEY);
  return id;
}

/** Hook: on mount, checks for pending mission and calls onComplete */
export function useMissionAutoComplete(onComplete: (lessonId: string) => void) {
  useEffect(() => {
    const pending = consumePendingMission();
    if (pending) onComplete(pending);
  }, []);
}
