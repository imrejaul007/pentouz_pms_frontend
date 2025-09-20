import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import financialService, { ChartOfAccount } from '@/services/financialService';
import { formatCurrency } from '@/utils/currencyUtils';
import { toast } from 'sonner';

interface AccountFormData {
  accountCode: string;
  accountName: string;
  accountType: string;
  category: string;
  subCategory: string;
  parentAccount: string;
  normalBalance: string;
  taxReportingCategory: string;
  description: string;
}

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<ChartOfAccount | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    accountCode: '',
    accountName: '',
    accountType: '',
    category: '',
    subCategory: '',
    parentAccount: '',
    normalBalance: '',
    taxReportingCategory: '',
    description: ''
  });

  const accountTypes = [
    'asset',
    'liability',
    'equity',
    'revenue',
    'expense',
    'cost_of_goods_sold'
  ];

  const categories = {
    asset: ['current_assets', 'fixed_assets', 'other_assets'],
    liability: ['current_liabilities', 'long_term_liabilities'],
    equity: ['owner_equity', 'retained_earnings'],
    revenue: ['room_revenue', 'food_beverage_revenue', 'other_revenue'],
    expense: ['operating_expenses', 'administrative_expenses', 'marketing_expenses'],
    cost_of_goods_sold: ['cost_of_sales']
  };

  useEffect(() => {
    fetchAccounts();
  }, [filterType, filterCategory]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);

      console.log('🔍 Fetching flattened chart of accounts from backend...');
      const response = await financialService.getFlattenedAccounts();
      console.log('📊 Backend-flattened accounts response:', response);

      // Use the backend-calculated flattened accounts directly
      const accountsData = response.data?.accounts || [];

      console.log('✅ Using backend-flattened accounts:', accountsData.length, 'accounts');
      setAccounts(accountsData);
    } catch (error: any) {
      console.error('❌ Failed to fetch backend-flattened accounts:', error);
      toast.error('Failed to fetch accounts from backend, trying fallback');

      // Fallback to the old tree method if needed
      try {
        console.log('🔄 Trying fallback tree method...');
        const treeResponse = await financialService.getAccountTree();
        const accountsData = treeResponse.data?.accountTree
          ? flattenAccountTree(treeResponse.data.accountTree)
          : [];
        console.log('📦 Using fallback flattened accounts:', accountsData.length, 'accounts');
        setAccounts(accountsData);
      } catch (fallbackError: any) {
        console.error('❌ Fallback also failed:', fallbackError);
        toast.error('Failed to fetch accounts: ' + fallbackError.message);
        setAccounts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to flatten the account tree into a flat array
  // NOTE: This is kept as a fallback - primary flattening now done on backend
  const flattenAccountTree = (accounts: any[]): any[] => {
    let flattened: any[] = [];
    
    const flatten = (account: any) => {
      flattened.push(account);
      if (account.children && Array.isArray(account.children)) {
        account.children.forEach(flatten);
      }
    };
    
    accounts.forEach(flatten);
    return flattened;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accountData = {
        ...formData,
        accountId: `ACC-${Date.now()}`, // Generate unique ID
        balance: 0,
        isActive: true
      };

      if (editingAccount) {
        await financialService.updateAccount(editingAccount._id, accountData);
        toast.success('Account updated successfully');
      } else {
        await financialService.createAccount(accountData);
        toast.success('Account created successfully');
      }

      setShowDialog(false);
      setEditingAccount(null);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      toast.error('Failed to save account: ' + error.message);
    }
  };

  const handleEdit = (account: ChartOfAccount) => {
    setEditingAccount(account);
    setFormData({
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: account.accountType,
      category: account.category,
      subCategory: account.subCategory || '',
      parentAccount: account.parentAccount || '',
      normalBalance: account.normalBalance,
      taxReportingCategory: account.taxReportingCategory || '',
      description: account.description || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (account: ChartOfAccount) => {
    try {
      await financialService.deleteAccount(account._id);
      toast.success('Account deactivated successfully');
      fetchAccounts();
      setDeleteAccount(null);
    } catch (error: any) {
      toast.error('Failed to deactivate account: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      accountCode: '',
      accountName: '',
      accountType: '',
      category: '',
      subCategory: '',
      parentAccount: '',
      normalBalance: '',
      taxReportingCategory: '',
      description: ''
    });
  };

  const filteredAccounts = (Array.isArray(accounts) ? accounts : []).filter(account =>
    account.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBalanceColor = (account: ChartOfAccount) => {
    const balance = account.currentBalance || 0;
    const isNormalBalance = 
      (account.normalBalance === 'Debit' && balance >= 0) ||
      (account.normalBalance === 'Credit' && balance < 0);
    return isNormalBalance ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-gray-600">Manage your accounting structure</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Edit Account' : 'Create Account'}
              </DialogTitle>
              <DialogDescription>
                {editingAccount ? 'Update account information' : 'Add a new account to your chart'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountCode">Account Code</Label>
                  <Input
                    id="accountCode"
                    value={formData.accountCode}
                    onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                    placeholder="e.g., 1000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="e.g., Cash"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) => setFormData({ ...formData, accountType: value, category: '' })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={!formData.accountType}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.accountType && categories[formData.accountType as keyof typeof categories]?.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="normalBalance">Normal Balance</Label>
                <Select
                  value={formData.normalBalance}
                  onValueChange={(value) => setFormData({ ...formData, normalBalance: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select normal balance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub Category (Optional)</Label>
                <Input
                  id="subCategory"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  placeholder="e.g., Petty Cash"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Account description..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAccount ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {accountTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {Object.values(categories).flat().map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts ({filteredAccounts.length})</CardTitle>
          <CardDescription>
            Manage your chart of accounts structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account._id}>
                  <TableCell className="font-mono">{account.accountCode}</TableCell>
                  <TableCell className="font-medium">{account.accountName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {account.accountType.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {(account.accountSubType || account.category || '').replace('_', ' ').toUpperCase()}
                  </TableCell>
                  <TableCell className={getBalanceColor(account)}>
                    {formatCurrency(account.currentBalance || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(account)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setDeleteAccount(account)}
                        disabled={!account.isActive}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAccount} onOpenChange={() => setDeleteAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{deleteAccount?.accountName}"? 
              This will hide the account from active lists but preserve historical data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAccount && handleDelete(deleteAccount)}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChartOfAccounts;