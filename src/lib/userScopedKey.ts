/**
 * Central helper for namespacing all client-side cache keys by current user.
 *
 * Why: when two different users log in on the same browser, we must NEVER
 * read keys written by the previous user. Every storage write goes through
 * `scopedKey(base)` which prefixes the key with `u:<userId>::`.
 *
 * Note: the Supabase auth token itself is managed by the SDK and lives at
 * a fixed key — we do NOT touch it here.
 */

const PREFIX = "u:";
const SEP = "::";
const ANON = "anon";

let currentUserId: string | null = null;

export function setCurrentUserId(id: string | null): void {
  const previous = currentUserId;
  currentUserId = id;
  if (previous !== id && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("app:user-changed", { detail: { previous, current: id } })
    );
  }
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function scopedKey(base: string): string {
  return `${PREFIX}${currentUserId ?? ANON}${SEP}${base}`;
}

function isScopedKey(key: string): boolean {
  return key.startsWith(PREFIX) && key.includes(SEP);
}

function clearAllForCurrentUser(storage: Storage) {
  const id = currentUserId ?? ANON;
  const userPrefix = `${PREFIX}${id}${SEP}`;
  const toRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && k.startsWith(userPrefix)) toRemove.push(k);
  }
  for (const k of toRemove) storage.removeItem(k);
}

function clearAllForAnyUser(storage: Storage) {
  const toRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && isScopedKey(k)) toRemove.push(k);
  }
  for (const k of toRemove) storage.removeItem(k);
}

function makeWrapper(getStorage: () => Storage) {
  return {
    get(base: string): string | null {
      try { return getStorage().getItem(scopedKey(base)); } catch { return null; }
    },
    set(base: string, value: string): void {
      try { getStorage().setItem(scopedKey(base), value); } catch { /* quota */ }
    },
    remove(base: string): void {
      try { getStorage().removeItem(scopedKey(base)); } catch { /* ignore */ }
    },
    /** Direct access using a fully-formed scoped key (already includes u:<id>::). */
    getRaw(rawScoped: string): string | null {
      try { return getStorage().getItem(rawScoped); } catch { return null; }
    },
    setRaw(rawScoped: string, value: string): void {
      try { getStorage().setItem(rawScoped, value); } catch { /* quota */ }
    },
    removeRaw(rawScoped: string): void {
      try { getStorage().removeItem(rawScoped); } catch { /* ignore */ }
    },
    /** List all keys currently in this storage that belong to the current user. */
    listKeysForCurrentUser(): string[] {
      const id = currentUserId ?? ANON;
      const p = `${PREFIX}${id}${SEP}`;
      const out: string[] = [];
      const s = getStorage();
      try {
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (k && k.startsWith(p)) out.push(k);
        }
      } catch { /* ignore */ }
      return out;
    },
    clearAllForCurrentUser(): void {
      try { clearAllForCurrentUser(getStorage()); } catch { /* ignore */ }
    },
    clearAllForAnyUser(): void {
      try { clearAllForAnyUser(getStorage()); } catch { /* ignore */ }
    },
  };
}

export const scopedSession = makeWrapper(() => sessionStorage);
export const scopedLocal = makeWrapper(() => localStorage);
