import { useState, useEffect, useCallback, useRef } from "react";

const SESSION_METADATA_KEY = "session_metadata";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionMetadata {
  [key: string]: number; // key -> last accessed timestamp
}

/**
 * Auto-cleanup old sessions (>24h) on app load.
 * Runs once per session.
 */
function cleanupOldSessions() {
  try {
    const metadataRaw = sessionStorage.getItem(SESSION_METADATA_KEY);
    if (!metadataRaw) return;

    const metadata: SessionMetadata = JSON.parse(metadataRaw);
    const now = Date.now();
    let hasChanges = false;

    for (const key of Object.keys(metadata)) {
      if (now - metadata[key] > SESSION_MAX_AGE_MS) {
        sessionStorage.removeItem(key);
        delete metadata[key];
        hasChanges = true;
        console.log(`[Session] Cleaned up stale session: ${key}`);
      }
    }

    if (hasChanges) {
      sessionStorage.setItem(SESSION_METADATA_KEY, JSON.stringify(metadata));
    }
  } catch (error) {
    console.warn("Failed to cleanup old sessions:", error);
  }
}

// Run cleanup once on module load
cleanupOldSessions();

/**
 * Update session metadata with last access time.
 */
function updateSessionMetadata(key: string) {
  try {
    const metadataRaw = sessionStorage.getItem(SESSION_METADATA_KEY);
    const metadata: SessionMetadata = metadataRaw ? JSON.parse(metadataRaw) : {};
    metadata[key] = Date.now();
    sessionStorage.setItem(SESSION_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn("Failed to update session metadata:", error);
  }
}

/**
 * Remove session from metadata.
 */
function removeSessionMetadata(key: string) {
  try {
    const metadataRaw = sessionStorage.getItem(SESSION_METADATA_KEY);
    if (!metadataRaw) return;
    
    const metadata: SessionMetadata = JSON.parse(metadataRaw);
    delete metadata[key];
    sessionStorage.setItem(SESSION_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn("Failed to remove session metadata:", error);
  }
}

/**
 * Limpa todas as sessões armazenadas no sessionStorage.
 * Usado para limpeza manual ou automática (cada 48h).
 */
export function clearAllSessions(): void {
  try {
    const metadataRaw = sessionStorage.getItem(SESSION_METADATA_KEY);
    if (metadataRaw) {
      const metadata: SessionMetadata = JSON.parse(metadataRaw);
      for (const key of Object.keys(metadata)) {
        sessionStorage.removeItem(key);
      }
    }
    sessionStorage.removeItem(SESSION_METADATA_KEY);
    console.log("[Session] Todas as sessões foram limpas");
  } catch (error) {
    console.warn("Falha ao limpar sessões:", error);
  }
}

/**
 * Hook for persisting state to sessionStorage with debounce.
 * State is automatically restored on mount and saved on changes.
 * Sessions older than 24h are automatically cleaned up.
 * 
 * @param key - Unique key for sessionStorage
 * @param initialState - Default state if nothing is stored
 * @param debounceMs - Debounce delay for saving (default: 500ms)
 */
export function useSessionPersistence<T>(
  key: string,
  initialState: T,
  debounceMs: number = 500
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        updateSessionMetadata(key); // Mark as recently accessed
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`Failed to restore session for ${key}:`, error);
    }
    return initialState;
  });

  const [hasRestoredSession, setHasRestoredSession] = useState(() => {
    try {
      return sessionStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Debounced save to sessionStorage
  useEffect(() => {
    // Skip first render to avoid saving initial state immediately
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(state));
        updateSessionMetadata(key); // Update last access time
      } catch (error) {
        console.warn(`Failed to save session for ${key}:`, error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, key, debounceMs]);

  // Clear session
  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      removeSessionMetadata(key);
      setState(initialState);
      setHasRestoredSession(false);
    } catch (error) {
      console.warn(`Failed to clear session for ${key}:`, error);
    }
  }, [key, initialState]);

  return [state, setState, clearSession, hasRestoredSession];
}

/**
 * Simplified hook for persisting chat-like state.
 * Includes messages and conversationId.
 */
export interface ChatSessionState {
  messages: Array<{ role: "user" | "assistant"; content: string; id?: string }>;
  conversationId: string | null;
}

const EMPTY_CHAT_STATE: ChatSessionState = {
  messages: [],
  conversationId: null,
};

export function useChatSessionPersistence(key: string) {
  return useSessionPersistence<ChatSessionState>(key, EMPTY_CHAT_STATE);
}
