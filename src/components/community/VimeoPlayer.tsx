/**
 * Embeds a Vimeo video given any common URL form:
 *   - https://vimeo.com/123456789
 *   - https://vimeo.com/123456789/abcdef0123    (privacy hash)
 *   - https://player.vimeo.com/video/123456789
 *   - https://vimeo.com/channels/foo/123456789
 */
export function extractVimeoId(url: string): { id: string; hash?: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (!/vimeo\.com$/i.test(u.hostname) && !/player\.vimeo\.com$/i.test(u.hostname)) {
      return null;
    }
    const parts = u.pathname.split('/').filter(Boolean);
    // player.vimeo.com/video/<id>
    const videoIdx = parts.indexOf('video');
    if (videoIdx >= 0 && parts[videoIdx + 1] && /^\d+$/.test(parts[videoIdx + 1])) {
      return { id: parts[videoIdx + 1], hash: parts[videoIdx + 2] };
    }
    // vimeo.com/<id>[/<hash>]
    const numericIdx = parts.findIndex(p => /^\d+$/.test(p));
    if (numericIdx >= 0) {
      return { id: parts[numericIdx], hash: parts[numericIdx + 1] };
    }
    return null;
  } catch {
    return null;
  }
}

export function isVimeoUrl(url: string): boolean {
  return !!extractVimeoId(url);
}

interface VimeoPlayerProps {
  url: string;
  title?: string;
}

export function VimeoPlayer({ url, title }: VimeoPlayerProps) {
  const parsed = extractVimeoId(url);
  if (!parsed) {
    return (
      <div className="aspect-video flex items-center justify-center bg-muted rounded-lg text-sm text-muted-foreground">
        URL do Vimeo inválida
      </div>
    );
  }

  const src = `https://player.vimeo.com/video/${parsed.id}${parsed.hash ? `?h=${parsed.hash}&` : '?'}dnt=1&title=0&byline=0&portrait=0`;

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-black shadow-lg">
      <iframe
        src={src}
        title={title || 'Vimeo video player'}
        className="absolute top-0 left-0 w-full h-full"
        frameBorder={0}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
        allowFullScreen
      />
    </div>
  );
}
