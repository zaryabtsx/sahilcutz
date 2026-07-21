const test = require('node:test');
const assert = require('node:assert/strict');
const { getPaymentMethodOptions, isBankTransferPaymentMethod } = require('../lib/paymentMethodConfig');

test('payment options include online and bank transfer', () => {
  const options = getPaymentMethodOptions();

  assert.ok(options.some((option) => option.value === 'volzix'));
  assert.ok(options.some((option) => option.value === 'bank_transfer'));
});

test('bank transfer is detected correctly', () => {
  assert.equal(isBankTransferPaymentMethod('bank_transfer'), true);
  assert.equal(isBankTransferPaymentMethod('volzix'), false);
});
