import { lookup as dnsLookup } from 'node:dns';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import type { IncomingMessage } from 'node:http';
import type { LookupAddress } from 'node:dns';

// note: etadata lives in <head>, so reading stops there; the cap is only a backstop
// for pages that never close it (YouTube alone ships ~700KB before </head>).
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const HEAD_END = Buffer.from('</head>', 'latin1');
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = 'my-todo-linkbot/1.0 (+link preview)';

export class UnsupportedSchemeError extends Error {
  constructor() {
    super('only http and https links can be previewed');
  }
}

export class BlockedHostError extends Error {
  constructor() {
    super('that address is not reachable');
  }
}

export class FetchFailedError extends Error {
  constructor() {
    super('could not read that page');
  }
}

export type FetchedPage = {
  finalUrl: URL;
  html: string | null;
};

function isPublicIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b, c] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 169 && b === 254) return false; // link-local
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
    if (a === 192 && b === 0 && c === 0) return false; // IETF protocol assignments
    if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
    if (a >= 224) return false; // multicast + reserved
    return true;
  }

  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::' || normalized === '::1') return false;
    if (normalized.startsWith('fe80')) return false; // link-local
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return false; // unique local
    if (normalized.startsWith('ff')) return false; // multicast
    // ::ffff:10.0.0.1 and friends map straight back to v4 space
    const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicIp(mapped[1]);
    return true;
  }

  return false;
}

/**
 * SSRF guard: the IP is what gets checked, not the hostname, so DNS rebinding
 * cannot slip through and it runs again on every redirect.
 */
const safeLookup: typeof dnsLookup = ((
  hostname: string,
  options: unknown,
  callback: (
    err: NodeJS.ErrnoException | null,
    address?: string | LookupAddress[],
    family?: number,
  ) => void,
) => {
  dnsLookup(hostname, { all: true }, (err, addresses) => {
    if (err || !addresses?.length) {
      callback(new BlockedHostError());
      return;
    }

    const safe = addresses.find((entry) => isPublicIp(entry.address));
    if (!safe) {
      callback(new BlockedHostError());
      return;
    }

    const wantsAll =
      typeof options === 'object' && options !== null && 'all' in options
        ? (options as { all?: boolean }).all
        : false;

    if (wantsAll) {
      callback(null, [safe]);
      return;
    }
    callback(null, safe.address, safe.family);
  });
}) as typeof dnsLookup;

function guardScheme(url: URL): void {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsupportedSchemeError();
  }
  if (!url.hostname) {
    throw new UnsupportedSchemeError();
  }
}

function requestOnce(url: URL): Promise<IncomingMessage> {
  const request = url.protocol === 'https:' ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: 'GET',
        lookup: safeLookup,
        timeout: FETCH_TIMEOUT_MS,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml;q=0.9',
          'Accept-Language': 'en;q=0.8',
        },
      },
      resolve,
    );

    req.on('timeout', () => req.destroy(new FetchFailedError()));
    req.on('error', reject);
    req.end();
  });
}

async function readBody(res: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  // </head> can straddle two chunks, so each search starts a little early.
  let searchFrom = 0;

  for await (const chunk of res) {
    const buf = chunk as Buffer;
    chunks.push(buf);
    size += buf.length;

    const seen = Buffer.concat(chunks);
    if (seen.indexOf(HEAD_END, searchFrom) !== -1) {
      res.destroy();
      return seen;
    }
    searchFrom = Math.max(0, seen.length - HEAD_END.length);

    if (size >= MAX_BODY_BYTES) {
      res.destroy();
      break;
    }
  }

  return Buffer.concat(chunks).subarray(0, MAX_BODY_BYTES);
}

function decode(body: Buffer, contentType: string): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType)?.[1];
  const head = body.subarray(0, 4096).toString('latin1');
  const fromMeta =
    /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ??
    /charset=["']?([\w-]+)/i.exec(head)?.[1];

  const label = (fromHeader ?? fromMeta ?? 'utf-8').toLowerCase();
  try {
    return new TextDecoder(label).decode(body);
  } catch {
    return body.toString('utf-8');
  }
}

/**
 * Follows redirects by hand so the SSRF guard and the scheme check run on every
 * hop, and returns the final URL the base for relative og:image paths.
 */
export async function fetchPage(raw: string): Promise<FetchedPage> {
  let current: URL;
  try {
    current = new URL(raw.trim());
  } catch {
    throw new UnsupportedSchemeError();
  }
  guardScheme(current);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: IncomingMessage;
    try {
      res = await requestOnce(current);
    } catch (error) {
      if (error instanceof BlockedHostError) throw error;
      throw new FetchFailedError();
    }

    const status = res.statusCode ?? 0;
    const location = res.headers.location;

    if (status >= 300 && status < 400 && location) {
      res.destroy();
      if (hop === MAX_REDIRECTS) throw new FetchFailedError();
      try {
        current = new URL(location, current);
      } catch {
        throw new FetchFailedError();
      }
      guardScheme(current);
      continue;
    }

    if (status < 200 || status >= 300) {
      res.destroy();
      throw new FetchFailedError();
    }

    const contentType = String(res.headers['content-type'] ?? '').toLowerCase();
    if (
      contentType &&
      !contentType.includes('text/html') &&
      !contentType.includes('xhtml')
    ) {
      // An image or a PDF has no <head> — the URL is all we can use.
      res.destroy();
      return { finalUrl: current, html: null };
    }

    const body = await readBody(res);
    return { finalUrl: current, html: decode(body, contentType) };
  }

  throw new FetchFailedError();
}
