import { useState, useEffect, useCallback, useRef } from "react";
import { scopedSession, scopedKey } from "@/lib/userScopedKey";

const SESSION_METADATA_BASE = "session_metadata";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface SessionMetadata {
  [key: string]: number;
}

function readMetadata(): SessionMetadata {
  try {
    const raw = scopedSession.get(SESSION_METADATA_BASE);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeMetadata(metadata: SessionMetadata) {
  try { scopedSession.set(SESSION_METADATA_BASE, JSON.stringify(metadata)); } catch { /* ignore */ }
}

function cleanupOldSessions() {
  try {
    const metadata = readMetadata();
    const now = Date.now();
    let hasChanges = false;
    for (const k of Object.keys(metadata)) {
      if (now - metadata[k] > SESSION_MAX_AGE_MS) {
        scopedSession.removeRaw(k);
        delete metadata[k];
        hasChanges = true;
      }
    }
    if (hasChanges) writeMetadata(metadata);
  } catch { /* ignore */ }
}

cleanupOldSessions();

function updateSessionMetadata(rawScopedKey: string) {
  const m = readMetadata();
  m[rawScopedKey] = Date.now();
  writeMetadata(m);
}

function removeSessionMetadata(rawScopedKey: string) {
  const m = readMetadata();
  delete m[rawScopedKey];
  writeMetadata(m);
}

/** Limpa todas as sessões do usuário atual. */
export function clearAllSessions(): void {
  try {
    scopedSession.clearAllForCurrentUser();
  } catch { /* ignore */ }
}

/**
 * Hook for persisting state to sessionStorage with debounce.
 * Keys are automatically scoped to the current user via scopedKey().
 */
export function useSessionPersistence<T>(
  key: string,
  initialState: T,
  debounceMs: number = 500,
  storageType: "session" | "local" = "session"
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const storage = storageType === "local" ? scopedLocal : scopedSession;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = scopedSession.get(key);
      if (stored) {
        updateSessionMetadata(scopedKey(key));
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`Failed to restore session for ${key}:`, error);
    }
    return initialState;
  });

  const [hasRestoredSession, setHasRestoredSession] = useState(() => {
    try { return scopedSession.get(key) !== null; } catch { return false; }
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        scopedSession.set(key, JSON.stringify(state));
        updateSessionMetadata(scopedKey(key));
      } catch (error) {
        console.warn(`Failed to save session for ${key}:`, error);
      }
    }, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state, key, debounceMs]);

  const clearSession = useCallback(() => {
    try {
      scopedSession.remove(key);
      removeSessionMetadata(scopedKey(key));
      setState(initialState);
      setHasRestoredSession(false);
    } catch (error) {
      console.warn(`Failed to clear session for ${key}:`, error);
    }
  }, [key, initialState]);

  return [state, setState, clearSession, hasRestoredSession];
}

export interface ChatSessionState {
  messages: Array<{ role: "user" | "assistant"; content: string; id?: string }>;
  conversationId: string | null;
}

const EMPTY_CHAT_STATE: ChatSessionState = { messages: [], conversationId: null };

export function useChatSessionPersistence(key: string) {
  return useSessionPersistence<ChatSessionState>(key, EMPTY_CHAT_STATE);
}
