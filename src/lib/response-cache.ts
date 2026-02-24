/**
 * Response Cache for AI
 * 
 * Caches responses for common/frequent queries to reduce AI calls.
 * Uses hash-based lookup with TTL expiration.
 */

interface CacheEntry {
  response: string;
  timestamp: number;
  hits: number;
}

// Cache TTL: 1 hour for responses
const CACHE_TTL = 60 * 60 * 1000;

// Max cache size
const MAX_CACHE_SIZE = 100;

// In-memory cache (persisted to sessionStorage)
const CACHE_KEY = 'ai_response_cache';

// Common objection patterns that should be cached
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
  // Expanded patterns for more cache hits
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

// Simple hash function for cache keys
function simpleHash(str: string): string {
  let hash = 0;
  const normalized = str.toLowerCase().trim().replace(/\s+/g, ' ');
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString(36);
}

// Check if a message should be cacheable
export function isCacheable(message: string): boolean {
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(message));
}

// Get cache from storage
function getCache(): Map<string, CacheEntry> {
  try {
    const stored = sessionStorage.getItem(CACHE_KEY);
    if (!stored) return new Map();
    
    const parsed = JSON.parse(stored);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

// Save cache to storage
function saveCache(cache: Map<string, CacheEntry>): void {
  try {
    // Convert Map to object for JSON serialization
    const obj: Record<string, CacheEntry> = {};
    cache.forEach((value, key) => {
      obj[key] = value;
    });
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    // Storage full or unavailable, clear old entries
    sessionStorage.removeItem(CACHE_KEY);
  }
}

// Clean expired entries and enforce max size
function cleanCache(cache: Map<string, CacheEntry>): Map<string, CacheEntry> {
  const now = Date.now();
  const entries = Array.from(cache.entries());
  
  // Remove expired entries
  const validEntries = entries.filter(([_, entry]) => now - entry.timestamp < CACHE_TTL);
  
  // Sort by hits (descending) and trim to max size
  validEntries.sort((a, b) => b[1].hits - a[1].hits);
  
  return new Map(validEntries.slice(0, MAX_CACHE_SIZE));
}

// Get cached response
export function getCachedResponse(message: string): string | null {
  if (!isCacheable(message)) return null;
  
  const cache = getCache();
  const key = simpleHash(message);
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    saveCache(cache);
    return null;
  }
  
  // Increment hit counter
  entry.hits++;
  cache.set(key, entry);
  saveCache(cache);
  
  console.log(`[Cache] HIT for: "${message.substring(0, 50)}..." (${entry.hits} hits)`);
  return entry.response;
}

// Store response in cache
export function cacheResponse(message: string, response: string): void {
  if (!isCacheable(message)) return;
  
  let cache = getCache();
  cache = cleanCache(cache);
  
  const key = simpleHash(message);
  cache.set(key, {
    response,
    timestamp: Date.now(),
    hits: 1,
  });
  
  saveCache(cache);
  console.log(`[Cache] STORED: "${message.substring(0, 50)}..."`);
}

// Get cache stats
export function getCacheStats(): { entries: number; totalHits: number } {
  const cache = getCache();
  let totalHits = 0;
  
  cache.forEach(entry => {
    totalHits += entry.hits;
  });
  
  return { entries: cache.size, totalHits };
}

// Clear cache
export function clearCache(): void {
  sessionStorage.removeItem(CACHE_KEY);
}
