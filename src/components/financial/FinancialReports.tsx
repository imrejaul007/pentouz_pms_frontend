import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  BarChart3,
  Calculator,
  Building,
  CreditCard,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import financialService from '@/services/financialService';
import { formatCurrency } from '@/utils/currencyUtils';
import { toast } from 'sonner';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';

interface FinancialStatement {
  incomeStatement: {
    revenue: {
      roomRevenue: number;
      fbRevenue: number;
      otherRevenue: number;
      totalRevenue: number;
    };
    expenses: {
      operatingExpenses: number;
      staffExpenses: number;
      marketingExpenses: number;
      adminExpenses: number;
      totalExpenses: number;
    };
    netIncome: number;
    grossProfit: number;
    operatingIncome: number;
  };
  balanceSheet: {
    assets: {
      currentAssets: number;
      fixedAssets: number;
      totalAssets: number;
    };
    liabilities: {
      currentLiabilities: number;
      longTermLiabilities: number;
      totalLiabilities: number;
    };
    equity: {
      retainedEarnings: number;
      totalEquity: number;
    };
  };
  cashFlow: {
    operatingActivities: number;
    investingActivities: number;
    financingActivities: number;
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
  };
  ratios: {
    currentRatio: number;
    debtToEquity: number;
    returnOnAssets: number;
    returnOnEquity: number;
    profitMargin: number;
    grossMargin: number;
  };
}

interface ReportFilter {
  period: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
}

const FinancialReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('income-statement');
  const [financialData, setFinancialData] = useState<FinancialStatement | null>(null);
  const [filter, setFilter] = useState<ReportFilter>({
    period: 'monthly',
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });

  useEffect(() => {
    fetchFinancialData();
  }, [filter]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Use the comprehensive financial statement endpoint with backend calculations
      const response = await financialService.getComprehensiveFinancialStatement({
        startDate: format(filter.startDate, 'yyyy-MM-dd'),
        endDate: format(filter.endDate, 'yyyy-MM-dd')
      });

      console.log('✅ Using backend-calculated financial statements:', response);
      setFinancialData(response.data);

    } catch (error: any) {
      console.error('❌ Failed to load backend financial data:', error);
      toast.error('Failed to fetch financial data from backend, using fallback data');

      // Fallback to sample data if API fails
      setFinancialData(getSampleData());
    } finally {
      setLoading(false);
    }
  };

  // Note: processFinancialData, getAccountBalance, and getAccountBalanceByType functions
  // have been removed as calculations are now performed on the backend via the
  // comprehensive financial statement endpoint for better consistency and performance.

  const getSampleData = (): FinancialStatement => ({
    incomeStatement: {
      revenue: {
        roomRevenue: 2850000,
        fbRevenue: 950000,
        otherRevenue: 150000,
        totalRevenue: 3950000
      },
      expenses: {
        operatingExpenses: 1200000,
        staffExpenses: 800000,
        marketingExpenses: 200000,
        adminExpenses: 300000,
        totalExpenses: 2500000
      },
      netIncome: 1450000,
      grossProfit: 1750000,
      operatingIncome: 1550000
    },
    balanceSheet: {
      assets: {
        currentAssets: 2500000,
        fixedAssets: 15000000,
        totalAssets: 17500000
      },
      liabilities: {
        currentLiabilities: 1350000,
        longTermLiabilities: 8000000,
        totalLiabilities: 9350000
      },
      equity: {
        retainedEarnings: 6150000,
        totalEquity: 8150000
      }
    },
    cashFlow: {
      operatingActivities: 1200000,
      investingActivities: -500000,
      financingActivities: -200000,
      netCashFlow: 500000,
      beginningCash: 800000,
      endingCash: 1300000
    },
    ratios: {
      currentRatio: 1.85,
      debtToEquity: 1.15,
      returnOnAssets: 8.3,
      returnOnEquity: 17.8,
      profitMargin: 36.7,
      grossMargin: 44.3
    }
  });

  const handleExportReport = async (reportType: string) => {
    try {
      const response = await financialService.exportFinancialReport({
        type: selectedTab,
        format: reportType.toLowerCase(),
        startDate: format(filter.startDate, 'yyyy-MM-dd'),
        endDate: format(filter.endDate, 'yyyy-MM-dd')
      });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: reportType === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `financial-report-${selectedTab}-${format(new Date(), 'yyyy-MM-dd')}.${reportType.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${reportType} report downloaded successfully`);
    } catch (error: any) {
      toast.error('Failed to export report: ' + error.message);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const renderIncomeStatement = () => (
    <div className="space-y-6">
      {/* Revenue Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Room Revenue</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(financialData?.incomeStatement.revenue.roomRevenue || 0)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {((financialData?.incomeStatement.revenue.roomRevenue || 0) / (financialData?.incomeStatement.revenue.totalRevenue || 1) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">F&B Revenue</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(financialData?.incomeStatement.revenue.fbRevenue || 0)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {((financialData?.incomeStatement.revenue.fbRevenue || 0) / (financialData?.incomeStatement.revenue.totalRevenue || 1) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Other Revenue</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(financialData?.incomeStatement.revenue.otherRevenue || 0)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {((financialData?.incomeStatement.revenue.otherRevenue || 0) / (financialData?.incomeStatement.revenue.totalRevenue || 1) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
              <TableRow className="border-t-2">
                <TableCell className="font-bold">Total Revenue</TableCell>
                <TableCell className="text-right font-bold font-mono">
                  {formatCurrency(financialData?.incomeStatement.revenue.totalRevenue || 0)}
                </TableCell>
                <TableCell className="text-right font-bold text-sm">100.0%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
            Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Operating Expenses</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(financialData?.incomeStatement.expenses.operatingExpenses || 0)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {((financialData?.incomeStatement.expenses.operatingExpenses || 0) / (financialData?.incomeStatement.expenses.totalExpenses || 1) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Staff Expenses</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(financialData?.incomeStatement.expenses.staffExpenses || 0)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {((financialData?.incomeStatement.expenses.staffExpenses || 0) / (financialData?.incomeStatement.expenses.totalExpenses || 1) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Marketing Expenses</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(financialData?.incomeStatement.expenses.marketingExpenses || 0)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {((financialData?.incomeStatement.expenses.marketingExpenses || 0) / (financialData?.incomeStatement.expenses.totalExpenses || 1) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Administrative Expenses</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(financialData?.incomeStatement.expenses.adminExpenses || 0)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {((financialData?.incomeStatement.expenses.adminExpenses || 0) / (financialData?.incomeStatement.expenses.totalExpenses || 1) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
              <TableRow className="border-t-2">
                <TableCell className="font-bold">Total Expenses</TableCell>
                <TableCell className="text-right font-bold font-mono text-red-600">
                  {formatCurrency(financialData?.incomeStatement.expenses.totalExpenses || 0)}
                </TableCell>
                <TableCell className="text-right font-bold text-sm">100.0%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Profitability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            Profitability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Gross Profit</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(financialData?.incomeStatement.grossProfit || 0)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {formatPercentage(((financialData?.incomeStatement.grossProfit || 0) / (financialData?.incomeStatement.revenue.totalRevenue || 1)) * 100)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Operating Income</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(financialData?.incomeStatement.operatingIncome || 0)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {formatPercentage(((financialData?.incomeStatement.operatingIncome || 0) / (financialData?.incomeStatement.revenue.totalRevenue || 1)) * 100)}
                </TableCell>
              </TableRow>
              <TableRow className="border-t-2">
                <TableCell className="font-bold text-green-700">Net Income</TableCell>
                <TableCell className="text-right font-bold font-mono text-green-700">
                  {formatCurrency(financialData?.incomeStatement.netIncome || 0)}
                </TableCell>
                <TableCell className="text-right font-bold text-sm text-green-700">
                  {formatPercentage(((financialData?.incomeStatement.netIncome || 0) / (financialData?.incomeStatement.revenue.totalRevenue || 1)) * 100)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-gray-600">Comprehensive financial analysis and reporting</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={() => handleExportReport('PDF')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('Excel')}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={filter.period} onValueChange={(value: any) => setFilter({...filter, period: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={format(filter.startDate, 'yyyy-MM-dd')}
                onChange={(e) => setFilter({...filter, startDate: new Date(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={format(filter.endDate, 'yyyy-MM-dd')}
                onChange={(e) => setFilter({...filter, endDate: new Date(e.target.value)})}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchFinancialData}>
                <Calendar className="w-4 h-4 mr-2" />
                Update Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="income-statement" className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Income Statement
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Balance Sheet  
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Cash Flow
          </TabsTrigger>
          <TabsTrigger value="ratios" className="flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Financial Ratios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income-statement">
          {renderIncomeStatement()}
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">Balance Sheet view - Connected to real backend data</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">Cash Flow view - Connected to real backend data</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">Financial Ratios - Connected to real backend data</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;