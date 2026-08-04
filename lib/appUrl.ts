export function normalizeAppUrl(value: string | undefined, fallback = '') {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  return trimmed.replace(/\/+$/, '');
}

function getHeader(headers: Headers | { get?: (name: string) => string | null; [key: string]: unknown } | undefined, name: string) {
  if (!headers) return undefined;

  // Prefer the Headers-like API when available
  if (headers && typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name) || undefined;
  }

  // Fallback to an indexable object for environments that provide plain header maps
  const indexable = headers as { [key: string]: unknown } | undefined;
  const value = indexable ? indexable[name] : undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length && typeof value[0] === 'string') return value[0];
  return undefined;
}

export function resolveAppUrl(request: { headers?: Headers | { get?: (name: string) => string | null; [key: string]: unknown }; url?: string } | undefined, env: Record<string, string | undefined> = process.env) {
  const headers = request?.headers;
  const host = getHeader(headers, 'x-forwarded-host') || getHeader(headers, 'host');
  const forwardedProto = getHeader(headers, 'x-forwarded-proto') || getHeader(headers, 'x-forwarded-protocol');
  const requestUrl = typeof request?.url === 'string' ? request.url : undefined;

  if (host) {
    const proto = forwardedProto?.split(',')[0]?.trim() || (requestUrl && /^https:/i.test(requestUrl) ? 'https' : 'http');
    return `${proto}://${host}`.replace(/\/+$/, '');
  }

  const appUrl = normalizeAppUrl(
    env.NEXT_PUBLIC_APP_URL || env.APP_URL || env.NEXT_PUBLIC_SITE_URL,
    '',
  );

  if (!appUrl) {
    throw new Error('Missing application URL. Set NEXT_PUBLIC_APP_URL, APP_URL, or NEXT_PUBLIC_SITE_URL in the environment.');
  }

  return appUrl;
}
