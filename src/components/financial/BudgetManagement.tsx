import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Edit,
  Search,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Target,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import financialService from '@/services/financialService';

interface Budget {
  _id: string;
  budgetName: string;
  fiscalYear: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  currency: string;
  status: 'draft' | 'active' | 'approved' | 'closed';
  budgetCategories: BudgetCategory[];
  totalBudgetedAmount: number;
  totalActualAmount: number;
  approvedBy?: string;
  approvedDate?: Date;
  createdBy: string;
  lastUpdated: Date;
}

interface BudgetCategory {
  categoryName: string;
  accountId: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  quarters: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
}

const BudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedTab, setSelectedTab] = useState('budgets');
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);

  const [budgetFormData, setBudgetFormData] = useState({
    budgetName: '',
    fiscalYear: new Date().getFullYear(),
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    currency: 'INR',
    status: 'draft' as const
  });

  const budgetStatuses = [
    { value: 'draft', label: 'Draft', color: 'secondary' },
    { value: 'active', label: 'Active', color: 'default' },
    { value: 'approved', label: 'Approved', color: 'default' },
    { value: 'closed', label: 'Closed', color: 'outline' }
  ];

  // Mock data for now
  const mockBudgets: Budget[] = [
    {
      _id: '1',
      budgetName: 'Annual Budget 2024',
      fiscalYear: 2024,
      period: {
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31)
      },
      currency: 'INR',
      status: 'approved',
      budgetCategories: [
        {
          categoryName: 'Room Revenue',
          accountId: 'acc1',
          budgetedAmount: 25000000,
          actualAmount: 21000000,
          variance: -4000000,
          variancePercentage: -16,
          quarters: { q1: 6000000, q2: 6500000, q3: 6000000, q4: 6500000 }
        },
        {
          categoryName: 'F&B Revenue',
          accountId: 'acc2',
          budgetedAmount: 8000000,
          actualAmount: 7500000,
          variance: -500000,
          variancePercentage: -6.25,
          quarters: { q1: 2000000, q2: 2000000, q3: 2000000, q4: 2000000 }
        }
      ],
      totalBudgetedAmount: 33000000,
      totalActualAmount: 28500000,
      approvedDate: new Date(2023, 11, 15),
      createdBy: 'admin',
      lastUpdated: new Date()
    }
  ];

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;

      const response = await financialService.getBudgets(filters);
      const budgetData = response.data?.budgets || [];

      setBudgets(budgetData);
      if (budgetData.length > 0) {
        setSelectedBudget(budgetData[0]);
      }

      console.log('✅ Budget data loaded from backend:', budgetData.length, 'budgets');
    } catch (error: any) {
      console.error('❌ Failed to load budgets from backend:', error);
      toast.error('Failed to load budgets from backend, using fallback data');

      // Fallback to mock data
      setBudgets(mockBudgets);
      setSelectedBudget(mockBudgets[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = () => {
    setShowBudgetDialog(true);
  };

  const handleSubmitBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const budgetData = {
        budgetName: budgetFormData.budgetName,
        budgetType: 'Operating',
        fiscalYear: budgetFormData.fiscalYear,
        currency: budgetFormData.currency,
        status: budgetFormData.status.charAt(0).toUpperCase() + budgetFormData.status.slice(1),
        budgetLines: []
      };

      await financialService.createBudget(budgetData);
      await fetchBudgets();

      toast.success('Budget created successfully');
      setShowBudgetDialog(false);

      // Reset form
      setBudgetFormData({
        budgetName: '',
        fiscalYear: new Date().getFullYear(),
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
        currency: 'INR',
        status: 'draft'
      });
    } catch (error: any) {
      console.error('❌ Failed to create budget:', error);
      toast.error('Failed to create budget: ' + error.message);
    }
  };

  const getVarianceColor = (percentage: number) => {
    if (percentage > 10) return 'text-red-600';
    if (percentage < -10) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getVarianceIcon = (percentage: number) => {
    if (percentage > 5) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (percentage < -5) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Target className="w-4 h-4 text-yellow-600" />;
  };

  // Apply filtering after data is loaded
  useEffect(() => {
    if (!loading) {
      fetchBudgets();
    }
  }, [filterStatus]);

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.budgetName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || budget.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const budgetProgress = selectedBudget ? 
    Math.round((selectedBudget.totalActualAmount / selectedBudget.totalBudgetedAmount) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
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
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-gray-600">Plan, track, and analyze your financial budgets</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateBudget}>
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {selectedBudget && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Budgeted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{formatCurrency(selectedBudget.totalBudgetedAmount)}</p>
                <Target className="w-5 h-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Actual Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{formatCurrency(selectedBudget.totalActualAmount)}</p>
                <IndianRupee className="w-5 h-5 text-green-500" />
              </div>
              <div className="mt-2">
                <Progress value={budgetProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{budgetProgress}% of budget used</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Variance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className={`text-2xl font-bold ${getVarianceColor(
                  ((selectedBudget.totalActualAmount - selectedBudget.totalBudgetedAmount) / selectedBudget.totalBudgetedAmount) * 100
                )}`}>
                  {formatCurrency(selectedBudget.totalActualAmount - selectedBudget.totalBudgetedAmount)}
                </p>
                {getVarianceIcon(((selectedBudget.totalActualAmount - selectedBudget.totalBudgetedAmount) / selectedBudget.totalBudgetedAmount) * 100)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant={selectedBudget.status === 'approved' ? 'default' : 'secondary'}>
                  {selectedBudget.status.toUpperCase()}
                </Badge>
                {selectedBudget.status === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">FY {selectedBudget.fiscalYear}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search budgets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    {budgetStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Budgets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview ({filteredBudgets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Budget Name</TableHead>
                    <TableHead>Fiscal Year</TableHead>
                    <TableHead className="text-right">Budgeted Amount</TableHead>
                    <TableHead className="text-right">Actual Amount</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBudgets.map((budget) => {
                    const variance = budget.totalActualAmount - budget.totalBudgetedAmount;
                    const variancePercentage = (variance / budget.totalBudgetedAmount) * 100;
                    
                    return (
                      <TableRow key={budget._id}>
                        <TableCell>
                          <div className="cursor-pointer" onClick={() => setSelectedBudget(budget)}>
                            <p className="font-medium">{budget.budgetName}</p>
                          </div>
                        </TableCell>
                        <TableCell>FY {budget.fiscalYear}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(budget.totalBudgetedAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(budget.totalActualAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`flex items-center justify-end ${getVarianceColor(variancePercentage)}`}>
                            {getVarianceIcon(variancePercentage)}
                            <div className="ml-2">
                              <p className="font-medium">{formatCurrency(variance)}</p>
                              <p className="text-xs">({variancePercentage.toFixed(1)}%)</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={budgetStatuses.find(s => s.value === budget.status)?.color as any}>
                            {budget.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          {selectedBudget ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedBudget.budgetName} - Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Budgeted</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBudget.budgetCategories?.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{category.categoryName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.budgetedAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.actualAmount)}</TableCell>
                        <TableCell className={`text-right ${getVarianceColor(category.variancePercentage)}`}>
                          {formatCurrency(category.variance)} ({category.variancePercentage.toFixed(1)}%)
                        </TableCell>
                        <TableCell>
                          <Progress 
                            value={Math.min((category.actualAmount / category.budgetedAmount) * 100, 100)} 
                            className="h-2"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">Select a budget to view categories</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Budget Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Budget vs Actual Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Variance Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogDescription>Create a new budget for planning and tracking</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitBudget} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budgetName">Budget Name</Label>
              <Input
                id="budgetName"
                value={budgetFormData.budgetName}
                onChange={(e) => setBudgetFormData({...budgetFormData, budgetName: e.target.value})}
                placeholder="e.g., Annual Budget 2024"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiscalYear">Fiscal Year</Label>
                <Input
                  id="fiscalYear"
                  type="number"
                  value={budgetFormData.fiscalYear}
                  onChange={(e) => setBudgetFormData({...budgetFormData, fiscalYear: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={budgetFormData.currency}
                  onValueChange={(value) => setBudgetFormData({...budgetFormData, currency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowBudgetDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Budget</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetManagement;