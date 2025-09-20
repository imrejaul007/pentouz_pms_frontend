import { api } from './api';

interface ApiResponse<T> {
  status: string;
  data: T;
  results?: number;
  pagination?: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface CorporateCompany {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  gstNumber: string;
  creditLimit: number;
  availableCredit: number;
  paymentTerms: number;
  isActive: boolean;
  hrContacts: Array<{
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    isPrimary: boolean;
  }>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastModifiedBy?: string;
  };
}

export interface CorporateCredit {
  _id: string;
  corporateCompanyId: string;
  transactionType: 'credit' | 'debit' | 'booking' | 'adjustment';
  amount: number;
  balance: number;
  description: string;
  status: 'pending' | 'processed' | 'failed';
  dueDate?: Date;
  bookingId?: string;
  metadata: {
    createdAt: Date;
    createdBy: string;
    source: string;
  };
}

export interface CorporateDashboardMetrics {
  overview: {
    totalCompanies: number;
    totalCreditLimit: number;
    totalUsedCredit: number;
    totalAvailableCredit: number;
    companiesWithActiveCredit: number;
    averageUtilization: number;
    lowCreditAlerts: number;
    recentTransactions: number;
  };
  monthlyUsage: Array<{
    _id: {
      year: number;
      month: number;
    };
    totalAmount: number;
    transactionCount: number;
  }>;
  companyPerformance: Array<{
    _id: string;
    name: string;
    creditLimit: number;
    availableCredit: number;
    usedCredit: number;
    utilizationRate: number;
  }>;
  utilizationDistribution: Array<{
    _id: string;
    count: number;
    totalCreditLimit: number;
    totalUsedCredit: number;
  }>;
  lastUpdated: Date;
}

class CorporateService {
  // Dashboard Metrics
  async getDashboardMetrics(): Promise<ApiResponse<CorporateDashboardMetrics>> {
    const response = await api.get('/corporate/dashboard/metrics');
    return response.data;
  }

  // Corporate Companies
  async getAllCompanies(filters: any = {}): Promise<ApiResponse<{ companies: CorporateCompany[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/corporate/companies?${params.toString()}`);
    return response.data;
  }

  async getCompany(id: string): Promise<ApiResponse<{ company: CorporateCompany }>> {
    const response = await api.get(`/corporate/companies/${id}`);
    return response.data;
  }

  async createCompany(companyData: Partial<CorporateCompany>): Promise<ApiResponse<{ company: CorporateCompany }>> {
    const response = await api.post('/corporate/companies', companyData);
    return response.data;
  }

  async updateCompany(id: string, updates: Partial<CorporateCompany>): Promise<ApiResponse<{ company: CorporateCompany }>> {
    const response = await api.patch(`/corporate/companies/${id}`, updates);
    return response.data;
  }

  async deleteCompany(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/corporate/companies/${id}`);
    return response.data;
  }

  async getLowCreditCompanies(threshold?: number): Promise<ApiResponse<{ companies: CorporateCompany[]; threshold: number }>> {
    const params = new URLSearchParams();
    if (threshold) {
      params.append('threshold', threshold.toString());
    }

    const response = await api.get(`/corporate/companies/low-credit?${params.toString()}`);
    return response.data;
  }

  async updateCompanyCredit(id: string, amount: number, description?: string): Promise<ApiResponse<{ company: any }>> {
    const response = await api.patch(`/corporate/companies/${id}/update-credit`, {
      amount,
      description
    });
    return response.data;
  }

  async getCompanyCreditSummary(id: string): Promise<ApiResponse<{ company: any; creditSummary: any }>> {
    const response = await api.get(`/corporate/companies/${id}/credit-summary`);
    return response.data;
  }

  async getCompanyBookings(id: string, filters: any = {}): Promise<ApiResponse<{ bookings: any[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/corporate/companies/${id}/bookings?${params.toString()}`);
    return response.data;
  }

  // Credit Transactions
  async getAllCreditTransactions(filters: any = {}): Promise<ApiResponse<{ transactions: CorporateCredit[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/corporate/credit/transactions?${params.toString()}`);
    return response.data;
  }

  async getCreditTransaction(id: string): Promise<ApiResponse<{ transaction: CorporateCredit }>> {
    const response = await api.get(`/corporate/credit/transactions/${id}`);
    return response.data;
  }

  async createCreditTransaction(transactionData: Partial<CorporateCredit>): Promise<ApiResponse<{ transaction: CorporateCredit }>> {
    const response = await api.post('/corporate/credit/transactions', transactionData);
    return response.data;
  }

  async approveCreditTransaction(id: string): Promise<ApiResponse<{ transaction: CorporateCredit }>> {
    const response = await api.patch(`/corporate/credit/transactions/${id}/approve`);
    return response.data;
  }

  async rejectCreditTransaction(id: string, reason?: string): Promise<ApiResponse<{ transaction: CorporateCredit }>> {
    const response = await api.patch(`/corporate/credit/transactions/${id}/reject`, { reason });
    return response.data;
  }

  async getOverdueTransactions(filters: any = {}): Promise<ApiResponse<{ transactions: CorporateCredit[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/corporate/credit/overdue?${params.toString()}`);
    return response.data;
  }

  async getMonthlyCreditReport(filters: any = {}): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/corporate/credit/monthly-report?${params.toString()}`);
    return response.data;
  }

  async bulkApproveCreditTransactions(transactionIds: string[]): Promise<ApiResponse<{ approved: string[]; failed: string[] }>> {
    const response = await api.patch('/corporate/credit/bulk-approve', { transactionIds });
    return response.data;
  }

  async getCreditAnalysis(): Promise<ApiResponse<any>> {
    const response = await api.get('/corporate/admin/credit-analysis');
    return response.data;
  }
}

export const corporateService = new CorporateService();