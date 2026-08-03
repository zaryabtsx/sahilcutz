/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader,
  Lock,
  ArrowRight,
  Shield,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

interface PaymentStepProps {
  userId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  barberId: string;
  bookingDate: string;
  bookingTime: string;
  advanceAmount: number;
  onPaymentFailed?: (error: string) => void;
  loading?: boolean;
}

export function PaymentStep({
  userId,
  customerEmail,
  customerName,
  customerPhone,
  serviceId,
  barberId,
  bookingDate,
  bookingTime,
  advanceAmount,
  onPaymentFailed,
  loading = false,
}: PaymentStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const searchParams = useSearchParams();

  // Check if returning from payment gateway
  useEffect(() => {
    const paymentStatus = searchParams.get('paymentStatus');
    const orderId = searchParams.get('orderId');

    if ((paymentStatus === 'success' || paymentStatus === 'completed') && orderId) {
      setPaymentCompleted(true);
      setPaymentInitiated(false);
    } else if (paymentStatus === 'failed' && orderId) {
      setError('Payment was declined. Please try again or use a different payment method.');
      setPaymentInitiated(false);
      onPaymentFailed?.('Payment failed');
    } else if (paymentStatus === 'error') {
      setError('An error occurred while processing your payment. Please try again.');
      setPaymentInitiated(false);
      onPaymentFailed?.('Payment error');
    }
  }, [searchParams, onPaymentFailed]);

  async function parseJsonResponse<T = Record<string, unknown>>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        body: text.slice(0, 120),
      });
      throw new Error(`Server returned invalid JSON: ${text.slice(0, 200).replace(/\s+/g, ' ')}`);
    }
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/payment/volzix/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          customerEmail,
          customerName,
          customerPhone,
          serviceId,
          barberId,
          bookingDate,
          bookingTime,
          amount: advanceAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await parseJsonResponse<Record<string, unknown>>(response).catch(() => ({}));
        throw new Error(errorData.error as string || 'Failed to initiate payment');
      }

      const data = await parseJsonResponse<Record<string, unknown>>(response);

      if (!data.paymentUrl || typeof data.paymentUrl !== 'string') {
        throw new Error('No payment URL received from gateway');
      }

      sessionStorage.setItem('paymentData', JSON.stringify({
        orderId: data.orderId,
        paymentId: data.paymentId,
        amount: data.amount,
      }));

      setPaymentInitiated(true);

      // Small delay before redirect
      setTimeout(() => {
        window.location.href = data.paymentUrl as string;
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initiation failed';
      setError(errorMessage);
      onPaymentFailed?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h2 className="text-3xl font-bold text-foreground">Complete Your Payment</h2>
        <p className="text-lg text-muted-foreground">
          One more step to confirm your appointment
        </p>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-950 rounded-xl border border-red-200 dark:border-red-800"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Payment Error</h3>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Payment Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Amount Card */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Advance Payment</p>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Rs. {advanceAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Required to confirm your appointment booking
            </p>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Booking Details
            </h3>
            <div className="space-y-2 bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Date & Time:</span>
                <span className="font-medium text-foreground">{bookingDate} at {bookingTime}</span>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="font-medium text-foreground">{customerName}</span>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Phone:</span>
                <span className="font-medium text-foreground text-sm">{customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Why Payment Required */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              Why Payment?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Secures your appointment time slot</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Reduces no-show rate</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Adjusted at final billing</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Right: Payment Process */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Step-by-Step Guide */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">How It Works</h3>

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-4"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                !paymentInitiated ? 'bg-primary text-white' : 'bg-emerald-500 text-white'
              }`}>
                {paymentInitiated || paymentCompleted ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <div className="flex-1 pt-1">
                <p className="font-medium text-foreground">Click &ldquo;Proceed to Payment&quot;</p>
                <p className="text-sm text-muted-foreground mt-1">You&apos;ll be redirected to our secure payment gateway</p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex gap-4"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                paymentInitiated ? 'bg-primary text-white' : 'bg-muted-foreground/30 text-muted-foreground'
              }`}>
                {paymentInitiated || paymentCompleted ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <div className="flex-1 pt-1">
                <p className="font-medium text-foreground">Enter Payment Details</p>
                <p className="text-sm text-muted-foreground mt-1">Securely enter your card or payment information</p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                paymentCompleted ? 'bg-emerald-500 text-white' : 'bg-muted-foreground/30 text-muted-foreground'
              }`}>
                {paymentCompleted ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <div className="flex-1 pt-1">
                <p className="font-medium text-foreground">Confirm & Return</p>
                <p className="text-sm text-muted-foreground mt-1">You&#39;ll automatically return to complete your booking</p>
              </div>
            </motion.div>
          </div>

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">100% Secure</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  Processed through Volzix. Your information is encrypted and protected.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-200 dark:border-amber-800"
          >
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-100">Takes ~2 minutes</p>
                <p className="text-amber-800 dark:text-amber-200 mt-1">
                  Quick and simple payment process
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Payment Button */}
      {!paymentCompleted ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          <motion.button
            type="button"
            whileHover={{ scale: isProcessing || loading || paymentInitiated ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing || loading || paymentInitiated ? 1 : 0.98 }}
            onClick={handlePayment}
            disabled={isProcessing || loading || paymentInitiated}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              isProcessing || loading || paymentInitiated
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-xl hover:shadow-primary/40'
            }`}
          >
            {isProcessing || loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Initializing Payment...
              </>
            ) : paymentInitiated ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Redirecting to Volzix...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Proceed to Payment
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          <p className="text-xs text-center text-muted-foreground">
            ✓ Secure • ✓ Encrypted • ✓ Fast Payment Processing
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-emerald-50 dark:bg-emerald-950 rounded-xl border border-emerald-200 dark:border-emerald-800"
        >
          <div className="flex items-center gap-4 justify-center py-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">Payment Verified!</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">Your appointment is being confirmed...</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cancellation Policy */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-2"
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold">Cancellation Policy:</span> This advance payment is non-refundable unless you cancel within 24 hours before your appointment.
        </p>
      </motion.div>
    </div>
  );
}
