import { api as apiClient } from './api';

const API_BASE = '/api/financial';

export interface ChartOfAccount {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  accountSubType: 'Current Asset' | 'Fixed Asset' | 'Other Asset' | 'Current Liability' | 'Long-term Liability' | 'Owner Equity' | 'Retained Earnings' | 'Operating Revenue' | 'Other Revenue' | 'Operating Expense' | 'Cost of Goods Sold' | 'Other Expense';
  parentAccount?: string;
  description?: string;
  normalBalance: 'Debit' | 'Credit';
  currentBalance: number;
  currency?: string;
  isActive: boolean;
  isSystemAccount?: boolean;
  taxCode?: string;
  hotelId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  _id: string;
  entryNumber: string;
  entryDate: string;
  entryType: 'Manual' | 'Automatic' | 'Adjusting' | 'Closing' | 'Reversing' | 'Opening';
  description: string;
  lines: Array<{
    accountId: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    currency?: string;
    exchangeRate?: number;
  }>;
  totalDebit: number;
  totalCredit: number;
  referenceType: 'Invoice' | 'Payment' | 'Expense' | 'BankTransaction' | 'POS' | 'Payroll' | 'Manual' | 'SystemGenerated';
  referenceId?: string;
  referenceNumber?: string;
  status: 'Draft' | 'Posted' | 'Approved' | 'Rejected' | 'Void' | 'Reversed';
  fiscalYear: number;
  fiscalPeriod: number;
  hotelId: string;
  createdBy: string;
  postedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
  invoiceId: string;
  invoiceNumber: string;
  hotelId: string;
  type: 'guest_folio' | 'corporate_billing' | 'group_billing' | 'vendor_invoice' | 'pro_forma';
  customer: {
    type: 'guest' | 'corporate' | 'vendor';
    guestId?: string;
    corporateId?: string;
    details: {
      name: string;
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      taxId?: string;
      email?: string;
      phone?: string;
    };
  };
  bookingReference?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  lineItems: Array<{
    description: string;
    account?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxCode?: string;
    taxRate?: number;
    taxAmount?: number;
    date?: string;
  }>;
  subtotal: number;
  taxDetails: Array<{
    taxName: string;
    taxRate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  totalTax: number;
  discounts: Array<{
    description: string;
    amount?: number;
    percentage?: number;
  }>;
  totalDiscount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded';
  paymentTerms: string;
  notes?: string;
  internalNotes?: string;
  attachments: string[];
}

export interface Payment {
  _id: string;
  paymentId: string;
  hotelId: string;
  type: 'receipt' | 'payment' | 'refund' | 'adjustment';
  method: 'cash' | 'check' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'online' | 'mobile_payment' | 'upi';
  date: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  customer: {
    type: 'guest' | 'corporate' | 'vendor';
    guestId?: string;
    corporateId?: string;
    name: string;
  };
  invoice?: string;
  booking?: string;
  reference?: string;
  bankAccount?: string;
  paymentDetails?: {
    cardLast4?: string;
    authCode?: string;
    transactionId?: string;
    checkNumber?: string;
    bankReference?: string;
  };
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reconciled: boolean;
  reconciledDate?: string;
  notes?: string;
}

export interface BankAccount {
  _id: string;
  accountId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'business' | 'credit';
  currency: string;
  currentBalance: number;
  availableBalance: number;
  isActive: boolean;
  isPrimary: boolean;
  bankDetails: {
    routingNumber?: string;
    swiftCode?: string;
    branchCode?: string;
    ifscCode?: string;
  };
  reconciliation: {
    lastReconciledDate?: string;
    lastReconciledBalance?: number;
    pendingTransactions?: number;
  };
}

export interface Budget {
  _id: string;
  budgetId: string;
  name: string;
  fiscalYear: number;
  period: {
    startDate: string;
    endDate: string;
  };
  department?: string;
  currency: string;
  budgetItems: Array<{
    account: string;
    category?: string;
    monthlyBudgets: Array<{
      month: number;
      amount: number;
    }>;
    totalBudget: number;
    actualSpent: number;
    variance: number;
    variancePercentage: number;
  }>;
  totalBudget: number;
  actualTotal: number;
  status: 'draft' | 'approved' | 'active' | 'closed';
  approvedBy?: string;
  approvedDate?: string;
}

export interface FinancialReport {
  _id: string;
  reportId: string;
  reportType: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'trial_balance' | 'aged_receivables' | 'aged_payables' | 'budget_variance' | 'revenue_by_source' | 'expense_analysis' | 'tax_summary';
  name: string;
  period: {
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    quarter?: number;
  };
  parameters: {
    accounts?: string[];
    departments?: string[];
    currency?: string;
    consolidate?: boolean;
  };
  data: any;
  generatedBy: string;
  generatedDate: string;
  format: 'pdf' | 'excel' | 'json';
  filePath?: string;
  isScheduled: boolean;
  scheduleConfig?: {
    frequency: string;
    nextRun: string;
    recipients: string[];
  };
}

class FinancialService {
  // Chart of Accounts
  async getAccounts(filters?: { type?: string; category?: string; active?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());
    
    const response = await apiClient.get(`/financial/chart-of-accounts?${params}`);
    return response.data;
  }

