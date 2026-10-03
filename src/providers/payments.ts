/**
 * PaymentProvider abstraction. The MVP never moves real money: MockPaymentProvider
 * approves every charge and returns a confirmation code. A Stripe/Adyen provider
 * can implement the same contract later.
 */
export interface PaymentRequest { amount: number; currency: 'EUR'; description: string; metadata?: Record<string, string> }
export interface PaymentResult { id: string; status: 'succeeded' | 'failed'; confirmation: string }

export interface PaymentProvider { charge(req: PaymentRequest): Promise<PaymentResult> }

const code = () => 'JA-' + Math.random().toString(36).slice(2, 8).toUpperCase();

export class MockPaymentProvider implements PaymentProvider {
  async charge(req: PaymentRequest): Promise<PaymentResult> {
    await new Promise((r) => setTimeout(r, 450)); // feel like a real network call
    if (req.amount < 0) return { id: 'pay_failed', status: 'failed', confirmation: '' };
    return { id: 'pay_' + Date.now().toString(36), status: 'succeeded', confirmation: code() };
  }
}

export const payments: PaymentProvider = new MockPaymentProvider();
