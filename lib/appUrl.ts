export function normalizeAppUrl(value: string | undefined, fallback = 'http://localhost:3000') {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  return trimmed.replace(/\/+$/, '');
}

function getHeader(headers: Headers | { get?: (name: string) => string | null; [key: string]: unknown } | undefined, name: string) {
  if (!headers) return undefined;

  if (typeof headers.get === 'function') {
    return headers.get(name) || undefined;
  }

  if (typeof headers[name] === 'string') {
    return headers[name];
  }

  if (Array.isArray(headers[name])) {
    return headers[name][0];
  }

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

  return normalizeAppUrl(
    env.NEXT_PUBLIC_APP_URL || env.APP_URL || env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
  );
}
