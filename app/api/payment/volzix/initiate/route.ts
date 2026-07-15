import { NextRequest, NextResponse } from 'next/server';
import {
  createPayment,
  generateOrderId,
  generateWebId,
  getAdvancePaymentAmount,
} from '@/lib/volzix';
import { getServerClient } from '@/lib/volzix-server';

function safePath(value: unknown, fallback = '/booking/payment-status') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : fallback;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDuplicateWebIdError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'status' in error && error.status === 409);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      customerEmail,
      customerName,
      customerPhone,
      serviceId,
      barberId,
      bookingDate,
      bookingTime,
      bookingId,
      orderId: providedOrderId,
      amount: providedAmount,
      returnPath,
    } = body;

    if (!isNonEmptyString(userId) || !isNonEmptyString(customerEmail) || !isNonEmptyString(customerName) || !isNonEmptyString(customerPhone)) {
      return NextResponse.json(
        { error: 'Missing required customer information' },
        { status: 400 },
      );
    }

    if (!isNonEmptyString(serviceId) || !isNonEmptyString(barberId) || !isNonEmptyString(bookingDate) || !isNonEmptyString(bookingTime)) {
      return NextResponse.json(
        { error: 'Missing booking details' },
        { status: 400 },
      );
    }

    const supabase = getServerClient();
    const orderId = isNonEmptyString(providedOrderId) ? providedOrderId : generateOrderId(userId);
    const amount = Number.isFinite(Number(providedAmount)) && Number(providedAmount) > 0
      ? Number(providedAmount)
      : getAdvancePaymentAmount();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentId = crypto.randomUUID();
    const bookingReference = isNonEmptyString(bookingId) ? bookingId : orderId;
    let webId = generateWebId(bookingReference);

    const statusUrl = new URL(safePath(returnPath), appUrl);
    statusUrl.searchParams.set('bookingId', bookingReference);
    statusUrl.searchParams.set('orderId', orderId);
    statusUrl.searchParams.set('paymentId', paymentId);
    statusUrl.searchParams.set('webId', webId);

    const returnUrl = new URL('/api/payment/volzix/return', appUrl);
    returnUrl.searchParams.set('returnPath', statusUrl.pathname);
    returnUrl.searchParams.set('bookingId', bookingReference);
    returnUrl.searchParams.set('orderId', orderId);
    returnUrl.searchParams.set('paymentId', paymentId);
    returnUrl.searchParams.set('webId', webId);

    await supabase.from('profiles').upsert({
      id: userId,
      full_name: customerName,
      email: customerEmail,
      phone: customerPhone,
    }, { onConflict: 'id' });

    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        provider: 'volzix',
        user_id: userId,
        order_id: orderId,
        web_id: webId,
        amount,
        currency: 'PKR',
        status: 'pending',
        payment_type: 'advance',
        service_id: serviceId,
        barber_id: barberId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError || !paymentRecord) {
      console.error('Volzix payment database insert failed:', paymentError);
      return NextResponse.json(
        {
          error: 'Failed to create payment record',
          detail: paymentError?.message,
        },
        { status: 500 },
      );
    }

    let createResult;
    try {
      createResult = await createPayment({
        amount,
        payerEmail: customerEmail,
        webId,
        returnUrl: returnUrl.toString(),
      });
    } catch (error) {
      if (!isDuplicateWebIdError(error)) {
        const message = error instanceof Error ? error.message : 'Volzix payment creation failed';
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            failure_reason: message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentRecord.id);

        return NextResponse.json(
          { error: message },
          { status: 400 },
        );
      }

      webId = generateWebId(`${bookingReference}-${crypto.randomUUID().slice(0, 8)}`);
      returnUrl.searchParams.set('webId', webId);
      statusUrl.searchParams.set('webId', webId);

      await supabase
        .from('payments')
        .update({ web_id: webId, updated_at: new Date().toISOString() })
        .eq('id', paymentRecord.id);

      try {
        createResult = await createPayment({
          amount,
          payerEmail: customerEmail,
          webId,
          returnUrl: returnUrl.toString(),
        });
      } catch (retryError) {
        const message = retryError instanceof Error ? retryError.message : 'Volzix payment creation failed';
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            failure_reason: message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentRecord.id);

        return NextResponse.json(
          { error: message },
          { status: 400 },
        );
      }
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        web_id: createResult.webId,
        flow_id: createResult.flowId,
        payment_id: createResult.flowId,
        provider_response: createResult.raw,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('Volzix payment database update failed:', updateError);
      return NextResponse.json(
        {
          error: 'Payment was created at Volzix, but local payment update failed',
          detail: updateError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      provider: 'volzix',
      paymentUrl: createResult.paymentUrl,
      flowId: createResult.flowId,
      webId: createResult.webId,
      orderId,
      bookingId: bookingReference,
      paymentId: paymentRecord.id,
      amount,
      message: 'Payment initiated successfully',
    });
  } catch (error) {
    console.error('Volzix payment initiation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to initiate payment: ${message}` },
      { status: 500 },
    );
  }
}
