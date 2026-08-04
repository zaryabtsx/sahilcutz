const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveAppUrl } = require('../lib/appUrl');

test('resolveAppUrl uses the incoming host when available', () => {
  const url = resolveAppUrl({
    url: 'https://example.com/api/payment/volzix/initiate',
    headers: {
      host: 'booking.example.com',
      'x-forwarded-proto': 'https',
    },
  }, {});

  assert.equal(url, 'https://booking.example.com');
});

test('resolveAppUrl falls back to configured app url when no host is present', () => {
  const url = resolveAppUrl({ url: 'http://localhost:3000' }, { NEXT_PUBLIC_APP_URL: 'https://app.example.com' });

  assert.equal(url, 'https://app.example.com');
});
