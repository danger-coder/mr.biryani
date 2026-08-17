/**
 * Payments are intentionally NOT implemented.
 *
 * No provider is configured, so nothing is ever charged. The checkout flow is
 * honest about this: online/card orders are recorded as UNPAID and the customer
 * is told payment will be collected separately. Wiring a real provider means
 * implementing `capture()` here and flipping `paymentStatus` from its webhook —
 * no other part of the app needs to change.
 */

export type PaymentProviderStatus =
  | { configured: false }
  | { configured: true; provider: string };

export function paymentProvider(): PaymentProviderStatus {
  const provider = process.env.PAYMENT_PROVIDER?.trim();
  const secret = process.env.PAYMENT_SECRET_KEY?.trim();
  if (!provider || !secret) return { configured: false };
  return { configured: true, provider };
}

export const MOCK_PAYMENT_NOTICE =
  "No payment provider is connected to this environment, so nothing is charged online. Your order is recorded as unpaid and payment is collected on delivery or pickup.";
