import { NextRequest, NextResponse } from 'next/server';

function safePath(value: string | null, fallback = '/booking/payment-status') {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const returnPath = safePath(params.get('returnPath'));
  const redirectUrl = new URL(returnPath, appUrl);

  const orderId = params.get('orderId') || params.get('order_id') || params.get('merchant_reference');
  const paymentId = params.get('paymentId') || params.get('payment_id');
  const bookingId = params.get('bookingId') || params.get('booking_id');
  const webId = params.get('webId') || params.get('web_id');
  const flowId = params.get('flowId') || params.get('flow_id');

  if (orderId) redirectUrl.searchParams.set('orderId', orderId);
  if (paymentId) redirectUrl.searchParams.set('paymentId', paymentId);
  if (bookingId) redirectUrl.searchParams.set('bookingId', bookingId);
  if (webId) redirectUrl.searchParams.set('webId', webId);
  if (flowId) redirectUrl.searchParams.set('flowId', flowId);

  return NextResponse.redirect(redirectUrl);
}
