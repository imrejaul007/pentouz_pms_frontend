import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import POSDashboard from '../../components/pos/POSDashboard';
import POSOrderEntry from '../../components/pos/POSOrderEntry';
import OutletManagement from '../../components/pos/OutletManagement';
import MenuManagement from '../../components/pos/MenuManagement';
import UnifiedBillingSystem from '../../components/pos/UnifiedBillingSystem';
import POSReports from '../../components/pos/POSReports';

const AdminPOS: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNewOrderClick = () => {
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">New Order</TabsTrigger>
          <TabsTrigger value="outlets">Outlets</TabsTrigger>
          <TabsTrigger value="menus">Menus</TabsTrigger>
          <TabsTrigger value="billing">Unified Billing</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <POSDashboard onNewOrderClick={handleNewOrderClick} />
        </TabsContent>

        <TabsContent value="orders">
          <POSOrderEntry />
        </TabsContent>

        <TabsContent value="outlets">
          <OutletManagement />
        </TabsContent>

        <TabsContent value="menus">
          <MenuManagement />
        </TabsContent>

        <TabsContent value="billing">
          <UnifiedBillingSystem />
        </TabsContent>

        <TabsContent value="reports">
          <POSReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPOS;