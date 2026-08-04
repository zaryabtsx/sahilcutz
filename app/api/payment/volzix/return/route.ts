import { NextRequest, NextResponse } from 'next/server';
import { resolveAppUrl } from '@/lib/appUrl';

function safePath(value: string | null, appUrl: string, fallback = '/booking/payment-status') {
  if (!value) return fallback;

  const decoded = value.trim();
  if (decoded.startsWith('/') && !decoded.startsWith('//')) {
    return decoded;
  }

  try {
    const url = new URL(decoded);
    const origin = new URL(appUrl).origin;
    if (url.origin === origin) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Ignore invalid absolute URLs and fall through to fallback.
  }

  return fallback;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const appUrl = resolveAppUrl(request);
  const returnPath = safePath(params.get('returnPath'), appUrl);
  const redirectUrl = new URL(returnPath, appUrl);

  const forwardingMap: Record<string, string> = {
    orderId: 'orderId',
    order_id: 'orderId',
    merchant_reference: 'orderId',
    paymentId: 'paymentId',
    payment_id: 'paymentId',
    bookingId: 'bookingId',
    booking_id: 'bookingId',
    webId: 'webId',
    web_id: 'webId',
    flowId: 'flowId',
    flow_id: 'flowId',
    status: 'paymentStatus',
    paymentStatus: 'paymentStatus',
    payment_status: 'paymentStatus',
  };

  for (const [key, value] of params.entries()) {
    if (key === 'returnPath') continue;
    const forwardedKey = forwardingMap[key] || key;
    redirectUrl.searchParams.set(forwardedKey, value);
  }

  return NextResponse.redirect(redirectUrl);
}
