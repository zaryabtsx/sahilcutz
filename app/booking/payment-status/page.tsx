'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, Loader2, RefreshCw, XCircle } from 'lucide-react';

interface PaymentStatusResponse {
  payment?: {
    id: string;
    orderId: string;
    amount: number | string;
    currency: string;
    status: string;
    transactionId?: string | null;
    webId?: string | null;
    flowId?: string | null;
    completedAt?: string | null;
  };
  appointment?: {
    id: string;
    status: string;
    start_at: string;
  } | null;
  error?: string;
}

function normalizeStatus(value?: string) {
  return String(value || 'pending').toLowerCase();
}

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const orderId = searchParams.get('orderId');
  const bookingId = searchParams.get('bookingId');
  const webId = searchParams.get('webId');
  const flowId = searchParams.get('flowId');
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const status = normalizeStatus(data?.payment?.status);
  const isSuccess = ['completed', 'success', 'paid'].includes(status);
  const isFailed = ['failed', 'declined', 'cancelled', 'canceled'].includes(status);
  const shouldPoll = Boolean(paymentId || orderId || bookingId || webId || flowId) && !isFailed && (!isSuccess || !data?.appointment);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (paymentId) params.set('paymentId', paymentId);
    if (orderId) params.set('orderId', orderId);
    if (bookingId) params.set('bookingId', bookingId);
    if (webId) params.set('webId', webId);
    if (flowId) params.set('flowId', flowId);
    return params.toString();
  }, [bookingId, flowId, orderId, paymentId, webId]);

  const loadStatus = useCallback(async () => {
    if (!query) {
      setError('Missing payment reference. Please contact support if your payment was deducted.');
      setLoading(false);
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/payment/volzix/status?${query}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load payment status.');
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load payment status.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!shouldPoll) return;
    const interval = window.setInterval(() => {
      void loadStatus();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [loadStatus, shouldPoll]);

  const state = isSuccess
    ? {
        icon: CheckCircle,
        title: data?.appointment ? 'Booking confirmed' : 'Payment received',
        body: data?.appointment
          ? 'Your payment is confirmed and your appointment is booked.'
          : 'Your payment is confirmed. We are finishing your appointment confirmation.',
        tone: 'text-emerald-500',
      }
    : isFailed
      ? {
          icon: XCircle,
          title: 'Payment failed',
          body: 'Volzix did not confirm this payment. You can try again from the booking page.',
          tone: 'text-red-500',
        }
      : {
          icon: Clock,
          title: 'Waiting for payment confirmation',
          body: 'We are checking Volzix for the final payment update. This page will refresh automatically.',
          tone: 'text-primary',
        };

  const Icon = state.icon;

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <section className="w-full rounded-[32px] border border-border bg-card/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background ${state.tone}`}>
            {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Icon className="h-8 w-8" />}
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Volzix payment
          </p>
          <h1 className="mt-3 text-3xl font-black">{loading ? 'Checking payment' : state.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            {error || state.body}
          </p>

          {data?.payment && (
            <div className="mt-8 rounded-3xl border border-border bg-background/80 p-5 text-left">
              {[
                ['Reference', data.payment.orderId],
                ['Volzix Flow', data.payment.flowId || data.payment.webId || 'Pending'],
                ['Status', data.payment.status],
                ['Amount', `${data.payment.currency} ${Number(data.payment.amount).toLocaleString()}`],
                ['Appointment', data.appointment ? data.appointment.status : 'Pending'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
                  <span className="text-right text-sm font-bold">{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            {!isSuccess && (
              <button
                type="button"
                onClick={() => void loadStatus()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-border px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-background"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh status
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push(isSuccess ? '/customer/dashboard' : '/booking')}
              className="w-full rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20"
            >
              {isSuccess ? 'Go to dashboard' : 'Back to booking'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={null}>
      <PaymentStatusContent />
    </Suspense>
  );
}
