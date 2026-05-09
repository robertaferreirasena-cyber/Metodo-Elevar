import { useState, useEffect, useCallback, useRef } from "react";
import { scopedSession, scopedKey } from "@/lib/userScopedKey";

/**
 * Bump this whenever the shape of any persisted session payload changes.
 * Old (un-suffixed or older-suffix) keys are purged on boot, so users never
 * see stale state shaped for a previous version of the UI.
 */
const SESSION_SCHEMA_VERSION = "v2";
const versionedKey = (key: string) => `${key}@${SESSION_SCHEMA_VERSION}`;

const SESSION_METADATA_BASE = `session_metadata@${SESSION_SCHEMA_VERSION}`;
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Remove every scoped session entry that does NOT carry the current schema suffix. */
function purgeStaleSchemaSessions() {
  try {
    const keys = scopedSession.listKeysForCurrentUser();
    const suffix = `@${SESSION_SCHEMA_VERSION}`;
    for (const k of keys) {
      // k looks like `u:<id>::<base>` — keep only those whose <base> ends with the current suffix.
      const sepIdx = k.indexOf("::");
      const base = sepIdx >= 0 ? k.slice(sepIdx + 2) : k;
      if (!base.endsWith(suffix)) scopedSession.removeRaw(k);
    }
  } catch { /* ignore */ }
}
purgeStaleSchemaSessions();

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
  debounceMs: number = 500
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const vKey = versionedKey(key);
  const [state, setState] = useState<T>(() => {
    try {
      const stored = scopedSession.get(vKey);
      if (stored) {
        updateSessionMetadata(scopedKey(vKey));
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`Failed to restore session for ${vKey}:`, error);
    }
    return initialState;
  });

  const [hasRestoredSession, setHasRestoredSession] = useState(() => {
    try { return scopedSession.get(vKey) !== null; } catch { return false; }
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
        scopedSession.set(vKey, JSON.stringify(state));
        updateSessionMetadata(scopedKey(vKey));
      } catch (error) {
        console.warn(`Failed to save session for ${vKey}:`, error);
      }
    }, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state, vKey, debounceMs]);

  const clearSession = useCallback(() => {
    try {
      scopedSession.remove(vKey);
      removeSessionMetadata(scopedKey(vKey));
      setState(initialState);
      setHasRestoredSession(false);
    } catch (error) {
      console.warn(`Failed to clear session for ${vKey}:`, error);
    }
  }, [vKey, initialState]);

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
