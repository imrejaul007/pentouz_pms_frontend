import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/utils/toast';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calculator,
  FileText,
  CreditCard,
  Building,
  Users,
  Calendar,
  Clock,
  RefreshCw,
  Settings,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  PieChart,
  BarChart3,
  Activity,
  Globe,
  Smartphone,
  Zap,
  Target,
  Eye,
  Plus
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import financialService from '@/services/financialService';

interface AccountingIntegration {
  id: string;
  name: string;
  type: 'erp' | 'accounting' | 'banking' | 'payment';
  logo: string;
  isConnected: boolean;
  status: 'active' | 'inactive' | 'error' | 'syncing';
  lastSync: Date;
  autoSync: boolean;
  syncInterval: number;
  settings: {
    companyCode?: string;
    chartOfAccounts: { [key: string]: string };
    taxSettings: {
      defaultTaxRate: number;
      taxAccounts: { [key: string]: string };
    };
    currencies: string[];
    fiscalYearStart: string;
  };
}

interface FinancialTransaction {
  id: string;
  type: 'revenue' | 'expense' | 'receivable' | 'payable' | 'adjustment';
  date: Date;
  amount: number;
  currency: string;
  description: string;
  account: string;
  reference: string;
  status: 'pending' | 'posted' | 'reconciled' | 'error';
  guestName?: string;
  bookingId?: string;
  departmentId?: string;
  paymentMethod?: string;
  taxAmount?: number;
}

interface AgingReport {
  category: string;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
  total: number;
}

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashFlow: number;
  currentRatio: number;
  revenueGrowth: number;
  expenseRatio: number;
  dsoRatio: number; // Days Sales Outstanding
}

interface CurrencyRate {
  currency: string;
  rate: number;
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
}

