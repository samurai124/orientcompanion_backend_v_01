/**
 * Payment Provider Interface & Simulated Implementation.
 * Allows switching to CMI, Stripe or local Moroccan gateways seamlessly.
 */
export class PaymentProvider {
  async processPayment({ amountMad, userId, planCode }) {
    throw new Error('processPayment must be implemented by concrete provider');
  }
}

export class SimulatedPaymentProvider extends PaymentProvider {
  async processPayment({ amountMad, userId, planCode }) {
    // Simulate instantaneous successful card / cash transaction
    const transactionId = `SIM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return {
      success: true,
      transactionId,
      provider: 'SIMULATED',
      amountMad,
      paidAt: new Date()
    };
  }
}

export const defaultPaymentProvider = new SimulatedPaymentProvider();
export default defaultPaymentProvider;
