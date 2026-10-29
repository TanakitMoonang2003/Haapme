/**
 * Payment provider abstraction.
 *
 * To add a real provider:
 * 1. Implement the PaymentProvider interface.
 * 2. Register it in getProvider().
 * 3. Set PAYMENT_PROVIDER=<name> in .env.
 *
 * IMPORTANT: Payment status is ONLY updated via verifyPayment() which calls
 * a trusted server-side source (provider callback or polling endpoint).
 * Never trust the client to report payment success.
 */

export interface CreatePaymentResult {
  /** Provider-specific reference (shown in QR / reference field) */
  providerRef: string
  /** Data URI or URL for a QR code image (provider-specific) */
  qrCodeData: string | null
  /** Human-readable instructions */
  instructions: string
}

export interface VerifyPaymentResult {
  status: 'paid' | 'pending' | 'failed' | 'expired'
  providerRef: string
}

export interface PaymentProvider {
  name: string
  createPayment(params: {
    contributionId: string
    amount: number
    currency: string
    description: string
  }): Promise<CreatePaymentResult>
  verifyPayment(providerRef: string): Promise<VerifyPaymentResult>
}

// ---------------------------------------------------------------------------
// Mock provider — always returns a fake QR and never auto-confirms payment
// ---------------------------------------------------------------------------
const mockProvider: PaymentProvider = {
  name: 'mock',

  async createPayment({ contributionId, amount }) {
    const ref = `MOCK-${contributionId.slice(-8).toUpperCase()}-${Date.now()}`
    return {
      providerRef: ref,
      // Simple SVG placeholder for the QR code in dev
      qrCodeData: `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <rect width="200" height="200" fill="#f7f2ea"/>
          <text x="100" y="85" font-size="12" text-anchor="middle" fill="#49382f">MOCK QR</text>
          <text x="100" y="105" font-size="11" text-anchor="middle" fill="#8C7868">฿${amount}</text>
          <text x="100" y="125" font-size="9" text-anchor="middle" fill="#b8a697">${ref}</text>
        </svg>`
      )}`,
      instructions:
        '⚠️ This is a mock payment. In production configure a real payment provider.',
    }
  },

  async verifyPayment(providerRef) {
    // Mock provider never auto-confirms — must be triggered via the
    // /api/payments/[id]/mock-confirm endpoint (dev only)
    return { status: 'pending', providerRef }
  },
}

export function getProvider(name: string): PaymentProvider {
  if (name === 'mock') return mockProvider
  // Add real providers here:
  // if (name === 'promptpay') return promptpayProvider
  throw new Error(`Unknown payment provider: ${name}. Check PAYMENT_PROVIDER in .env`)
}