const AccountingIntegrationDashboard: React.FC = () => {
  const [integrations, setIntegrations] = useState<AccountingIntegration[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [agingReport, setAgingReport] = useState<AgingReport[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<AccountingIntegration | null>(null);
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [fiscalPeriod, setFiscalPeriod] = useState('current');
  const [isLoading, setIsLoading] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [baseCurrency, fiscalPeriod]);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching financial data...');
      
      // Fetch real financial data from backend APIs with improved error handling
      const [dashboardData, journalEntries, invoicesData, paymentsData, bankAccountsData] = await Promise.all([
        financialService.getFinancialDashboard(fiscalPeriod).catch((error) => {
          console.error('❌ Dashboard API failed:', error);
          toast.error('Failed to load financial dashboard data');
          return {
            success: false,
            data: {
              summary: {
                totalRevenue: 0,
                totalExpenses: 0,
                netProfit: 0,
                profitMargin: 0,
                totalAssets: 0,
                totalLiabilities: 0,
                cashFlow: 0,
                accountsReceivable: 0,
                accountsPayable: 0
              },
              revenueBreakdown: { roomRevenue: 0, foodBeverage: 0, otherRevenue: 0 },
              expenseBreakdown: { operatingExpenses: 0, payroll: 0, utilities: 0, marketing: 0, other: 0 },
              trends: { labels: [], revenue: [], expenses: [], profit: [] },
              topAccounts: [],
              cashFlowData: { operating: 0, investing: 0, financing: 0, netCashFlow: 0 }
            }
          };
        }),
        financialService.getJournalEntries({
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }).catch((error) => {
          console.error('❌ Journal Entries API failed:', error);
          toast.error('Failed to load journal entries');
          return { data: { entries: [] } };
        }),
        financialService.getInvoices({
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }).catch((error) => {
          console.error('❌ Invoices API failed:', error);
          toast.error('Failed to load invoices');
          return { data: [] };
        }),
        financialService.getPayments({
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }).catch((error) => {
          console.error('❌ Payments API failed:', error);
          toast.error('Failed to load payments');
          return { data: [] };
        }),
        financialService.getBankAccounts().catch((error) => {
          console.error('❌ Bank Accounts API failed:', error);
          toast.error('Failed to load bank accounts');
          return { data: [] };
        })
      ]);

      console.log('📊 Dashboard Data:', dashboardData);
      console.log('📝 Journal Entries:', journalEntries);
      console.log('💰 Invoices:', invoicesData);
      console.log('💳 Payments:', paymentsData);
      console.log('🏦 Bank Accounts:', bankAccountsData);

      // Set integrations (static for now, but connected to backend data availability)
      const mockIntegrations: AccountingIntegration[] = [
        {
          id: 'quickbooks',
          name: 'QuickBooks Online',
          type: 'accounting',
          logo: '/logos/quickbooks.png',
          isConnected: !!(dashboardData?.data || dashboardData),
          status: (dashboardData?.data || dashboardData) ? 'active' : 'inactive',
          lastSync: new Date(Date.now() - 300000),
          autoSync: true,
          syncInterval: 60,
          settings: {
            companyCode: 'HOTEL001',
            chartOfAccounts: {
              'room_revenue': '4000',
              'fb_revenue': '4100',
              'other_revenue': '4900',
              'cost_of_sales': '5000',
              'operating_expenses': '6000',
              'accounts_receivable': '1200',
              'accounts_payable': '2100'
            },
            taxSettings: {
              defaultTaxRate: 18,
              taxAccounts: {
                'cgst': '2300',
                'sgst': '2301',
                'igst': '2302'
              }
            },
            currencies: ['INR', 'USD', 'EUR', 'GBP'],
            fiscalYearStart: '04-01'
          }
        },
        {
          id: 'financial_system',
          name: 'Hotel Financial System',
          type: 'accounting',
          logo: '/logos/system.png',
          isConnected: true,
          status: 'active',
          lastSync: new Date(),
          autoSync: true,
          syncInterval: 30,
          settings: {
            companyCode: 'HOTEL',
            chartOfAccounts: {
              'room_revenue': '4000',
              'fb_revenue': '4100',
              'accounts_receivable': '1200',
              'accounts_payable': '2100'
            },
            taxSettings: {
              defaultTaxRate: 18,
              taxAccounts: {
                'input_tax': '2400',
                'output_tax': '2300'
              }
            },
            currencies: ['INR', 'USD'],
            fiscalYearStart: '04-01'
          }
        }
      ];

      // Transform journal entries to transactions
      const transformedTransactions: FinancialTransaction[] = [];
      const entriesArray = journalEntries?.data?.entries || journalEntries?.entries || [];

      if (Array.isArray(entriesArray) && entriesArray.length > 0) {
        entriesArray.slice(0, 10).forEach((entry: any) => {
          if (entry?.lines && Array.isArray(entry.lines)) {
            entry.lines.forEach((line: any, index: number) => {
              transformedTransactions.push({
                id: `${entry._id}-${index}`,
                type: line.debitAmount > 0 ? 'expense' : 'revenue',
                date: new Date(entry.entryDate || entry.createdAt || new Date()),
                amount: line.debitAmount || line.creditAmount || 0,
                currency: line.currency || 'INR',
                description: line.description || entry.description || 'Financial Entry',
                account: line.accountId?._id || line.accountId || '1000',
                reference: entry.referenceNumber || entry.entryNumber || 'N/A',
                status: entry.status?.toLowerCase() === 'posted' ? 'posted' : 'pending'
              });
            });
          }
        });
      }

      // Transform invoices to receivables
      const invoicesArray = invoicesData?.data || invoicesData || [];

      if (Array.isArray(invoicesArray) && invoicesArray.length > 0) {
        invoicesArray.slice(0, 5).forEach((invoice: any) => {
          if (invoice?.status !== 'paid' && invoice?.balanceAmount > 0) {
            transformedTransactions.push({
              id: `inv-${invoice._id}`,
              type: 'receivable',
              date: new Date(invoice.issueDate || invoice.createdAt || new Date()),
              amount: invoice.balanceAmount || invoice.totalAmount || 0,
              currency: invoice.currency || 'INR',
              description: `Invoice - ${invoice.invoiceNumber || invoice.invoiceId || 'Unknown'}`,
              account: '1200',
              reference: invoice.invoiceNumber || invoice.invoiceId || 'N/A',
              status: invoice.status === 'sent' ? 'pending' : 'posted',
              guestName: invoice.customer?.details?.name || invoice.customer?.name
            });
          }
        });
      }

      // Calculate aging report from invoices
      const agingReport: AgingReport[] = [
        {
          category: 'Guest Folios',
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
          over90: 0,
          total: 0
        },
        {
          category: 'Corporate Accounts', 
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
          over90: 0,
          total: 0
        }
      ];

      if (Array.isArray(invoicesArray) && invoicesArray.length > 0) {
        invoicesArray.forEach((invoice: any) => {
          if (invoice?.status !== 'paid' && (invoice?.balanceAmount || 0) > 0) {
            const daysDiff = Math.floor(
              (new Date().getTime() - new Date(invoice.issueDate || invoice.createdAt || new Date()).getTime()) /
              (1000 * 3600 * 24)
            );
            const amount = invoice.balanceAmount || 0;
            const categoryIndex = invoice.customer?.type === 'corporate' ? 1 : 0;

            if (daysDiff <= 30) {
              agingReport[categoryIndex].current += amount;
            } else if (daysDiff <= 60) {
              agingReport[categoryIndex].days30 += amount;
            } else if (daysDiff <= 90) {
              agingReport[categoryIndex].days60 += amount;
            } else if (daysDiff <= 120) {
              agingReport[categoryIndex].days90 += amount;
            } else {
              agingReport[categoryIndex].over90 += amount;
            }
            agingReport[categoryIndex].total += amount;
          }
        });
      }

      // Calculate metrics from dashboard data
      let calculatedMetrics: FinancialMetrics;
      console.log('📈 Dashboard Summary Check:', dashboardData?.data?.summary || dashboardData?.summary);
      
      // Handle both response formats - with or without success wrapper
      const actualDashboardData = dashboardData?.data || dashboardData;
      
      if (actualDashboardData && actualDashboardData.summary) {
        console.log('✅ Using dashboard data for metrics');
        calculatedMetrics = {
          totalRevenue: actualDashboardData.summary.totalRevenue || 0,
          totalExpenses: actualDashboardData.summary.totalExpenses || 0,
          netIncome: (actualDashboardData.summary.totalRevenue || 0) - (actualDashboardData.summary.totalExpenses || 0),
          accountsReceivable: actualDashboardData.summary.accountsReceivable || agingReport.reduce((sum, cat) => sum + cat.total, 0),
          accountsPayable: actualDashboardData.summary.accountsPayable || 0,
          cashFlow: actualDashboardData.summary.cashFlow || 0,
          currentRatio: actualDashboardData.ratios?.currentRatio || 1.0,
          revenueGrowth: actualDashboardData.growth?.revenueGrowth || 0,
          expenseRatio: actualDashboardData.ratios?.expenseRatio || 0,
          dsoRatio: actualDashboardData.ratios?.dsoRatio || 30
        };
        console.log('💰 Calculated Metrics from Dashboard:', calculatedMetrics);
      } else {
        // Fallback calculation from available data
        const totalRevenue = transformedTransactions
          .filter(t => t.type === 'revenue')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transformedTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalReceivables = agingReport.reduce((sum, cat) => sum + cat.total, 0);
        
        calculatedMetrics = {
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses,
          accountsReceivable: totalReceivables,
          accountsPayable: 0,
          cashFlow: totalRevenue - totalExpenses,
          currentRatio: 1.0,
          revenueGrowth: 0,
          expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0,
          dsoRatio: 30
        };
      }

      const mockCurrencyRates: CurrencyRate[] = [
        { currency: 'USD', rate: 83.15, lastUpdated: new Date(), trend: 'up' },
        { currency: 'EUR', rate: 90.25, lastUpdated: new Date(), trend: 'down' },
        { currency: 'GBP', rate: 105.80, lastUpdated: new Date(), trend: 'stable' }
      ];

      setIntegrations(mockIntegrations);
      setTransactions(transformedTransactions);
      setAgingReport(agingReport);
      setMetrics(calculatedMetrics);
      setCurrencyRates(mockCurrencyRates);
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIntegration = async (integrationId: string, connected: boolean) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId 
          ? { ...integration, isConnected: connected, status: connected ? 'active' : 'inactive' }
          : integration
      ));
      
      toast.success(`${connected ? 'Connected to' : 'Disconnected from'} integration`);
    } catch (error) {
      toast.error('Failed to update integration');
    }
  };

  const syncIntegration = async (integrationId: string) => {
    try {
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId 
          ? { ...integration, status: 'syncing' }
          : integration
      ));

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId 
          ? { ...integration, status: 'active', lastSync: new Date() }
          : integration
      ));
      
      toast.success('Synchronization completed');
      fetchFinancialData(); // Refresh data
    } catch (error) {
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId 
          ? { ...integration, status: 'error' }
          : integration
      ));
      toast.error('Synchronization failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'inactive': return <Clock className="w-4 h-4 text-gray-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'syncing': return 'bg-blue-100 text-blue-700';
      case 'error': return 'bg-red-100 text-red-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'expense': return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      case 'receivable': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'payable': return <CreditCard className="w-4 h-4 text-orange-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'erp': return <Building className="w-5 h-5" />;
      case 'accounting': return <Calculator className="w-5 h-5" />;
      case 'banking': return <Wallet className="w-5 h-5" />;
      case 'payment': return <CreditCard className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getCurrencyTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  const exportFinancialData = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Financial data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Financial & Accounting Integration</h1>
          <p className="text-gray-600">Connect and sync with your accounting systems</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={baseCurrency} onValueChange={setBaseCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={fiscalPeriod} onValueChange={setFiscalPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="quarter">Current Quarter</SelectItem>
              <SelectItem value="year">Current Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchFinancialData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+{metrics.revenueGrowth}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Income</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.netIncome)}</p>
                </div>
                <Target className="w-6 h-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Accounts Receivable</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(metrics.accountsReceivable)}</p>
                </div>
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-xs text-gray-500 mt-1">DSO: {metrics.dsoRatio} days</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cash Flow</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.cashFlow)}</p>
                </div>
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Ratio</p>
                  <p className="text-2xl font-bold">{metrics.currentRatio}</p>
                </div>
                <BarChart3 className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-xs text-gray-500 mt-1">Liquidity measure</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Dashboard - No Tabs, Just Dashboard Content */}
      <div className="space-y-6">
        {/* Integration Cards */}
        <div>
          <h3 className="text-lg font-medium mb-4">System Integrations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {integrations.map(integration => (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getIntegrationIcon(integration.type)}
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <p className="text-sm text-gray-500 capitalize">{integration.type}</p>
                      </div>
                    </div>

                    <Badge className={getStatusColor(integration.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(integration.status)}
                        <span className="text-xs capitalize">{integration.status}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <p className="text-gray-600">Last Sync: {integration.lastSync.toLocaleString()}</p>
                    <p className="text-gray-600">Auto Sync: {integration.autoSync ? 'Enabled' : 'Disabled'}</p>
                    {integration.settings.companyCode && (
                      <p className="text-gray-600">Company: {integration.settings.companyCode}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={integration.isConnected}
                        onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                        size="sm"
                      />
                      <span className="text-sm text-gray-600">
                        {integration.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {integration.isConnected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncIntegration(integration.id)}
                          disabled={integration.status === 'syncing'}
                        >
                          <RefreshCw className={`w-3 h-3 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setSettingsDialogOpen(true);
                        }}
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Transactions Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => exportFinancialData('excel')}>
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
                <Button size="sm" variant="outline">
                  <Upload className="w-3 h-3 mr-1" />
                  Import
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 5).map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.guestName && (
                          <p className="text-xs text-gray-500">{transaction.guestName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.reference}</TableCell>
                    <TableCell>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'revenue' ? 'text-green-600' :
                          transaction.type === 'expense' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </p>
                        {transaction.taxAmount && (
                          <p className="text-xs text-gray-500">
                            Tax: {formatCurrency(transaction.taxAmount)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        transaction.status === 'posted' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        transaction.status === 'reconciled' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {transactions.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  <Eye className="w-3 h-3 mr-1" />
                  View All Transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounts Receivable Aging Report */}
        <Card>
          <CardHeader>
            <CardTitle>Accounts Receivable Aging Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>31-60 Days</TableHead>
                  <TableHead>61-90 Days</TableHead>
                  <TableHead>91-120 Days</TableHead>
                  <TableHead>Over 120 Days</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agingReport.map(report => (
                  <TableRow key={report.category}>
                    <TableCell className="font-medium">{report.category}</TableCell>
                    <TableCell>{formatCurrency(report.current)}</TableCell>
                    <TableCell>{formatCurrency(report.days30)}</TableCell>
                    <TableCell>{formatCurrency(report.days60)}</TableCell>
                    <TableCell>{formatCurrency(report.days90)}</TableCell>
                    <TableCell className="text-red-600">
                      {formatCurrency(report.over90)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(report.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Exchange Rates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Exchange Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currencyRates.map(rate => (
                <div key={rate.currency} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{rate.currency}</span>
                    <div className="flex items-center gap-1">
                      {getCurrencyTrendIcon(rate.trend)}
                      <span className="text-sm text-gray-500">{rate.trend}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{rate.rate.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {rate.lastUpdated.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Rates
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Base Currency</Label>
                <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupee (INR)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Active Currencies</Label>
                <div className="space-y-2">
                  {['USD', 'EUR', 'GBP', 'AED', 'SGD'].map(currency => (
                    <div key={currency} className="flex items-center gap-2">
                      <Switch size="sm" />
                      <span className="text-sm">{currency}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Auto-Update Rates</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Switch />
                  <span className="text-sm text-gray-600">Daily at 9:00 AM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Integration Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedIntegration && `${selectedIntegration.name} Settings`}
            </DialogTitle>
            <DialogDescription>
              Configure integration-specific settings and account mappings
            </DialogDescription>
          </DialogHeader>
          
          {selectedIntegration && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sync Interval (minutes)</Label>
                  <Input
                    type="number"
                    value={selectedIntegration.syncInterval}
                    onChange={(e) => {
                      const updated = { ...selectedIntegration, syncInterval: parseInt(e.target.value) };
                      setSelectedIntegration(updated);
                    }}
                  />
                </div>
                <div>
                  <Label>Company Code</Label>
                  <Input
                    value={selectedIntegration.settings.companyCode || ''}
                    onChange={(e) => {
                      const updated = {
                        ...selectedIntegration,
                        settings: { ...selectedIntegration.settings, companyCode: e.target.value }
                      };
                      setSelectedIntegration(updated);
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedIntegration.autoSync}
                  onCheckedChange={(checked) => {
                    const updated = { ...selectedIntegration, autoSync: checked };
                    setSelectedIntegration(updated);
                  }}
                />
                <Label>Enable Auto Sync</Label>
              </div>

              <div>
                <Label>Chart of Accounts Mapping</Label>
                <div className="space-y-2 mt-2">
                  {Object.entries(selectedIntegration.settings.chartOfAccounts).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-2">
                      <Input value={key} disabled className="bg-gray-50" />
                      <Input 
                        value={value}
                        onChange={(e) => {
                          const updated = {
                            ...selectedIntegration,
                            settings: {
                              ...selectedIntegration.settings,
                              chartOfAccounts: {
                                ...selectedIntegration.settings.chartOfAccounts,
                                [key]: e.target.value
                              }
                            }
                          };
                          setSelectedIntegration(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    // Save settings
                    setIntegrations(prev => prev.map(i => 
                      i.id === selectedIntegration.id ? selectedIntegration : i
                    ));
                    setSettingsDialogOpen(false);
                    toast.success('Integration settings updated');
                  }}
                >
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingIntegrationDashboard;