import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Filter,
  Eye,
  Plus,
  RefreshCw,
  Download,
  Search
} from 'lucide-react';

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  pendingOrders: number;
  totalValue: number;
  monthlyConsumption: number;
  avgCostPerItem: number;
  activeVendors: number;
  reorderAlerts: number;
}

interface StockMovement {
  id: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  timestamp: string;
  user: string;
  reason?: string;
  unitPrice?: number;
}

interface InventoryAlert {
  id: string;
  type: 'LOW_STOCK' | 'REORDER' | 'OVERDUE' | 'BUDGET' | 'QUALITY';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  itemId?: string;
  itemName?: string;
  currentStock?: number;
  threshold?: number;
  createdAt: string;
}

interface VendorPerformance {
  id: string;
  name: string;
  overallRating: number;
  totalOrders: number;
  onTimeDeliveryRate: number;
  totalOrderValue: number;
  lastOrderDate: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

interface CostAnalytics {
  period: string;
  totalCost: number;
  categories: Array<{
    name: string;
    cost: number;
    percentage: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

const UnifiedInventoryDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - Replace with actual API calls
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 450,
    lowStockItems: 23,
    pendingOrders: 8,
    totalValue: 125000,
    monthlyConsumption: 18500,
    avgCostPerItem: 278,
    activeVendors: 12,
    reorderAlerts: 15
  });

  const [recentActivity, setRecentActivity] = useState<StockMovement[]>([
    {
      id: '1',
      itemName: 'Premium Bath Towels',
      type: 'IN',
      quantity: 50,
      timestamp: '2024-01-15T10:30:00Z',
      user: 'John Smith',
      unitPrice: 25
    },
    {
      id: '2',
      itemName: 'Cleaning Spray',
      type: 'OUT',
      quantity: 12,
      timestamp: '2024-01-15T09:45:00Z',
      user: 'Sarah Johnson',
      reason: 'Room cleaning'
    },
    {
      id: '3',
      itemName: 'Toilet Paper',
      type: 'ADJUSTMENT',
      quantity: -5,
      timestamp: '2024-01-15T08:20:00Z',
      user: 'Mike Wilson',
      reason: 'Stock audit adjustment'
    }
  ]);

  const [criticalAlerts, setCriticalAlerts] = useState<InventoryAlert[]>([
    {
      id: '1',
      type: 'LOW_STOCK',
      title: 'Critical Low Stock Alert',
      message: 'Premium Bed Sheets are critically low (3 remaining, threshold: 20)',
      severity: 'critical',
      itemName: 'Premium Bed Sheets',
      currentStock: 3,
      threshold: 20,
      createdAt: '2024-01-15T08:00:00Z'
    },
    {
      id: '2',
      type: 'REORDER',
      title: 'Automatic Reorder Triggered',
      message: 'Shampoo bottles have reached reorder point, PO created automatically',
      severity: 'medium',
      itemName: 'Shampoo Bottles',
      currentStock: 15,
      threshold: 15,
      createdAt: '2024-01-15T07:30:00Z'
    },
    {
      id: '3',
      type: 'OVERDUE',
      title: 'Overdue Delivery',
      message: 'PO-2024-001 from ABC Supplies is 3 days overdue',
      severity: 'high',
      createdAt: '2024-01-15T06:00:00Z'
    }
  ]);

  const [topVendors, setTopVendors] = useState<VendorPerformance[]>([
    {
      id: '1',
      name: 'ABC Hotel Supplies',
      overallRating: 4.8,
      totalOrders: 25,
      onTimeDeliveryRate: 96,
      totalOrderValue: 45000,
      lastOrderDate: '2024-01-10T00:00:00Z'
    },
    {
      id: '2',
      name: 'Premium Linens Co.',
      overallRating: 4.6,
      totalOrders: 18,
      onTimeDeliveryRate: 89,
      totalOrderValue: 32000,
      lastOrderDate: '2024-01-08T00:00:00Z'
    }
  ]);

