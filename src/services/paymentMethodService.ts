import api from './api';

export interface PaymentMethod {
  _id: string;
  name: string;
  code: string;
  description?: string;
  type: 'credit_card' | 'debit_card' | 'cash' | 'check' | 'bank_transfer' | 'digital_wallet' | 'cryptocurrency' | 'gift_card' | 'voucher' | 'loyalty_points' | 'corporate_account' | 'invoice' | 'other';
  subtype?: string;
  cardSettings: {
    supportedBrands: string[];
    requiresCVV: boolean;
    requiresZip: boolean;
    supportsContactless: boolean;
    supportsChipAndPin: boolean;
    supportsSwipe: boolean;
    minAmount: number;
    maxAmount: number;
  };
  gateway: {
    provider: string;
    configuration: {
      apiKey?: string;
      secretKey?: string;
      merchantId?: string;
      webhookSecret?: string;
      environment: 'sandbox' | 'production';
      customSettings?: any;
    };
    endpoints: {
      payment?: string;
      refund?: string;
      webhook?: string;
      status?: string;
    };
    features: {
      supportsRefunds: boolean;
      supportsPartialRefunds: boolean;
      supportsVoids: boolean;
      supportsCapture: boolean;
      supportsAuth: boolean;
      supportsRecurring: boolean;
      supportsTokenization: boolean;
    };
  };
  fees: {
    fixed: number;
    percentage: number;
    minimumFee: number;
    maximumFee: number;
    currency: string;
    feeCalculation: 'add_to_total' | 'deduct_from_amount' | 'separate_charge';
  };
  supportedCurrencies: Array<{
    code: string;
    symbol?: string;
    exchangeRate: number;
    lastUpdated: Date;
  }>;
  isActive: boolean;
  isOnline: boolean;
  isManual: boolean;
  requiresVerification: boolean;
  allowsPartialPayments: boolean;
  allowsOverpayments: boolean;
  availableFrom?: Date;
  availableTo?: Date;
  weeklySchedule: Array<{
    day: string;
    enabled: boolean;
    startTime?: string;
    endTime?: string;
  }>;
  applicableDepartments?: Array<{
    _id: string;
    name: string;
    code: string;
  }>;
  allowedRoles: string[];
  restrictedRoles: string[];
  limits: {
    daily: {
      maxAmount: number;
      maxTransactions: number;
    };
    monthly: {
      maxAmount: number;
      maxTransactions: number;
    };
    perTransaction: {
      minAmount: number;
      maxAmount: number;
    };
  };
  security: {
    requiresSignature: boolean;
    requiresId: boolean;
    allowsRefunds: boolean;
    refundTimeLimit: number;
    encryptionLevel: string;
    fraudProtection: {
      enabled: boolean;
      riskThreshold: string;
      actions: string[];
    };
  };
  notifications: {
    onSuccess: {
      guest: boolean;
      staff: boolean;
      management: boolean;
    };
    onFailure: {
      guest: boolean;
      staff: boolean;
      management: boolean;
    };
    onRefund: {
      guest: boolean;
      staff: boolean;
      management: boolean;
    };
    onChargeback: {
      guest: boolean;
      staff: boolean;
      management: boolean;
    };
  };
  display: {
    icon?: string;
    color: string;
    order: number;
    showInPos: boolean;
    showInBooking: boolean;
    showOnWebsite: boolean;
    customLabel?: string;
  };
  analytics: {
    totalTransactions: number;
    totalAmount: number;
    successfulTransactions: number;
    failedTransactions: number;
    refundedTransactions: number;
    refundedAmount: number;
    avgTransactionAmount: number;
    avgProcessingTime: number;
    lastTransaction?: Date;
    popularityScore: number;
    conversionRate: number;
    lastCalculated: Date;
  };
  integrations: {
    pms: {
      enabled: boolean;
      code?: string;
      mapping?: any;
    };
    accounting: {
      enabled: boolean;
      glAccount?: string;
      costCenter?: string;
    };
    reporting: {
      enabled: boolean;
      category?: string;
      tags?: string[];
    };
    pos: {
      enabled: boolean;
      terminalId?: string;
      configuration?: any;
    };
  };
  hotelId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  auditLog?: Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }>;
}

