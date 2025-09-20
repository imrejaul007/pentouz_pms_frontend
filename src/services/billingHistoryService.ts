import { api } from './api';

export interface BillingHistoryItem {
  id: string;
  type: 'invoice' | 'payment' | 'refund' | 'booking';
  subType: string;
  date: string;
  amount: number;
  status: string;
  description: string;
  bookingId?: string;
  bookingNumber?: string;
  guestName?: string;
  guestEmail?: string;
  hotelName?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  currency?: string;
  transactionId?: string;
  refundReason?: string;
  refundId?: string;
  originalTransactionId?: string;
  amountPaid?: number;
  amountRemaining?: number;
  itemCount?: number;
  // New booking-specific fields
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  paymentStatus?: string;
  roomCount?: number;
}

export interface BillingHistorySummary {
  totalTransactions: number;
  totalAmount: number;
  invoiceCount: number;
  paymentCount: number;
  refundCount: number;
  bookingCount: number;
  totalInvoiceAmount: number;
  totalPaymentAmount: number;
  totalRefundAmount: number;
  totalBookingAmount: number;
}

export interface BillingHistoryResponse {
  status: string;
  data: {
    history: BillingHistoryItem[];
    summary: BillingHistorySummary;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface BillingHistoryFilters {
  page?: number;
  limit?: number;
  type?: 'all' | 'invoice' | 'payment' | 'refund' | 'booking';
  status?: string;
  startDate?: string;
  endDate?: string;
  guestId?: string;
  hotelId?: string;
  search?: string;
}

export interface BillingStats {
  period: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  invoices: Array<{
    _id: { status: string; type: string };
    count: number;
    totalAmount: number;
    averageAmount: number;
  }>;
  payments: Array<{
    _id: { status: string; method: string };
    count: number;
    totalAmount: number;
    averageAmount: number;
  }>;
  refunds: {
    totalRefunds: number;
    totalRefundAmount: number;
    averageRefundAmount: number;
  };
  revenueTrend: Array<{
    _id: { date: string };
    revenue: number;
    transactionCount: number;
  }>;
}

export interface BillingStatsResponse {
  status: string;
  data: BillingStats;
}

export interface ExportData {
  format: string;
  totalRecords: number;
  exportData: Array<{
    type: string;
    date: string;
    [key: string]: any;
  }>;
  generatedAt: string;
}

export interface ExportResponse {
  status: string;
  data: ExportData;
}

class BillingHistoryService {
  /**
   * Get comprehensive billing history (invoices, transactions, refunds)
   */
  async getBillingHistory(filters: BillingHistoryFilters = {}): Promise<BillingHistoryResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/billing-history?${params.toString()}`);
    return response.data;
  }

  /**
   * Get billing history statistics and analytics
   */
  async getBillingStats(period: 'week' | 'month' | 'quarter' | 'year' = 'month', hotelId?: string): Promise<BillingStatsResponse> {
    const params = new URLSearchParams({ period });
    if (hotelId) {
      params.append('hotelId', hotelId);
    }

    const response = await api.get(`/billing-history/stats?${params.toString()}`);
    return response.data;
  }

  /**
   * Export billing history data
   */
  async exportBillingHistory(
    format: 'csv' | 'excel' | 'pdf' = 'csv',
    filters: {
      startDate?: string;
      endDate?: string;
      type?: 'all' | 'invoice' | 'payment' | 'refund';
      hotelId?: string;
    } = {}
  ): Promise<ExportResponse> {
    const params = new URLSearchParams({ format });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/billing-history/export?${params.toString()}`);
    return response.data;
  }

  /**
   * Get invoice details by ID
   */
  async getInvoiceDetails(invoiceId: string) {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response.data;
  }

  /**
   * Add payment to invoice
   */
  async addInvoicePayment(invoiceId: string, paymentData: {
    amount: number;
    method: string;
    transactionId?: string;
    notes?: string;
  }) {
    const response = await api.post(`/invoices/${invoiceId}/payments`, paymentData);
    return response.data;
  }

  /**
   * Add discount to invoice
   */
  async addInvoiceDiscount(invoiceId: string, discountData: {
    description: string;
    type: 'percentage' | 'fixed_amount' | 'loyalty_points';
    value: number;
  }) {
    const response = await api.post(`/invoices/${invoiceId}/discounts`, discountData);
    return response.data;
  }

  /**
   * Create refund for a payment
   */
  async createRefund(refundData: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }) {
    const response = await api.post('/payments/refund', refundData);
    return response.data;
  }

  /**
   * Get payment details by payment intent ID
   */
  async getPaymentByIntentId(paymentIntentId: string) {
    // This would require adding a new endpoint to get payment by intent ID
    // For now, we'll return a placeholder
    console.warn('getPaymentByIntentId not yet implemented in backend');
    throw new Error('Payment lookup by intent ID not yet implemented');
  }

  /**
   * Get recent billing activity for dashboard
   */
  async getRecentActivity(limit: number = 10, hotelId?: string): Promise<BillingHistoryResponse> {
    return this.getBillingHistory({
      limit,
      hotelId,
      page: 1
    });
  }

  /**
   * Get billing history for a specific guest
   */
  async getGuestBillingHistory(guestId?: string, filters: BillingHistoryFilters = {}): Promise<BillingHistoryResponse> {
    return this.getBillingHistory({
      ...filters,
      guestId
    });
  }

  /**
   * Search billing history
   */
  async searchBillingHistory(query: string, filters: BillingHistoryFilters = {}): Promise<BillingHistoryResponse> {
    return this.getBillingHistory({
      ...filters,
      search: query
    });
  }

  /**
   * Download export file (for CSV/Excel formats)
   */
  downloadExportFile(exportData: ExportData, filename?: string) {
    const csvContent = this.convertToCSV(exportData.exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `billing-history-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date, includeTime: boolean = true): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (includeTime) {
      return dateObj.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get status badge color for UI
   */
  getStatusColor(status: string, type: string): string {
    switch (type) {
      case 'invoice':
        switch (status) {
          case 'paid': return 'green';
          case 'issued': return 'blue';
          case 'partially_paid': return 'orange';
          case 'overdue': return 'red';
          case 'draft': return 'gray';
          case 'cancelled': return 'red';
          default: return 'gray';
        }
      case 'payment':
        switch (status) {
          case 'succeeded': return 'green';
          case 'pending': return 'yellow';
          case 'failed': return 'red';
          case 'canceled': return 'gray';
          case 'refunded': return 'purple';
          case 'partially_refunded': return 'orange';
          default: return 'gray';
        }
      case 'refund':
        return 'purple';
      default:
        return 'gray';
    }
  }

  /**
   * Get type icon for UI
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'invoice': return '📄';
      case 'payment': return '💳';
      case 'refund': return '↩️';
      default: return '📋';
    }
  }
}

export const billingHistoryService = new BillingHistoryService();