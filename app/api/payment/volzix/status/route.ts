import { NextRequest, NextResponse } from 'next/server';
import {
  checkPaymentStatus,
  isVolzixCompleted,
  isVolzixTerminalFailure,
} from '@/lib/volzix';
import {
  ensureAppointmentForPaidPayment,
  getServerClient,
  loadPayment,
  type PaymentRow,
} from '@/lib/volzix-server';

async function refreshFromVolzix(supabase: ReturnType<typeof getServerClient>, payment: PaymentRow) {
  if (!payment.flow_id && !payment.web_id) return payment;
  if (isVolzixCompleted(payment.status) || payment.status === 'failed') return payment;

  try {
    const status = await checkPaymentStatus({
      flowId: payment.flow_id || undefined,
      webId: payment.flow_id ? undefined : payment.web_id || undefined,
    });
    const normalizedStatus = String(status.status || payment.status || 'pending').toLowerCase();

    const updates: Record<string, unknown> = {
      status: isVolzixTerminalFailure(normalizedStatus) ? 'failed' : normalizedStatus,
      flow_id: status.flow_id || payment.flow_id,
      web_id: status.web_id || payment.web_id,
      provider_response: status,
      updated_at: new Date().toISOString(),
    };

    if (isVolzixCompleted(normalizedStatus)) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
      updates.payment_id = status.flow_id || payment.flow_id;
      updates.transaction_id = status.flow_id || payment.flow_id;
    }

    if (isVolzixTerminalFailure(normalizedStatus)) {
      updates.failure_reason = normalizedStatus;
    }

    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', payment.id)
      .select()
      .single();

    if (error || !updatedPayment) {
      console.error('Volzix status refresh update failed:', error);
      return payment;
    }

    if (isVolzixCompleted(normalizedStatus)) {
      await ensureAppointmentForPaidPayment(supabase, updatedPayment as PaymentRow);
    }

    return updatedPayment as PaymentRow;
  } catch (error) {
    console.error('Volzix status inquiry failed:', error instanceof Error ? error.message : error);
    return payment;
  }
}

export async function GET(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get('paymentId');
    const orderId = request.nextUrl.searchParams.get('orderId');
    const webId = request.nextUrl.searchParams.get('webId');
    const flowId = request.nextUrl.searchParams.get('flowId');
    const bookingId = request.nextUrl.searchParams.get('bookingId');

    if (!paymentId && !orderId && !webId && !flowId && !bookingId) {
      return NextResponse.json(
        { error: 'Missing payment reference' },
        { status: 400 },
      );
    }

    const supabase = getServerClient();
    const payment = await loadPayment(supabase, {
      paymentId,
      orderId,
      webId,
      flowId,
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 },
      );
    }

    const refreshedPayment = await refreshFromVolzix(supabase, payment);
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, status, start_at')
      .eq('payment_id', refreshedPayment.id)
      .maybeSingle();

    return NextResponse.json({
      payment: {
        id: refreshedPayment.id,
        provider: refreshedPayment.provider || 'volzix',
        orderId: refreshedPayment.order_id,
        webId: refreshedPayment.web_id,
        flowId: refreshedPayment.flow_id,
        gatewayPaymentId: refreshedPayment.payment_id,
        transactionId: refreshedPayment.transaction_id,
        amount: refreshedPayment.amount,
        currency: refreshedPayment.currency,
        status: refreshedPayment.status,
      },
      appointment: appointment || null,
    });
  } catch (error) {
    console.error('Volzix status error:', error);
    return NextResponse.json(
      { error: 'Failed to load payment status' },
      { status: 500 },
    );
  }
}
