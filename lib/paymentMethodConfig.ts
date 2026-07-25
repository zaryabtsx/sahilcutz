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
      description: 'Pay securely with JazzCash, EasyPaisa or card-based options through Volzix.',
    },
    {
      value: 'bank_transfer',
      label: 'Bank account',
      description: 'Pay via bank account (IBFT / bank transfer). Redirects to Volzix for bank-account-compatible checkout options.',
    },
  ];
}

export function isBankTransferPaymentMethod(method: string | null | undefined): boolean {
  return method === 'bank_transfer';
}
