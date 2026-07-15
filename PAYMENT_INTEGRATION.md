# Volzix Payment Gateway Integration

Sahil Cutzz uses Volzix hosted checkout for Rs. 500 appointment advance payments.

## Environment

```env
VOLZIX_BASE_URL=https://volzix.com
VOLZIX_MERCHANT_MID=your_merchant_mid
VOLZIX_MERCHANT_API_KEY=your_merchant_api_key
NEXT_PUBLIC_VOLZIX_ADVANCE_AMOUNT=500
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never expose `VOLZIX_MERCHANT_API_KEY` in client-side code. Rotate any key or portal password that has been shared in screenshots/chat before production use.

## Volzix Flow

1. Customer selects service, barber, date, and time.
2. `POST /api/payment/volzix/initiate` creates a pending `payments` row with `provider = 'volzix'` and a unique `web_id`.
3. The server signs `merchant_mid|amount|currency|web_id|payer_email|timestamp` with HMAC-SHA256 using `VOLZIX_MERCHANT_API_KEY`.
4. The server calls `POST https://volzix.com/auth/`.
5. Volzix returns `flow_id` and `payment_url`; the browser redirects to `payment_url`.
6. Customer pays on Volzix hosted checkout using JazzCash or EasyPaisa.
7. Volzix redirects the browser to `/booking/payment-status`; this page polls our own API/DB and does not trust redirect params.
8. Volzix sends source-of-truth IPN updates to `POST /api/payment/volzix/ipn`.
9. The IPN route verifies timestamp freshness and HMAC signature.
10. On `completed`, the app marks the payment paid, creates the appointment if needed, and sends existing confirmation emails.
11. On `expired`, `failed`, `cancelled`, `dropped`, or `refunded`, the app marks the payment failed.

## Routes

```text
POST /api/payment/volzix/initiate
GET  /api/payment/volzix/return
POST /api/payment/volzix/ipn
POST /api/payment/volzix/webhook   # compatibility wrapper to IPN
GET  /api/payment/volzix/status
GET  /booking/payment-status
```

Legacy compatibility wrappers:

```text
POST /api/payments
GET  /api/payments/volzex-callback
POST /api/payments/volzex-webhook
```

## Database Migration

Run `supabase/schema.sql` in Supabase SQL editor. The Volzix-specific additions are:

- `payments.provider`
- `payments.web_id`
- `payments.flow_id`
- `payments.provider_response`
- `payments.webhook_payload`
- `payments.failure_reason`
- `volzix_ipn_events` for `event_id` deduplication

## Dashboard Setup

After deployment, set the Volzix merchant dashboard IPN URL to:

```text
https://sahilcutzz.com/api/payment/volzix/ipn
```

Use the exact production domain registered with Volzix for `NEXT_PUBLIC_APP_URL`, because Volzix requires the return URL domain to match the merchant domain.
