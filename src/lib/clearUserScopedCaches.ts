import { scopedLocal, scopedSession } from "./userScopedKey";
import { queryClient } from "./queryClient";

/**
 * Wipes every client-side cache that may contain user-scoped data.
 *
 * - allUsers=true → removes ALL `u:*::` namespaced keys (used on logout
 *   and when we detect a different user logged in on the same browser).
 * - allUsers=false → removes only the current user's namespaced keys.
 *
 * Always also: clears React Query cache and a small set of legacy
 * non-namespaced keys we know about.
 */
const LEGACY_KEYS = [
  "pending_mission_complete",
  "coming_from_learning",
  "carousel_drafts",
  "ai_response_cache",
];
const LEGACY_PREFIXES = [
  "elevar_completed_",
  "manychat_api_key_",
  "img_lib_cache_v1::",
];

function purgeLegacy(storage: Storage) {
  try {
    for (const k of LEGACY_KEYS) storage.removeItem(k);
    const toRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && LEGACY_PREFIXES.some((p) => k.startsWith(p))) toRemove.push(k);
    }
    for (const k of toRemove) storage.removeItem(k);
  } catch { /* ignore */ }
}

export function clearUserScopedCaches({ allUsers = false }: { allUsers?: boolean } = {}) {
  try {
    if (allUsers) {
      scopedSession.clearAllForAnyUser();
      scopedLocal.clearAllForAnyUser();
    } else {
      scopedSession.clearAllForCurrentUser();
      scopedLocal.clearAllForCurrentUser();
    }
  } catch { /* ignore */ }

  try { purgeLegacy(sessionStorage); } catch { /* ignore */ }
  try { purgeLegacy(localStorage); } catch { /* ignore */ }

  try {
    queryClient.cancelQueries();
    queryClient.removeQueries();
    queryClient.clear();
  } catch { /* ignore */ }
}
