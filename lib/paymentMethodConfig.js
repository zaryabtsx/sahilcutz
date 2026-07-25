const PAYMENT_METHOD_OPTIONS = [
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
