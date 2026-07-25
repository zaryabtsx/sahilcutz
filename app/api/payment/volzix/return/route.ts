import { NextRequest, NextResponse } from 'next/server';

function safePath(value: string | null, fallback = '/booking/payment-status') {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const returnPath = safePath(params.get('returnPath'));
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
