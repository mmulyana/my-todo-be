export type LinkPreviewData = {
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
};

const META_TAG = /<meta\b[^>]*>/gi;
const LINK_TAG = /<link\b[^>]*>/gi;
const TITLE_TAG = /<title[^>]*>([\s\S]*?)<\/title>/i;

const ATTR = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

/** Reads a tag's attributes into a lowercase-keyed map. */
function attrsOf(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  ATTR.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR.exec(tag)) !== null) {
    const value = match[3] ?? match[4] ?? match[5] ?? '';
    result[match[1].toLowerCase()] = value.trim();
  }
  return result;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .trim();
}

function firstNonEmpty(...values: (string | undefined)[]): string {
  return values.find((value) => value && value.length > 0) ?? '';
}

/** Turns a relative asset path into an absolute URL so other origins can load it. */
function resolve(base: URL, href: string): string {
  if (!href) return '';
  try {
    const abs = new URL(href, base);
    if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return '';
    return abs.toString();
  } catch {
    return '';
  }
}

/** Pages ship several icons; keep the biggest, cards render at 2x on retina. */
function iconSizeRank(sizes: string, rel: string): number {
  const normalized = sizes.trim().toLowerCase();
  if (!normalized) return rel.includes('apple-touch-icon') ? 180 : 1;
  if (normalized === 'any') return 512;
  const width = /^(\d+)x/.exec(normalized)?.[1];
  return width ? Number(width) : 1;
}

export function defaultFavicon(url: URL): string {
  return new URL('/favicon.ico', url).toString();
}

export function fallbackPreview(url: URL): LinkPreviewData {
  const host = url.hostname.replace(/^www\./, '');
  return {
    url: url.toString(),
    title: host,
    description: null,
    image: null,
    favicon: defaultFavicon(url),
    siteName: host,
  };
}

/**
 * One pass over the markup: OpenGraph wins, then the Twitter card, and finally
 * <title> / <meta description>.
 */
export function buildPreview(html: string, base: URL): LinkPreviewData {
  let ogTitle = '';
  let ogDesc = '';
  let ogImage = '';
  let ogSite = '';
  let twTitle = '';
  let twDesc = '';
  let twImage = '';
  let metaDesc = '';
  let iconHref = '';
  let iconRank = 0;

  for (const tag of html.match(META_TAG) ?? []) {
    const meta = attrsOf(tag);
    const key = (meta.property || meta.name || '').toLowerCase();
    const content = decodeEntities(meta.content ?? '');
    if (!content) continue;

    switch (key) {
      case 'og:title':
        ogTitle ||= content;
        break;
      case 'og:description':
        ogDesc ||= content;
        break;
      case 'og:image':
      case 'og:image:url':
      case 'og:image:secure_url':
        ogImage ||= content;
        break;
      case 'og:site_name':
        ogSite ||= content;
        break;
      case 'twitter:title':
        twTitle ||= content;
        break;
      case 'twitter:description':
        twDesc ||= content;
        break;
      case 'twitter:image':
      case 'twitter:image:src':
        twImage ||= content;
        break;
      case 'description':
        metaDesc ||= content;
        break;
    }
  }

  for (const tag of html.match(LINK_TAG) ?? []) {
    const link = attrsOf(tag);
    const rel = (link.rel ?? '').toLowerCase();
    if (!rel.includes('icon') || rel.includes('mask-icon')) continue;
    const href = link.href ?? '';
    if (!href) continue;

    const rank = iconSizeRank(link.sizes ?? '', rel);
    if (rank >= iconRank) {
      iconRank = rank;
      iconHref = href;
    }
  }

  const docTitle = decodeEntities(TITLE_TAG.exec(html)?.[1] ?? '');
  const host = base.hostname.replace(/^www\./, '');
  const favicon = resolve(base, iconHref) || defaultFavicon(base);

  return {
    url: base.toString(),
    title: firstNonEmpty(ogTitle, twTitle, docTitle, host),
    description: firstNonEmpty(ogDesc, twDesc, metaDesc) || null,
    image: resolve(base, firstNonEmpty(ogImage, twImage)) || null,
    favicon,
    siteName: firstNonEmpty(ogSite, host) || null,
  };
}