  async getAccountTree() {
    const response = await apiClient.get('/financial/chart-of-accounts/tree');
    return response.data;
  }

  async getFlattenedAccounts() {
    const response = await apiClient.get('/financial/chart-of-accounts/flattened');
    return response.data;
  }

  async createAccount(accountData: Partial<ChartOfAccount>) {
    const response = await apiClient.post('/financial/chart-of-accounts', accountData);
    return response.data;
  }

  async updateAccount(id: string, accountData: Partial<ChartOfAccount>) {
    const response = await apiClient.patch(`/financial/chart-of-accounts/${id}`, accountData);
    return response.data;
  }

  async deleteAccount(id: string) {
    const response = await apiClient.delete(`/financial/chart-of-accounts/${id}`);
    return response.data;
  }

  // General Ledger
  async getJournalEntries(filters?: { 
    startDate?: string; 
    endDate?: string; 
    account?: string; 
    journal?: string; 
    status?: string 
  }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.account) params.append('account', filters.account);
    if (filters?.journal) params.append('journal', filters.journal);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await apiClient.get(`/financial/journal-entries?${params}`);
    return response.data;
  }

  async createJournalEntry(entryData: Partial<JournalEntry>) {
    const response = await apiClient.post('/financial/journal-entries', entryData);
    return response.data;
  }

  async reverseJournalEntry(id: string) {
    const response = await apiClient.post(`/financial/journal-entries/${id}/reverse`);
    return response.data;
  }