export interface CreatePaymentMethodData {
  name: string;
  code: string;
  description?: string;
  type: PaymentMethod['type'];
  subtype?: string;
  cardSettings?: Partial<PaymentMethod['cardSettings']>;
  gateway: {
    provider: string;
    configuration?: Partial<PaymentMethod['gateway']['configuration']>;
    endpoints?: Partial<PaymentMethod['gateway']['endpoints']>;
    features?: Partial<PaymentMethod['gateway']['features']>;
  };
  fees?: Partial<PaymentMethod['fees']>;
  supportedCurrencies?: PaymentMethod['supportedCurrencies'];
  isActive?: boolean;
  isOnline?: boolean;
  isManual?: boolean;
  requiresVerification?: boolean;
  allowsPartialPayments?: boolean;
  allowsOverpayments?: boolean;
  availableFrom?: Date;
  availableTo?: Date;
  weeklySchedule?: PaymentMethod['weeklySchedule'];
  applicableDepartments?: string[];
  allowedRoles?: string[];
  restrictedRoles?: string[];
  limits?: Partial<PaymentMethod['limits']>;
  security?: Partial<PaymentMethod['security']>;
  notifications?: Partial<PaymentMethod['notifications']>;
  display?: Partial<PaymentMethod['display']>;
  integrations?: Partial<PaymentMethod['integrations']>;
}

export interface UpdatePaymentMethodData extends Partial<CreatePaymentMethodData> {}

