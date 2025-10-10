// Mock Stripe implementation for development
// This provides the exact same interface that real Stripe would have

export interface MockPaymentIntent {
  id: string
  client_secret: string
  amount: number
  currency: string
  status: 'requires_confirmation' | 'succeeded' | 'failed' | 'canceled'
  created: number
  metadata: Record<string, string>
}

export interface MockPaymentMethod {
  id: string
  type: 'card'
  card: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

export class MockStripeService {
  private paymentIntents = new Map<string, MockPaymentIntent>()

  // Create a payment intent (mock)
  createPaymentIntent(params: {
    amount: number
    currency?: string
    metadata?: Record<string, string>
  }): MockPaymentIntent {
    const id = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const client_secret = `${id}_secret_${Math.random().toString(36).substr(2, 12)}`

    const paymentIntent: MockPaymentIntent = {
      id,
      client_secret,
      amount: params.amount,
      currency: params.currency || 'usd',
      status: 'requires_confirmation',
      created: Math.floor(Date.now() / 1000),
      metadata: params.metadata || {}
    }

    this.paymentIntents.set(id, paymentIntent)
    return paymentIntent
  }

  // Retrieve a payment intent (mock)
  retrievePaymentIntent(paymentIntentId: string): MockPaymentIntent | null {
    return this.paymentIntents.get(paymentIntentId) || null
  }

  // Confirm a payment intent (mock)
  confirmPaymentIntent(paymentIntentId: string): MockPaymentIntent | null {
    const paymentIntent = this.paymentIntents.get(paymentIntentId)
    if (!paymentIntent) {
      return null
    }

    // Simulate payment success (95% success rate for testing)
    const success = Math.random() > 0.05

    paymentIntent.status = success ? 'succeeded' : 'failed'
    this.paymentIntents.set(paymentIntentId, paymentIntent)

    return paymentIntent
  }

  // Cancel a payment intent (mock)
  cancelPaymentIntent(paymentIntentId: string): MockPaymentIntent | null {
    const paymentIntent = this.paymentIntents.get(paymentIntentId)
    if (!paymentIntent) {
      return null
    }

    paymentIntent.status = 'canceled'
    this.paymentIntents.set(paymentIntentId, paymentIntent)

    return paymentIntent
  }

  // Simulate webhook events (for testing)
  simulateWebhookEvent(paymentIntentId: string, eventType: string): {
    id: string
    type: string
    data: {
      object: MockPaymentIntent
    }
  } | null {
    const paymentIntent = this.paymentIntents.get(paymentIntentId)
    if (!paymentIntent) {
      return null
    }

    return {
      id: `evt_mock_${Date.now()}`,
      type: eventType,
      data: {
        object: paymentIntent
      }
    }
  }
}

// Singleton instance
const mockStripe = new MockStripeService()

// Export functions that match real Stripe API
export const stripe = {
  paymentIntents: {
    create: (params: {
      amount: number
      currency?: string
      metadata?: Record<string, string>
    }) => Promise.resolve(mockStripe.createPaymentIntent(params)),

    retrieve: (id: string) => {
      const intent = mockStripe.retrievePaymentIntent(id)
      return Promise.resolve(intent)
    },

    confirm: (id: string) => {
      const intent = mockStripe.confirmPaymentIntent(id)
      return Promise.resolve(intent)
    },

    cancel: (id: string) => {
      const intent = mockStripe.cancelPaymentIntent(id)
      return Promise.resolve(intent)
    }
  }
}

// Utility functions for payment processing
export function calculateProviderEarnings(
  totalAmount: number,
  providerSharePercentage: number = 70
): { providerEarnings: number; platformFee: number } {
  const providerEarnings = Math.round(totalAmount * (providerSharePercentage / 100))
  const platformFee = totalAmount - providerEarnings

  return { providerEarnings, platformFee }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toLowerCase() === 'usd' ? 'USD' : currency
  }).format(amount / 100) // Stripe amounts are in cents
}

export function validatePaymentAmount(amount: number): boolean {
  // Minimum charge amount (50 cents)
  return amount >= 50
}

// Mock webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In real implementation, this would verify the Stripe webhook signature
  // For mock, we'll just return true if all parameters are present
  return !!(payload && signature && secret)
}

// Generate mock payment method for testing
export function generateMockPaymentMethod(): MockPaymentMethod {
  const brands = ['visa', 'mastercard', 'amex']
  const brand = brands[Math.floor(Math.random() * brands.length)]

  return {
    id: `pm_mock_${Math.random().toString(36).substr(2, 9)}`,
    type: 'card',
    card: {
      brand,
      last4: Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
      exp_month: Math.floor(Math.random() * 12) + 1,
      exp_year: new Date().getFullYear() + Math.floor(Math.random() * 5) + 1
    }
  }
}

// Helper to convert dollars to cents (Stripe format)
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

// Helper to convert cents to dollars
export function centsToDollars(cents: number): number {
  return cents / 100
}

// Mock error simulation for testing
export class MockStripeError extends Error {
  constructor(
    message: string,
    public type: string = 'card_error',
    public code?: string,
    public decline_code?: string
  ) {
    super(message)
    this.name = 'MockStripeError'
  }
}

// Simulate common Stripe errors for testing
export function simulateStripeError(errorType: string): MockStripeError {
  const errors = {
    card_declined: new MockStripeError(
      'Your card was declined.',
      'card_error',
      'card_declined',
      'generic_decline'
    ),
    insufficient_funds: new MockStripeError(
      'Your card has insufficient funds.',
      'card_error',
      'card_declined',
      'insufficient_funds'
    ),
    expired_card: new MockStripeError(
      'Your card has expired.',
      'card_error',
      'expired_card'
    ),
    processing_error: new MockStripeError(
      'An error occurred while processing your card.',
      'card_error',
      'processing_error'
    )
  }

  return errors[errorType as keyof typeof errors] || new MockStripeError('Unknown error')
}