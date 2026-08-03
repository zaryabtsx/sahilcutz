import crypto from 'crypto';

export interface CreatePaymentInput {
  amount: number;
  payerEmail: string;
  payerPhone?: string;
  webId: string;
  returnUrl: string;
}

export interface CreatePaymentResult {
  flowId: string;
  paymentUrl: string;
  webId: string;
  raw: Record<string, unknown>;
}

export interface VolzixPaymentStatus {
  web_id?: string;
  flow_id?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  status_code?: number | string;
  status_description?: string;
  [key: string]: unknown;
}

export interface VolzixIpnPayload {
  merchant_mid: string;
  event_id: string;
  timestamp: number | string;
  signature: string;
  flow_id: string;
  status: string;
  amount: number | string;
  currency: string;
  web_id: string;
  issuer?: string;
  provider?: string;
  reference?: string;
  message?: string;
  event_time?: string;
  source?: string;
}

const TEN_MINUTES_SECONDS = 10 * 60;

export class MissingVolzixConfigError extends Error {
  constructor(public readonly missingVariables: string[]) {
    super(`Volzix payment gateway is not configured. Missing: ${missingVariables.join(', ')}`);
    this.name = 'MissingVolzixConfigError';
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function joinUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function parseJsonResponse(text: string, label: string): Record<string, unknown> {
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const preview = text.trim().slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(`${label} returned non-JSON response. Response started with: ${preview}`);
  }
}

function timingSafeEqualHex(left: string, right: string) {
  try {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

export function getVolzixConfig() {
  const missingVariables = ['VOLZIX_MERCHANT_MID', 'VOLZIX_MERCHANT_API_KEY']
    .filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    throw new MissingVolzixConfigError(missingVariables);
  }

  return {
    baseUrl: process.env.VOLZIX_BASE_URL || 'https://volzix.com',
    merchantMid: requiredEnv('VOLZIX_MERCHANT_MID'),
    merchantApiKey: requiredEnv('VOLZIX_MERCHANT_API_KEY'),
  };
}

export function generateOrderId(userId: string, timestamp: number = Date.now()): string {
  return `ORD-${userId}-${timestamp}`;
}

export function generateWebId(reference: string, timestamp: number = Date.now()) {
  const normalized = reference.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 70);
  return `SC-${normalized}-${timestamp}`.slice(0, 100);
}

export function getAdvancePaymentAmount(servicePrice?: number): number {
  const defaultAdvance = parseInt(
    process.env.NEXT_PUBLIC_VOLZIX_ADVANCE_AMOUNT ||
    process.env.NEXT_PUBLIC_VOLZEX_ADVANCE_AMOUNT ||
    '500',
    10,
  );

  if (servicePrice !== undefined && Number.isFinite(servicePrice) && servicePrice > 12000) {
    return Math.ceil(servicePrice * 0.3);
  }

  return defaultAdvance;
}

export function formatAmountForSignature(amount: number | string) {
  return Number(amount).toFixed(2);
}

export function normalizePhoneForVolzix(phone: unknown): string | undefined {
  const raw = typeof phone === 'string' ? phone.trim() : '';
  if (!raw) return undefined;

  let normalized = raw.replace(/[^\d+]/g, '');
  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`;
  }
  if (/^0\d{10}$/.test(normalized)) {
    normalized = `+92${normalized.slice(1)}`;
  }
  if (/^92\d{10}$/.test(normalized)) {
    normalized = `+${normalized}`;
  }
  if (/^\d{10,15}$/.test(normalized) && !normalized.startsWith('+')) {
    normalized = `+${normalized}`;
  }
  return normalized;
}
function getCreatePaymentSignature(
  merchantMid: string,
  amount: string,
  currency: string,
  webId: string,
  payerEmail: string,
  timestamp: number,
  alternateOrder = false,
) {
  const fields = alternateOrder
    ? [merchantMid, amount, currency, payerEmail, webId, String(timestamp)]
    : [merchantMid, amount, currency, webId, payerEmail, String(timestamp)];

  return signRequest(fields);
}

export function signRequest(fields: string[]): string {
  const { merchantApiKey } = getVolzixConfig();
  return crypto
    .createHmac('sha256', merchantApiKey)
    .update(fields.join('|'), 'utf8')
    .digest('hex');
}

export function isTimestampFresh(timestamp: number | string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const parsed = Number(timestamp);
  return Number.isFinite(parsed) && Math.abs(nowSeconds - parsed) <= TEN_MINUTES_SECONDS;
}

async function postVolzix(path: string, body: Record<string, unknown>, label: string) {
  const { baseUrl } = getVolzixConfig();
  const response = await fetch(joinUrl(baseUrl, path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = parseJsonResponse(text, label);

  if (!response.ok) {
    console.error(`${label} failed:`, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      requestBody: body,
      responseBody: data,
      rawResponse: text.slice(0, 1000),
    });

    const message =
      getString(data.message) ||
      getString(data.error) ||
      getString(data.detail) ||
      `${label} failed with HTTP ${response.status}`;
    const error = new Error(message) as Error & { status?: number; data?: Record<string, unknown> };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function isSignatureError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('signature') || message.includes('invalid signature') || message.includes('unauthorized');
}

export async function createPayment({
  amount,
  payerEmail,
  payerPhone,
  webId,
  returnUrl,
}: CreatePaymentInput): Promise<CreatePaymentResult> {
  const { merchantMid } = getVolzixConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const currency = 'PKR';
  const amountForSignature = formatAmountForSignature(amount);
  const requestedAmount = Number(amountForSignature);

  const buildRequestBody = (alternateOrder = false) => {
    const signature = getCreatePaymentSignature(
      merchantMid,
      amountForSignature,
      currency,
      webId,
      payerEmail,
      timestamp,
      alternateOrder,
    );

      const requestBody: Record<string, unknown> = {
      merchant_mid: merchantMid,
      amount: requestedAmount,
      currency,
      payer_email: payerEmail,
      web_id: webId,
      return: returnUrl,
      timestamp,
      signature,
    };

    const normalizedPhone = normalizePhoneForVolzix(payerPhone);
    if (normalizedPhone) {
      requestBody.payer_phone = normalizedPhone;
    }

    return requestBody;
  };

  let data;
  try {
    data = await postVolzix('/auth/', buildRequestBody(false), 'Volzix create payment');
  } catch (error) {
    if (isSignatureError(error)) {
      console.warn('Volzix create payment signature failed, retrying with alternate signature order.');
      data = await postVolzix('/auth/', buildRequestBody(true), 'Volzix create payment');
    } else {
      throw error;
    }
  }

  const flowId = getString(data.flow_id);
  const paymentUrl = getString(data.payment_url);
  const returnedWebId = getString(data.web_id) || webId;

  if (data.status !== 'ok' || !flowId || !paymentUrl) {
    throw new Error(getString(data.message) || 'Volzix create payment did not return flow_id/payment_url');
  }

  return {
    flowId,
    paymentUrl,
    webId: returnedWebId,
    raw: data,
  };
}

export async function checkPaymentStatus({
  flowId,
  webId,
}: {
  flowId?: string;
  webId?: string;
}): Promise<VolzixPaymentStatus> {
  if ((flowId && webId) || (!flowId && !webId)) {
    throw new Error('checkPaymentStatus requires either flowId or webId');
  }

  const { merchantMid } = getVolzixConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const reference = flowId || webId || '';
  const signature = signRequest([merchantMid, reference, String(timestamp)]);
  const body: Record<string, unknown> = {
    merchant_mid: merchantMid,
    timestamp,
    signature,
  };

  if (flowId) body.flow_id = flowId;
  if (webId) body.web_id = webId;

  const data = await postVolzix('/inquire/v1/', body, 'Volzix payment inquiry');
  const payment = data.payment;

  if (data.status !== 'ok' || !payment || typeof payment !== 'object' || Array.isArray(payment)) {
    throw new Error(getString(data.message) || 'Volzix inquiry did not return a payment object');
  }

  return payment as VolzixPaymentStatus;
}

export function verifyIpnSignature(payload: VolzixIpnPayload) {
  if (!isTimestampFresh(payload.timestamp)) {
    return {
      ok: false,
      reason: 'IPN timestamp is outside the allowed 10 minute window',
    };
  }

  const formattedExpected = signRequest([
    payload.merchant_mid,
    payload.flow_id,
    payload.status,
    formatAmountForSignature(payload.amount),
    payload.currency,
    payload.web_id,
    String(payload.timestamp),
  ]);
  const rawAmount = String(payload.amount);
  const rawExpected = rawAmount === formatAmountForSignature(payload.amount)
    ? formattedExpected
    : signRequest([
        payload.merchant_mid,
        payload.flow_id,
        payload.status,
        rawAmount,
        payload.currency,
        payload.web_id,
        String(payload.timestamp),
      ]);
  const provided = String(payload.signature || '').trim();

  return {
    ok: timingSafeEqualHex(formattedExpected, provided) || timingSafeEqualHex(rawExpected, provided),
    reason: 'IPN signature mismatch',
  };
}

export function isVolzixCompleted(status?: string) {
  const normalized = String(status || '').toLowerCase();
  return ['completed', 'success', 'paid', 'settled'].includes(normalized);
}

export function isVolzixTerminalFailure(status?: string) {
  return ['expired', 'failed', 'cancelled', 'canceled', 'dropped', 'refunded', 'declined'].includes(String(status || '').toLowerCase());
}
