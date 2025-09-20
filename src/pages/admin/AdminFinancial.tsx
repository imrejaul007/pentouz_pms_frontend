import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChartOfAccounts from '../../components/financial/ChartOfAccounts';
import GeneralLedger from '../../components/financial/GeneralLedger';
import InvoiceManagement from '../../components/financial/InvoiceManagement';
import PaymentManagement from '../../components/financial/PaymentManagement';
import BankAccountManagement from '../../components/financial/BankAccountManagement';
import BudgetManagement from '../../components/financial/BudgetManagement';
import FinancialReports from '../../components/financial/FinancialReports';
import AccountingIntegrationDashboard from '../../components/financial/AccountingIntegrationDashboard';

const AdminFinancial: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="banks">Bank Accounts</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AccountingIntegrationDashboard />
        </TabsContent>

        <TabsContent value="accounts">
          <ChartOfAccounts />
        </TabsContent>

        <TabsContent value="ledger">
          <GeneralLedger />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceManagement />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentManagement />
        </TabsContent>

        <TabsContent value="banks">
          <BankAccountManagement />
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetManagement />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinancial;