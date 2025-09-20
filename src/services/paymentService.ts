import { api } from './api';

interface PaymentIntentData {
  bookingId: string;
  amount?: number;
  currency?: string;
}

interface PaymentIntentResponse {
  status: string;
  data: {
    clientSecret: string;
    paymentIntentId: string;
  };
}

interface RefundData {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

class PaymentService {
  async createPaymentIntent(data: PaymentIntentData): Promise<PaymentIntentResponse> {
    const response = await api.post('/payments/intent', data);
    return response.data;
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    const response = await api.post('/payments/confirm', { paymentIntentId });
    return response.data;
  }

  async createRefund(data: RefundData): Promise<any> {
    const response = await api.post('/payments/refund', data);
    return response.data;
  }
}

export const paymentService = new PaymentService();