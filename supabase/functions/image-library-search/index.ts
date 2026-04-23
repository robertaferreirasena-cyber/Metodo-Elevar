// Edge Function: image-library-search
// Proxies stock-photo searches to Unsplash + Pexels (free APIs).
// Returns a unified list of images. JWT-protected.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ImageResult {
  id: string;
  url: string;          // full-size url
  thumbUrl: string;     // small/preview url
  author: string;
  authorUrl?: string;
  sourceUrl: string;    // page on Unsplash/Pexels
  source: "unsplash" | "pexels";
  width: number;
  height: number;
  alt?: string;
}

const UNSPLASH_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
const PEXELS_KEY = Deno.env.get("PEXELS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// In-memory cache (5 min) — best-effort per worker instance
const cache = new Map<string, { ts: number; data: ImageResult[] }>();
const TTL = 5 * 60 * 1000;

async function searchUnsplash(query: string, orientation: string, page: number): Promise<ImageResult[]> {
  if (!UNSPLASH_KEY) {
    console.warn("UNSPLASH_ACCESS_KEY not configured");
    return [];
  }
  const o = orientation === "9:16" ? "portrait" : orientation === "16:9" ? "landscape" : "squarish";
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=${o}`;
  const r = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
  if (!r.ok) {
    console.error(`Unsplash error ${r.status}: ${await r.text().catch(() => "")}`);
    return [];
  }
  const j = await r.json();
  return (j.results || []).map((p: any): ImageResult => ({
    id: `u_${p.id}`,
    url: p.urls?.regular || p.urls?.full,
    thumbUrl: p.urls?.small || p.urls?.thumb,
    author: p.user?.name || "Unsplash",
    authorUrl: p.user?.links?.html,
    sourceUrl: p.links?.html,
    source: "unsplash",
    width: p.width, height: p.height,
    alt: p.alt_description || query,
  }));
}

async function searchPexels(query: string, orientation: string, page: number): Promise<ImageResult[]> {
  if (!PEXELS_KEY) {
    console.warn("PEXELS_API_KEY not configured");
    return [];
  }
  const o = orientation === "9:16" ? "portrait" : orientation === "16:9" ? "landscape" : "square";
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=${o}`;
  const r = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!r.ok) {
    console.error(`Pexels error ${r.status}: ${await r.text().catch(() => "")}`);
    return [];
  }
  const j = await r.json();
  return (j.photos || []).map((p: any): ImageResult => ({
    id: `p_${p.id}`,
    url: p.src?.large2x || p.src?.large,
    thumbUrl: p.src?.medium || p.src?.small,
    author: p.photographer || "Pexels",
    authorUrl: p.photographer_url,
    sourceUrl: p.url,
    source: "pexels",
    width: p.width, height: p.height,
    alt: p.alt || query,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // JWT auth
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = auth.slice(7);
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    });
    if (!userResp.ok) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "search";

    // ===== PROXY DOWNLOAD (avoid CORS / convert to data URL) =====
    if (action === "fetch") {
      const targetUrl = String(body.url || "");
      if (!/^https:\/\/(images\.unsplash\.com|images\.pexels\.com)/.test(targetUrl)) {
        return new Response(JSON.stringify({ error: "URL not allowed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await fetch(targetUrl);
      if (!r.ok) {
        return new Response(JSON.stringify({ error: `Fetch failed ${r.status}` }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const buf = new Uint8Array(await r.arrayBuffer());
      const mime = r.headers.get("content-type") || "image/jpeg";
      // base64 encode
      let bin = "";
      const chunk = 0x8000;
      for (let i = 0; i < buf.length; i += chunk) {
        bin += String.fromCharCode(...buf.subarray(i, i + chunk));
      }
      const b64 = btoa(bin);
      return new Response(JSON.stringify({ dataUrl: `data:${mime};base64,${b64}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== SEARCH =====
    const query = String(body.query || "").trim();
    const orientation = String(body.orientation || "1:1");
    const page = Math.max(1, Number(body.page || 1));
    if (!query) {
      return new Response(JSON.stringify({ images: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = `${query}|${orientation}|${page}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < TTL) {
      return new Response(JSON.stringify({ images: hit.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [u, p] = await Promise.all([
      searchUnsplash(query, orientation, page).catch(() => []),
      searchPexels(query, orientation, page).catch(() => []),
    ]);

    // Interleave for variety
    const merged: ImageResult[] = [];
    const max = Math.max(u.length, p.length);
    for (let i = 0; i < max; i++) {
      if (u[i]) merged.push(u[i]);
      if (p[i]) merged.push(p[i]);
    }

    cache.set(cacheKey, { ts: Date.now(), data: merged });

    return new Response(JSON.stringify({ images: merged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("image-library-search error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