  const [costTrends, setCostTrends] = useState<CostAnalytics[]>([
    {
      period: 'January 2024',
      totalCost: 18500,
      categories: [
        { name: 'Linens', cost: 7400, percentage: 40 },
        { name: 'Cleaning', cost: 4625, percentage: 25 },
        { name: 'Toiletries', cost: 3700, percentage: 20 },
        { name: 'Others', cost: 2775, percentage: 15 }
      ],
      trend: 'up',
      changePercentage: 8.5
    }
  ]);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Create Purchase Order',
      description: 'Create new PO for low stock items',
      icon: <ShoppingCart className="w-6 h-6" />,
      action: () => console.log('Create PO'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: '2',
      title: 'Add New Item',
      description: 'Add new inventory item',
      icon: <Plus className="w-6 h-6" />,
      action: () => console.log('Add item'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: '3',
      title: 'Stock Audit',
      description: 'Perform inventory audit',
      icon: <Eye className="w-6 h-6" />,
      action: () => console.log('Stock audit'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: '4',
      title: 'Generate Report',
      description: 'Create inventory report',
      icon: <Download className="w-6 h-6" />,
      action: () => console.log('Generate report'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  useEffect(() => {
    // Simulate API loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'IN': return 'text-green-600 bg-green-50';
      case 'OUT': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Management Dashboard</h1>
            <p className="text-gray-600">Complete overview of your hotel's inventory system</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% from last month
                </p>
              </div>
              <Package className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.lowStockItems}</p>
                <p className="text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Needs attention
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +5.2% this month
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
                <p className="text-sm text-yellow-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  2 overdue
                </p>
              </div>
              <ShoppingCart className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className={`${action.color} text-white p-4 rounded-lg transition-colors duration-200 flex items-center`}
              >
                <div className="mr-3">{action.icon}</div>
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Package },
                { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
                { id: 'activity', label: 'Recent Activity', icon: TrendingUp },
                { id: 'vendors', label: 'Top Vendors', icon: Users },
                { id: 'analytics', label: 'Cost Analytics', icon: DollarSign }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Distribution</h3>
                  <div className="space-y-3">
                    {costTrends[0].categories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(category.cost)}</p>
                          <p className="text-xs text-gray-500">{category.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Monthly Consumption</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyConsumption)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Avg Cost/Item</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgCostPerItem)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Active Vendors</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeVendors}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Reorder Alerts</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.reorderAlerts}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Critical Alerts</h3>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {criticalAlerts.length} Active
                  </span>
                </div>
                <div className="space-y-4">
                  {criticalAlerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            <h4 className="font-medium">{alert.title}</h4>
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{alert.message}</p>
                          {alert.itemName && alert.currentStock !== undefined && (
                            <div className="mt-2 text-xs">
                              <span className="font-medium">Item:</span> {alert.itemName} |
                              <span className="font-medium"> Current Stock:</span> {alert.currentStock} |
                              <span className="font-medium"> Threshold:</span> {alert.threshold}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatDate(alert.createdAt)}</p>
                          <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Stock Movements</h3>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search movements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="IN">Stock In</option>
                      <option value="OUT">Stock Out</option>
                      <option value="ADJUSTMENT">Adjustments</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  {recentActivity.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementColor(movement.type)}`}>
                          {movement.type}
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{movement.itemName}</p>
                          <p className="text-sm text-gray-500">
                            {movement.type === 'OUT' ? 'Used' : movement.type === 'IN' ? 'Received' : 'Adjusted'} by {movement.user}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {movement.type === 'OUT' || movement.quantity < 0 ? '-' : '+'}{Math.abs(movement.quantity)} units
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(movement.timestamp)}</p>
                        {movement.unitPrice && (
                          <p className="text-sm text-green-600">{formatCurrency(movement.unitPrice * Math.abs(movement.quantity))}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'vendors' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Vendors</h3>
                <div className="space-y-4">
                  {topVendors.map((vendor, index) => (
                    <div key={vendor.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                            <div className="flex items-center mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      i < Math.floor(vendor.overallRating)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="ml-1 text-sm text-gray-600">
                                  {vendor.overallRating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Orders</p>
                              <p className="font-medium">{vendor.totalOrders}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">On-Time</p>
                              <p className="font-medium text-green-600">{vendor.onTimeDeliveryRate}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Value</p>
                              <p className="font-medium">{formatCurrency(vendor.totalOrderValue)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Analytics</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Monthly Trends</h4>
                      <div className="flex items-center">
                        {costTrends[0].trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${
                          costTrends[0].trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {costTrends[0].changePercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Monthly Cost</span>
                        <span className="font-medium">{formatCurrency(costTrends[0].totalCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Daily Cost</span>
                        <span className="font-medium">{formatCurrency(costTrends[0].totalCost / 30)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cost per Item</span>
                        <span className="font-medium">{formatCurrency(stats.avgCostPerItem)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">Budget Utilization</h4>
                    <div className="space-y-4">
                      {costTrends[0].categories.map((category, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{category.name}</span>
                            <span className="font-medium">{category.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedInventoryDashboard;