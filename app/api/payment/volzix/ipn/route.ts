import { NextRequest, NextResponse } from 'next/server';
import {
  isVolzixCompleted,
  isVolzixTerminalFailure,
  verifyIpnSignature,
  type VolzixIpnPayload,
} from '@/lib/volzix';
import {
  ensureAppointmentForPaidPayment,
  getServerClient,
  loadPayment,
  type PaymentRow,
} from '@/lib/volzix-server';

function isIpnPayload(value: unknown): value is VolzixIpnPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return [
    'merchant_mid',
    'event_id',
    'timestamp',
    'signature',
    'flow_id',
    'status',
    'amount',
    'currency',
    'web_id',
  ].every((key) => typeof payload[key] !== 'undefined' && payload[key] !== null && String(payload[key]).trim() !== '');
}

function ack(flowId: string, status: string) {
  return NextResponse.json({ flow_id: flowId, status });
}

export async function GET(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);

    if (!isIpnPayload(payload)) {
      return NextResponse.json(
        { error: 'Invalid Volzix IPN payload' },
        { status: 400 },
      );
    }

    const signature = verifyIpnSignature(payload);
    if (!signature.ok) {
      console.warn('Rejected Volzix IPN:', signature.reason);
      return NextResponse.json(
        { error: signature.reason },
        { status: 401 },
      );
    }

    const supabase = getServerClient();
    const { error: eventError } = await supabase
      .from('volzix_ipn_events')
      .insert({
        event_id: payload.event_id,
        flow_id: payload.flow_id,
        web_id: payload.web_id,
        status: payload.status,
        payload,
        received_at: new Date().toISOString(),
      });

    if (eventError) {
      if (eventError.code === '23505') {
        return ack(payload.flow_id, payload.status);
      }

      console.error('Failed to record Volzix IPN event:', eventError);
      return NextResponse.json(
        { error: 'Failed to record IPN event' },
        { status: 500 },
      );
    }

    const payment = await loadPayment(supabase, {
      flowId: payload.flow_id,
      webId: payload.web_id,
    });

    if (!payment) {
      console.warn('Volzix IPN payment not found:', {
        flowId: payload.flow_id,
        webId: payload.web_id,
        eventId: payload.event_id,
      });
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 },
      );
    }

    if (Number(payment.amount).toFixed(2) !== Number(payload.amount).toFixed(2)) {
      console.error('Volzix IPN amount mismatch:', {
        paymentId: payment.id,
        expected: payment.amount,
        received: payload.amount,
      });
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 },
      );
    }

    if (isVolzixCompleted(payload.status)) {
      const { data: updatedPayment, error } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          flow_id: payload.flow_id,
          web_id: payload.web_id,
          payment_id: payload.flow_id,
          transaction_id: payload.reference || payload.flow_id,
          webhook_payload: payload,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .select()
        .single();

      if (error || !updatedPayment) {
        console.error('Failed to mark Volzix payment completed:', error);
        return NextResponse.json(
          { error: 'Failed to update payment' },
          { status: 500 },
        );
      }

      await ensureAppointmentForPaidPayment(supabase, updatedPayment as PaymentRow);
      return ack(payload.flow_id, 'completed');
    }

    if (isVolzixTerminalFailure(payload.status)) {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          flow_id: payload.flow_id,
          web_id: payload.web_id,
          payment_id: payload.flow_id,
          transaction_id: payload.reference || payload.flow_id,
          webhook_payload: payload,
          failure_reason: payload.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      return ack(payload.flow_id, payload.status);
    }

    await supabase
      .from('payments')
      .update({
        status: payload.status,
        flow_id: payload.flow_id,
        web_id: payload.web_id,
        payment_id: payload.flow_id,
        webhook_payload: payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    return ack(payload.flow_id, payload.status);
  } catch (error) {
    console.error('Volzix IPN processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process IPN' },
      { status: 500 },
    );
  }
}