export interface PaymentMethodFilters {
  type?: string;
  isActive?: boolean;
  userRole?: string;
  departmentId?: string;
  includeOffline?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentMethodValidation {
  valid: boolean;
  reason?: string;
  fees?: {
    originalAmount: number;
    fee: number;
    totalAmount: number;
    netAmount: number;
    currency: string;
    feeCalculation: string;
  };
}

export interface PaymentMethodAnalytics {
  basic: {
    totalTransactions: number;
    totalAmount: number;
    successfulTransactions: number;
    failedTransactions: number;
    successRate: string;
    failureRate: string;
    refundRate: string;
    avgTransactionAmount: number;
    avgProcessingTime: number;
  };
  period: string;
  trends: {
    popularityScore: number;
    conversionRate: number;
    lastTransaction?: Date;
  };
  financial: {
    totalRevenue: number;
    refundedAmount: number;
    netAmount: number;
  };
}

export interface PaymentMethodStats {
  typeBreakdown: Array<{
    _id: string;
    count: number;
    activeCount: number;
    totalTransactions: number;
    totalAmount: number;
    avgSuccessRate: number;
  }>;
  overall: {
    total: number;
    active: number;
    inactive: number;
    online: number;
    manual: number;
    totalTransactions: number;
    totalAmount: number;
    avgSuccessRate: string;
    typesUsed: number;
    lastActivity: Date;
  };
  generatedAt: Date;
}

export interface PaymentMethodType {
  value: string;
  label: string;
  description: string;
  icon: string;
  requiresGateway: boolean;
}

export interface GatewayProvider {
  value: string;
  label: string;
  description: string;
  features: string[];
  supportedTypes: string[];
}

export interface BulkUpdateItem {
  paymentMethodId: string;
  data: UpdatePaymentMethodData;
}

class PaymentMethodService {
  async getPaymentMethods(filters: PaymentMethodFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/payment-methods?${params.toString()}`);
    return response.data;
  }

  async getPaymentMethodById(id: string, options: { populate?: boolean; includeAnalytics?: boolean } = {}) {
    const params = new URLSearchParams();
    
    if (options.populate) params.append('populate', 'true');
    if (options.includeAnalytics) params.append('includeAnalytics', 'true');

    const response = await api.get(`/payment-methods/${id}?${params.toString()}`);
    return response.data;
  }

  async createPaymentMethod(paymentMethodData: CreatePaymentMethodData) {
    const response = await api.post('/payment-methods', paymentMethodData);
    return response.data;
  }

  async updatePaymentMethod(id: string, paymentMethodData: UpdatePaymentMethodData) {
    const response = await api.put(`/payment-methods/${id}`, paymentMethodData);
    return response.data;
  }

  async deletePaymentMethod(id: string) {
    const response = await api.delete(`/payment-methods/${id}`);
    return response.data;
  }

  async getPaymentMethodsByType(type: string, options: { includeInactive?: boolean } = {}) {
    const params = new URLSearchParams();
    if (options.includeInactive) params.append('includeInactive', 'true');

    const response = await api.get(`/payment-methods/type/${type}?${params.toString()}`);
    return response.data;
  }

  async getAvailablePaymentMethods(dateTime?: Date) {
    const params = new URLSearchParams();
    if (dateTime) params.append('dateTime', dateTime.toISOString());

    const response = await api.get(`/payment-methods/available?${params.toString()}`);
    return response.data;
  }

  async testGatewayConnection(paymentMethodId: string) {
    const response = await api.post(`/payment-methods/${paymentMethodId}/test-gateway`);
    return response.data;
  }

  async updateAnalytics(paymentMethodId: string, transactionData: {
    amount: number;
    success: boolean;
    processingTime?: number;
    refunded?: boolean;
    refundAmount?: number;
  }) {
    const response = await api.put(`/payment-methods/${paymentMethodId}/analytics`, transactionData);
    return response.data;
  }

  async getPaymentMethodAnalytics(paymentMethodId: string, period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<{ success: boolean; data: PaymentMethodAnalytics }> {
    const response = await api.get(`/payment-methods/${paymentMethodId}/analytics?period=${period}`);
    return response.data;
  }

  async searchPaymentMethods(query: string, options: { type?: string; userRole?: string; limit?: number } = {}) {
    const params = new URLSearchParams({ q: query });
    
    if (options.type) params.append('type', options.type);
    if (options.userRole) params.append('userRole', options.userRole);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get(`/payment-methods/search?${params.toString()}`);
    return response.data;
  }

  async bulkUpdatePaymentMethods(updates: BulkUpdateItem[]) {
    const response = await api.put('/payment-methods/bulk-update', { updates });
    return response.data;
  }

  async exportPaymentMethods(format: 'json' | 'csv' = 'json') {
    const response = await api.get(`/payment-methods/export?format=${format}`);
    
    if (format === 'csv') {
      // Handle CSV download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payment-methods.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'Export started' };
    }
    
    return response.data;
  }

  async getPaymentMethodStats(): Promise<{ success: boolean; data: PaymentMethodStats }> {
    const response = await api.get('/payment-methods/stats');
    return response.data;
  }

  async calculateFees(paymentMethodId: string, amount: number, currency = 'USD') {
    const params = new URLSearchParams({ 
      amount: amount.toString(),
      currency 
    });

    const response = await api.get(`/payment-methods/${paymentMethodId}/calculate-fees?${params.toString()}`);
    return response.data;
  }

  async validatePaymentMethodUsage(paymentMethodId: string, amount: number, currency = 'USD', dateTime?: Date): Promise<{ success: boolean; data: PaymentMethodValidation }> {
    const params = new URLSearchParams({ 
      amount: amount.toString(),
      currency 
    });
    
    if (dateTime) params.append('dateTime', dateTime.toISOString());

    const response = await api.get(`/payment-methods/${paymentMethodId}/validate?${params.toString()}`);
    return response.data;
  }

  async getPaymentMethodTypes(): Promise<{ success: boolean; data: PaymentMethodType[] }> {
    const response = await api.get('/payment-methods/types');
    return response.data;
  }

  async getGatewayProviders(): Promise<{ success: boolean; data: GatewayProvider[] }> {
    const response = await api.get('/payment-methods/gateway-providers');
    return response.data;
  }

  async clonePaymentMethod(paymentMethodId: string, newName: string, newCode: string) {
    const response = await api.post(`/payment-methods/${paymentMethodId}/clone`, { newName, newCode });
    return response.data;
  }

  async updatePaymentMethodStatus(paymentMethodId: string, isActive: boolean, reason?: string) {
    const response = await api.patch(`/payment-methods/${paymentMethodId}/status`, { isActive, reason });
    return response.data;
  }

  async updateDisplayOrder(updates: Array<{ id: string; order: number }>) {
    const response = await api.put('/payment-methods/display-order', { updates });
    return response.data;
  }

  // Helper methods for frontend
  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'credit_card': '#1976d2',
      'debit_card': '#388e3c',
      'cash': '#4caf50',
      'check': '#ff9800',
      'bank_transfer': '#9c27b0',
      'digital_wallet': '#673ab7',
      'cryptocurrency': '#f44336',
      'gift_card': '#e91e63',
      'voucher': '#ffeb3b',
      'loyalty_points': '#ff5722',
      'corporate_account': '#795548',
      'invoice': '#607d8b',
      'other': '#9e9e9e'
    };
    return colors[type] || colors.other;
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'credit_card': 'credit_card',
      'debit_card': 'payment',
      'cash': 'money',
      'check': 'receipt',
      'bank_transfer': 'account_balance',
      'digital_wallet': 'account_balance_wallet',
      'cryptocurrency': 'currency_bitcoin',
      'gift_card': 'card_giftcard',
      'voucher': 'local_offer',
      'loyalty_points': 'stars',
      'corporate_account': 'business',
      'invoice': 'description',
      'other': 'help_outline'
    };
    return icons[type] || icons.other;
  }

  getGatewayColor(provider: string): string {
    const colors: { [key: string]: string } = {
      'stripe': '#635bff',
      'paypal': '#0070ba',
      'square': '#000000',
      'authorize_net': '#0066cc',
      'braintree': '#00d4ff',
      'worldpay': '#d83131',
      'adyen': '#0abf53',
      'manual': '#757575',
      'internal': '#2196f3'
    };
    return colors[provider] || '#757575';
  }

  formatTypeName(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  calculateTotalWithFees(amount: number, paymentMethod: PaymentMethod): number {
    const fee = paymentMethod.fees.fixed + (amount * paymentMethod.fees.percentage / 100);
    
    let finalFee = fee;
    if (paymentMethod.fees.minimumFee > 0 && fee < paymentMethod.fees.minimumFee) {
      finalFee = paymentMethod.fees.minimumFee;
    }
    if (paymentMethod.fees.maximumFee > 0 && fee > paymentMethod.fees.maximumFee) {
      finalFee = paymentMethod.fees.maximumFee;
    }

    switch (paymentMethod.fees.feeCalculation) {
      case 'add_to_total':
        return amount + finalFee;
      case 'deduct_from_amount':
        return amount;
      case 'separate_charge':
        return amount;
      default:
        return amount + finalFee;
    }
  }

  isGatewayRequired(type: string): boolean {
    const nonGatewayTypes = ['cash', 'check', 'gift_card', 'voucher', 'other'];
    return !nonGatewayTypes.includes(type);
  }

  getSuccessRateColor(rate: number): 'success' | 'warning' | 'error' {
    if (rate >= 95) return 'success';
    if (rate >= 85) return 'warning';
    return 'error';
  }

  isPaymentMethodAvailable(paymentMethod: PaymentMethod, dateTime = new Date()): boolean {
    if (!paymentMethod.isActive) return false;
    
    if (paymentMethod.availableFrom && dateTime < new Date(paymentMethod.availableFrom)) {
      return false;
    }
    
    if (paymentMethod.availableTo && dateTime > new Date(paymentMethod.availableTo)) {
      return false;
    }

    if (paymentMethod.weeklySchedule.length > 0) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[dateTime.getDay()];
      const currentTime = dateTime.toTimeString().substring(0, 5); // HH:MM format
      
      const daySchedule = paymentMethod.weeklySchedule.find(schedule => schedule.day === currentDay);
      if (daySchedule) {
        if (!daySchedule.enabled) return false;
        if (daySchedule.startTime && currentTime < daySchedule.startTime) return false;
        if (daySchedule.endTime && currentTime > daySchedule.endTime) return false;
      }
    }

    return true;
  }
}

export const paymentMethodService = new PaymentMethodService();
export default paymentMethodService;