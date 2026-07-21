export type BookingPaymentMethod = 'volzix' | 'bank_transfer';

export interface PaymentMethodOption {
  value: BookingPaymentMethod;
  label: string;
  description: string;
}

export function getPaymentMethodOptions(): PaymentMethodOption[] {
  return [
    {
      value: 'volzix',
      label: 'Online payment',
      description: 'Pay securely with JazzCash or other cards through Volzix.',
    },
    {
      value: 'bank_transfer',
      label: 'Bank transfer',
      description: 'Transfer the advance to our bank account and confirm the booking manually.',
    },
  ];
}

export function isBankTransferPaymentMethod(method: string | null | undefined): boolean {
  return method === 'bank_transfer';
}