  // Invoices
  async getInvoices(filters?: { 
    status?: string; 
    type?: string; 
    customer?: string; 
    startDate?: string; 
    endDate?: string 
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.customer) params.append('customer', filters.customer);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/financial/invoices?${params}`);
    return response.data;
  }

  async createInvoice(invoiceData: Partial<Invoice>) {
    const response = await apiClient.post('/financial/invoices', invoiceData);
    return response.data;
  }

  async updateInvoice(id: string, invoiceData: Partial<Invoice>) {
    const response = await apiClient.put(`/financial/invoices/${id}`, invoiceData);
    return response.data;
  }

  // Payments
  async getPayments(filters?: {
    method?: string;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    includeStats?: boolean;
  }) {
    const params = new URLSearchParams();
    if (filters?.method) params.append('method', filters.method);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.includeStats) params.append('includeStats', 'true');

    const response = await apiClient.get(`/financial/payments?${params}`);
    return response.data;
  }

  async getPaymentStatistics(filters?: {
    method?: string;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.method) params.append('method', filters.method);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/financial/payments/statistics?${params}`);
    return response.data;
  }

  async createPayment(paymentData: Partial<Payment>) {
    const response = await apiClient.post('/financial/payments', paymentData);
    return response.data;
  }

  // Bank Accounts
  async getBankAccounts(filters?: { isActive?: boolean; isPrimary?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.isPrimary !== undefined) params.append('isPrimary', filters.isPrimary.toString());
    
    const response = await apiClient.get(`/financial/bank-accounts?${params}`);
    return response.data;
  }

  async createBankAccount(accountData: Partial<BankAccount>) {
    const response = await apiClient.post('/financial/bank-accounts', accountData);
    return response.data;
  }

  async updateBankAccount(id: string, accountData: Partial<BankAccount>) {
    const response = await apiClient.put(`/financial/bank-accounts/${id}`, accountData);
    return response.data;
  }

  // Budgets
  async getBudgets(filters?: { fiscalYear?: number; status?: string; department?: string }) {
    const params = new URLSearchParams();
    if (filters?.fiscalYear) params.append('fiscalYear', filters.fiscalYear.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.department) params.append('department', filters.department);
    
    const response = await apiClient.get(`/financial/budgets?${params}`);
    return response.data;
  }

  async createBudget(budgetData: Partial<Budget>) {
    const response = await apiClient.post('/financial/budgets', budgetData);
    return response.data;
  }

  async updateBudgetActuals(budgetId: string) {
    const response = await apiClient.post(`/financial/budgets/${budgetId}/update-actuals`);
    return response.data;
  }

  async getBudgetStatistics() {
    const response = await apiClient.get('/financial/budgets/statistics');
    return response.data;
  }

  // Reports
  async generateReport(reportData: {
    reportType: string;
    startDate?: string;
    endDate?: string;
    accounts?: string[];
    currency?: string;
  }) {
    const response = await apiClient.post('/financial/reports/generate', reportData);
    return response.data;
  }

  async getReports(filters?: { reportType?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.reportType) params.append('reportType', filters.reportType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/financial/reports?${params}`);
    return response.data;
  }

  // Dashboard
  async getFinancialDashboard(period: string = 'month') {
    const response = await apiClient.get(`/financial/dashboard?period=${period}`);
    return response.data;
  }

  // Trial Balance
  async getTrialBalance(filters?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/financial/reports/trial-balance?${params}`);
    return response.data;
  }

  // Income Statement (P&L)
  async getIncomeStatement(filters?: { startDate?: string; endDate?: string; currency?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.currency) params.append('currency', filters.currency);
    
    const response = await apiClient.get(`/financial/reports/income-statement?${params}`);
    return response.data;
  }

  // Balance Sheet
  async getBalanceSheet(filters?: { asOfDate?: string; currency?: string }) {
    const params = new URLSearchParams();
    if (filters?.asOfDate) params.append('asOfDate', filters.asOfDate);
    if (filters?.currency) params.append('currency', filters.currency);
    
    const response = await apiClient.get(`/financial/reports/balance-sheet?${params}`);
    return response.data;
  }

  // Cash Flow Statement
  async getCashFlowStatement(filters?: { startDate?: string; endDate?: string; currency?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.currency) params.append('currency', filters.currency);
    
    const response = await apiClient.get(`/financial/reports/cash-flow?${params}`);
    return response.data;
  }

  // Financial Ratios
  async getFinancialRatios(filters?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/financial/reports/financial-ratios?${params}`);
    return response.data;
  }

  // Comprehensive Financial Statement (combines all reports with backend calculations)
  async getComprehensiveFinancialStatement(filters?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/financial/reports/comprehensive?${params}`);
    return response.data;
  }

  // Account Summary
  async getAccountSummary(accountId: string, filters?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/financial/accounts/${accountId}/summary?${params}`);
    return response.data;
  }

  // Aged Receivables
  async getAgedReceivables(asOfDate?: string) {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);
    
    const response = await apiClient.get(`/financial/reports/aged-receivables?${params}`);
    return response.data;
  }

  // Aged Payables
  async getAgedPayables(asOfDate?: string) {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);
    
    const response = await apiClient.get(`/financial/reports/aged-payables?${params}`);
    return response.data;
  }

  // Budget vs Actual Report
  async getBudgetVariance(filters?: { budgetId?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.budgetId) params.append('budgetId', filters.budgetId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/financial/reports/budget-variance?${params}`);
    return response.data;
  }

  // Revenue by Source
  async getRevenueBySource(filters?: { startDate?: string; endDate?: string; groupBy?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);
    
    const response = await apiClient.get(`/financial/reports/revenue-by-source?${params}`);
    return response.data;
  }

  // Expense Analysis
  async getExpenseAnalysis(filters?: { startDate?: string; endDate?: string; category?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category) params.append('category', filters.category);
    
    const response = await apiClient.get(`/financial/reports/expense-analysis?${params}`);
    return response.data;
  }

  // Account Transactions
  async getAccountTransactions(accountId: string, filters?: { 
    startDate?: string; 
    endDate?: string; 
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const response = await apiClient.get(`/financial/chart-of-accounts/${accountId}/transactions?${params}`);
    return response.data;
  }

  // Bank Reconciliation
  async performBankReconciliation(data: {
    bankAccountId: string;
    statementDate: string;
    transactions: Array<{
      date: string;
      description: string;
      amount: number;
      type: 'debit' | 'credit';
      reference?: string;
    }>;
  }) {
    const response = await apiClient.post('/financial/reconciliation/bank', data);
    return response.data;
  }

  // Get Bank Transactions
  async getBankTransactions(accountId: string, filters?: { 
    startDate?: string; 
    endDate?: string; 
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const response = await apiClient.get(`/financial/bank-accounts/${accountId}/transactions?${params}`);
    return response.data;
  }

  // Get Unreconciled Transactions
  async getUnreconciledTransactions(accountId: string) {
    const response = await apiClient.get(`/financial/bank-accounts/${accountId}/transactions?isReconciled=false`);
    return response.data;
  }

  // Create Bank Transaction
  async createBankTransaction(accountId: string, transactionData: {
    transactionDate: Date;
    description: string;
    referenceNumber?: string;
    transactionType: string;
    creditAmount: number;
    debitAmount: number;
  }) {
    const response = await apiClient.post(`/financial/bank-accounts/${accountId}/transactions`, transactionData);
    return response.data;
  }

  // Reconcile Bank Account
  async reconcileBankAccount(accountId: string, reconciliationData: any) {
    const response = await apiClient.post(`/financial/bank-accounts/${accountId}/reconcile`, reconciliationData);
    return response.data;
  }
}

export default new FinancialService();