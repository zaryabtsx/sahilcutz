function normalizeAppUrl(value, fallback = '') {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  return trimmed.replace(/\/+$/, '');
}

function getHeader(headers, name) {
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

function resolveAppUrl(request, env = process.env) {
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

module.exports = {
  getHeader,
  normalizeAppUrl,
  resolveAppUrl,
};
