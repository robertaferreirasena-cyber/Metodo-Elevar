import { useEffect } from "react";

const PENDING_KEY = "pending_mission_complete";

/** Save a mission ID to be auto-completed when returning to /aprendizado */
export function markMissionPending(lessonId: string) {
  localStorage.setItem(PENDING_KEY, lessonId);
}

/** Check and consume pending mission. Returns lessonId or null. */
export function consumePendingMission(): string | null {
  const id = localStorage.getItem(PENDING_KEY);
  if (id) localStorage.removeItem(PENDING_KEY);
  return id;
}

/** Hook: on mount, checks for pending mission and calls onComplete */
export function useMissionAutoComplete(onComplete: (lessonId: string) => void) {
  useEffect(() => {
    const pending = consumePendingMission();
    if (pending) {
      onComplete(pending);
    }
  }, []);
}
