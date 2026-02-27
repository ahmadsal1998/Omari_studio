/** Hosts that block hotlinking (e.g. Facebook CDN returns 403 when embedded) */
const PROXY_NEEDED_HOSTS = [
  'scontent.',
  'fbcdn.net',
  'facebook.com',
  'fb.watch',
  'fb.com',
  'cdninstagram.com',
];

/**
 * Returns the image URL, using our proxy for external URLs that block hotlinking.
 * Use this for all images that may come from Facebook/Instagram CDNs.
 */
export function getImageUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const needsProxy = PROXY_NEEDED_HOSTS.some((h) => host.includes(h));
    if (needsProxy) {
      return `/api/proxy/image?url=${encodeURIComponent(url)}`;
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Use as onError on <img> when src is from getImageUrl. If the proxy returns 403,
 * tries loading the raw URL directly (browser referrer sometimes works when proxy does not).
 */
export function imageProxyOnError(rawUrl: string | undefined): (e: React.SyntheticEvent<HTMLImageElement>) => void {
  return (e) => {
    const el = e.currentTarget;
    if (!rawUrl || el.dataset.proxyFallbackTried === '1') return;
    el.dataset.proxyFallbackTried = '1';
    el.src = rawUrl;
  };
}
