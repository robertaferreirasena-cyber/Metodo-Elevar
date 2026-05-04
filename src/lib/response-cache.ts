/**
 * Response Cache for AI
 *
 * Caches responses for common/frequent queries to reduce AI calls.
 * All keys are scoped to the current user via the central helper.
 */

import { scopedSession } from "./userScopedKey";

interface CacheEntry {
  response: string;
  timestamp: number;
  hits: number;
}

const CACHE_TTL = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 100;
const CACHE_BASE = "ai_response_cache";

const CACHEABLE_PATTERNS = [
  /^(como|o que) (responder|falar|dizer).*(pre[çc]o|caro|barato)/i,
  /^(como|o que) (responder|falar|dizer).*(n[ãa]o tenho (dinheiro|grana))/i,
  /^(como|o que) (responder|falar|dizer).*(preciso pensar|vou pensar)/i,
  /^(como|o que) (responder|falar|dizer).*(j[aá] tenho|j[aá] comprei)/i,
  /^(como|o que) (responder|falar|dizer).*(n[ãa]o preciso|n[ãa]o quero)/i,
  /^(como|o que) (responder|falar|dizer).*(depois|outra hora|mais tarde)/i,
  /^(como|o que) (responder|falar|dizer).*(marido|esposa|família)/i,
  /^(o que|qual) (mensagem|msg).*(oi|ol[aá]|primeiro contato)/i,
  /^(como|o que) (abordar|iniciar).*(lead frio|cliente novo)/i,
  /^(como|o que) (responder|falar|dizer).*(concorr[eê]ncia|concorrente)/i,
  /^(como|o que) (responder|falar|dizer).*(garantia|devolu[çc][ãa]o)/i,
  /^(como|o que) (responder|falar|dizer).*(funciona|resultado)/i,
  /^(como|o que) (responder|falar|dizer).*(demora|prazo|entrega)/i,
  /^(como|o que) (criar|fazer|montar).*(oferta|promo[çc][ãa]o)/i,
  /^(como|o que) (criar|fazer|montar).*(post|story|stories)/i,
  /^(como|o que) (criar|fazer).*(bio|perfil|vitrine)/i,
  /^(qual|me d[eê]).*(script|roteiro|modelo).*(venda|abordagem)/i,
  /^(como|o que) (quebrar|contornar).*(obje[çc][ãa]o|resist[eê]ncia)/i,
  /^(como|o que) (enviar|mandar).*(proposta|or[çc]amento)/i,
];

function simpleHash(str: string): string {
  let hash = 0;
  const normalized = str.toLowerCase().trim().replace(/\s+/g, ' ');
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function isCacheable(message: string): boolean {
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(message));
}

function getCache(): Map<string, CacheEntry> {
  try {
    const stored = scopedSession.get(CACHE_BASE);
    if (!stored) return new Map();
    const parsed = JSON.parse(stored);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function saveCache(cache: Map<string, CacheEntry>): void {
  try {
    const obj: Record<string, CacheEntry> = {};
    cache.forEach((value, key) => { obj[key] = value; });
    scopedSession.set(CACHE_BASE, JSON.stringify(obj));
  } catch {
    scopedSession.remove(CACHE_BASE);
  }
}

function cleanCache(cache: Map<string, CacheEntry>): Map<string, CacheEntry> {
  const now = Date.now();
  const entries = Array.from(cache.entries());
  const validEntries = entries.filter(([_, entry]) => now - entry.timestamp < CACHE_TTL);
  validEntries.sort((a, b) => b[1].hits - a[1].hits);
  return new Map(validEntries.slice(0, MAX_CACHE_SIZE));
}

export function getCachedResponse(message: string): string | null {
  if (!isCacheable(message)) return null;
  const cache = getCache();
  const key = simpleHash(message);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    saveCache(cache);
    return null;
  }
  entry.hits++;
  cache.set(key, entry);
  saveCache(cache);
  console.log(`[Cache] HIT for: "${message.substring(0, 50)}..." (${entry.hits} hits)`);
  return entry.response;
}

export function cacheResponse(message: string, response: string): void {
  if (!isCacheable(message)) return;
  let cache = getCache();
  cache = cleanCache(cache);
  const key = simpleHash(message);
  cache.set(key, { response, timestamp: Date.now(), hits: 1 });
  saveCache(cache);
  console.log(`[Cache] STORED: "${message.substring(0, 50)}..."`);
}

export function getCacheStats(): { entries: number; totalHits: number } {
  const cache = getCache();
  let totalHits = 0;
  cache.forEach(entry => { totalHits += entry.hits; });
  return { entries: cache.size, totalHits };
}

export function clearCache(): void {
  scopedSession.remove(CACHE_BASE);
}
