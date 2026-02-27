import express from 'express';

const router = express.Router();

/** Validate URL for SSRF prevention */
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local'))
      return false;
    if (/^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\./.test(host))
      return false;
    return true;
  } catch {
    return false;
  }
}

/** GET /api/proxy/image?url=... - Proxy external images to bypass hotlink blocking (e.g. Facebook CDN 403) */
router.get('/image', async (req, res) => {
  const rawUrl = req.query.url;
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return res.status(400).json({ message: 'Missing url parameter' });
  }

  let url: string;
  try {
    url = decodeURIComponent(rawUrl.trim());
  } catch {
    return res.status(400).json({ message: 'Invalid url encoding' });
  }

  if (!isValidImageUrl(url)) {
    return res.status(400).json({ message: 'Invalid or disallowed url' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isFbCdn = host.includes('fbcdn.net') || host.includes('facebook.com') || host.includes('fb.com');

    const proxyRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        ...(isFbCdn && {
          Referer: 'https://www.facebook.com/',
          Origin: 'https://www.facebook.com',
        }),
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!proxyRes.ok) {
      return res.status(proxyRes.status).json({
        message: `Upstream returned ${proxyRes.status}`,
      });
    }

    const contentType = proxyRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache

    const buffer = await proxyRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return res.status(504).json({ message: 'Image fetch timeout' });
    }
    return res.status(502).json({ message: 'Failed to fetch image' });
  }
});

export default router;
