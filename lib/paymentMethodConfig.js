const PAYMENT_METHOD_OPTIONS = [
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

function getPaymentMethodOptions() {
  return PAYMENT_METHOD_OPTIONS;
}

function isBankTransferPaymentMethod(method) {
  return method === 'bank_transfer';
}

module.exports = {
  getPaymentMethodOptions,
  isBankTransferPaymentMethod,
};
