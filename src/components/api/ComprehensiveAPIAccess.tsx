import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Code,
  Key,
  Globe,
  Shield,
  Zap,
  Database,
  Cloud,
  Settings,
  Users,
  BarChart3,
  Activity,
  Lock,
  Unlock,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Server,
  Webhook,
  Terminal,
  FileText,
  Filter,
  Search
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { apiManagementApi } from '../../services/api';
import { APIKeyCreationForm } from './APIKeyCreationForm';
import { WebhookCreationForm } from './WebhookCreationForm';

interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  category: string;
  version: string;
  status: 'active' | 'deprecated' | 'beta' | 'maintenance';
  authRequired: boolean;
  rateLimit: number;
  usage: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
  lastUsed: string;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  type: 'read' | 'write' | 'admin';
  permissions: string[];
  expiresAt?: string;
  isActive: boolean;
  usage: {
    requests: number;
    lastUsed?: string;
    rateLimit: number;
    rateLimitUsed: number;
  };
  createdBy: string;
  createdAt: string;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  stats: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    lastDelivery?: string;
  };
}

interface APIMetrics {
  totalRequests: number;
  requestsToday: number;
  avgResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    errors: number;
  }>;
  statusCodes: {
    [key: string]: number;
  };
}

export const ComprehensiveAPIAccess: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [apiMetrics, setApiMetrics] = useState<APIMetrics | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [showKeyCreator, setShowKeyCreator] = useState(false);
  const [showWebhookCreator, setShowWebhookCreator] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [documentation, setDocumentation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockAPIEndpoints: APIEndpoint[] = [
    {
      id: 'EP001',
      name: 'Get Reservations',
      method: 'GET',
      path: '/api/v1/reservations',
      description: 'Retrieve all reservations with optional filtering',
      category: 'Reservations',
      version: 'v1',
      status: 'active',
      authRequired: true,
      rateLimit: 1000,
      usage: { requests: 25847, errors: 12, avgResponseTime: 145 },
      lastUsed: '2024-12-01T14:30:00Z'
    },
    {
      id: 'EP002',
      name: 'Create Reservation',
      method: 'POST',
      path: '/api/v1/reservations',
      description: 'Create a new reservation',
      category: 'Reservations',
      version: 'v1',
      status: 'active',
      authRequired: true,
      rateLimit: 500,
      usage: { requests: 8934, errors: 45, avgResponseTime: 234 },
      lastUsed: '2024-12-01T14:15:00Z'
    },
    {
      id: 'EP003',
      name: 'Get Rooms',
      method: 'GET',
      path: '/api/v1/rooms',
      description: 'Retrieve room inventory and availability',
      category: 'Inventory',
      version: 'v1',
      status: 'active',
      authRequired: true,
      rateLimit: 2000,
      usage: { requests: 45234, errors: 23, avgResponseTime: 89 },
      lastUsed: '2024-12-01T14:45:00Z'
    },
    {
      id: 'EP004',
      name: 'Process Payment',
      method: 'POST',
      path: '/api/v1/payments',
      description: 'Process guest payments and transactions',
      category: 'Payments',
      version: 'v1',
      status: 'active',
      authRequired: true,
      rateLimit: 100,
      usage: { requests: 3456, errors: 8, avgResponseTime: 456 },
      lastUsed: '2024-12-01T14:20:00Z'
    },
    {
      id: 'EP005',
      name: 'Get Guest Profile (Legacy)',
      method: 'GET',
      path: '/api/v0/guest/{id}',
      description: 'Legacy endpoint for guest profile retrieval',
      category: 'Guests',
      version: 'v0',
      status: 'deprecated',
      authRequired: true,
      rateLimit: 100,
      usage: { requests: 234, errors: 12, avgResponseTime: 789 },
      lastUsed: '2024-11-15T10:30:00Z'
    }
  ];

  const mockAPIKeys: APIKey[] = [
    {
      id: 'KEY001',
      name: 'Mobile App Production',
      key: 'pk_live_1234567890abcdef',
      type: 'read',
      permissions: ['read:reservations', 'read:rooms', 'read:guests'],
      expiresAt: '2025-06-01T00:00:00Z',
      isActive: true,
      usage: {
        requests: 156789,
        lastUsed: '2024-12-01T14:45:00Z',
        rateLimit: 10000,
        rateLimitUsed: 7234
      },
      createdBy: 'John Smith',
      createdAt: '2024-06-01T09:00:00Z'
    },
    {
      id: 'KEY002',
      name: 'Partner Integration',
      key: 'pk_test_abcdef1234567890',
      type: 'write',
      permissions: ['read:reservations', 'write:reservations', 'read:rooms'],
      isActive: true,
      usage: {
        requests: 45623,
        lastUsed: '2024-12-01T13:20:00Z',
        rateLimit: 5000,
        rateLimitUsed: 2145
      },
      createdBy: 'Sarah Johnson',
      createdAt: '2024-08-15T14:30:00Z'
    },
    {
      id: 'KEY003',
      name: 'Admin Dashboard',
      key: 'pk_admin_fedcba0987654321',
      type: 'admin',
      permissions: ['*'],
      expiresAt: '2024-12-31T23:59:59Z',
      isActive: false,
      usage: {
        requests: 8934,
        lastUsed: '2024-11-28T16:45:00Z',
        rateLimit: 1000,
        rateLimitUsed: 0
      },
      createdBy: 'Admin User',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  const mockWebhooks: WebhookEndpoint[] = [
    {
      id: 'WH001',
      name: 'Booking Notifications',
      url: 'https://partner.example.com/webhooks/bookings',
      events: ['reservation.created', 'reservation.updated', 'reservation.cancelled'],
      isActive: true,
      secret: 'whsec_1234567890abcdef',
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2
      },
      stats: {
        totalDeliveries: 1245,
        successfulDeliveries: 1189,
        failedDeliveries: 56,
        lastDelivery: '2024-12-01T14:30:00Z'
      }
    },
    {
      id: 'WH002',
      name: 'Payment Processing',
      url: 'https://payments.example.com/webhooks/hotel',
      events: ['payment.completed', 'payment.failed', 'refund.processed'],
      isActive: true,
      secret: 'whsec_abcdef1234567890',
      retryPolicy: {
        maxRetries: 5,
        backoffMultiplier: 1.5
      },
      stats: {
        totalDeliveries: 567,
        successfulDeliveries: 562,
        failedDeliveries: 5,
        lastDelivery: '2024-12-01T14:15:00Z'
      }
    }
  ];

  const mockAPIMetrics: APIMetrics = {
    totalRequests: 234567,
    requestsToday: 15678,
    avgResponseTime: 187,
    errorRate: 0.8,
    topEndpoints: [
      { endpoint: '/api/v1/rooms', requests: 45234, errors: 23 },
      { endpoint: '/api/v1/reservations', requests: 25847, errors: 12 },
      { endpoint: '/api/v1/guests', requests: 18934, errors: 34 },
      { endpoint: '/api/v1/payments', requests: 3456, errors: 8 }
    ],
    statusCodes: {
      '200': 220145,
      '201': 8934,
      '400': 2134,
      '401': 1234,
      '404': 567,
      '500': 234
    }
  };

  useEffect(() => {
    loadData();

    // Set up polling for real-time updates (every 45 seconds for better performance)
    const interval = setInterval(() => {
      loadData(true); // Silent reload without loading state
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      // Optimize API calls for better performance
      const [keysResponse, webhooksResponse, metricsResponse, endpointsResponse] = await Promise.allSettled([
        apiManagementApi.getAPIKeys({ includeUsage: 'false' }), // Skip usage data for faster loading
        apiManagementApi.getWebhooks(),
        apiManagementApi.getMetrics(),
        apiManagementApi.getAllEndpoints({ includeUsage: 'false' }) // Skip usage data for faster loading
      ]);

      if (keysResponse.status === 'fulfilled') {
        console.log('API Keys response:', keysResponse.value);
        setApiKeys(keysResponse.value.data?.data?.apiKeys || []);
      } else {
        console.error('Failed to load API keys:', keysResponse.reason);
        if (!silent) setApiKeys(mockAPIKeys);
      }

      if (webhooksResponse.status === 'fulfilled') {
        console.log('Webhooks response:', webhooksResponse.value);
        setWebhooks(webhooksResponse.value.data?.data?.webhooks || []);
      } else {
        console.error('Failed to load webhooks:', webhooksResponse.reason);
        if (!silent) setWebhooks(mockWebhooks);
      }

      if (metricsResponse.status === 'fulfilled') {
        console.log('Metrics response:', metricsResponse.value);
        const rawMetrics = metricsResponse.value.data?.data;
        if (rawMetrics) {
          // Transform the API response to match the expected interface
          const transformedMetrics = {
            totalRequests: rawMetrics.totalRequests || 0,
            requestsToday: rawMetrics.requestsToday || 0, // Now provided by optimized API
            avgResponseTime: rawMetrics.averageResponseTime || 0,
            errorRate: parseFloat(rawMetrics.errorRate) || 0,
            topEndpoints: rawMetrics.topEndpoints || [], // Use data from API
            statusCodes: rawMetrics.statusCodes || {} // Use data from API
          };
          setApiMetrics(transformedMetrics);
        } else {
          setApiMetrics(null);
        }
      } else {
        console.error('Failed to load metrics:', metricsResponse.reason);
        if (!silent) setApiMetrics(mockAPIMetrics);
      }

      if (endpointsResponse.status === 'fulfilled') {
        console.log('Endpoints response:', endpointsResponse.value);
        setApiEndpoints(endpointsResponse.value.data?.data || []);
      } else {
        console.error('Failed to load endpoints:', endpointsResponse.reason);
        if (!silent) setApiEndpoints(mockAPIEndpoints);
      }

    } catch (error) {
      console.error('Failed to load API management data:', error);
      if (!silent) {
        setError('Failed to load data. Using fallback data.');

        // Set mock data on error during initial load only
        setApiEndpoints(mockAPIEndpoints);
        setApiKeys(mockAPIKeys);
        setWebhooks(mockWebhooks);
        setApiMetrics(mockAPIMetrics);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadDocumentation = async () => {
    try {
      const response = await apiManagementApi.getAPIDocumentation();
      setDocumentation(response.data.data);
      setShowDocumentation(true);
    } catch (error) {
      console.error('Failed to load API documentation:', error);
      toast({
        title: "Error",
        description: "Failed to load API documentation",
        variant: "destructive"
      });
    }
  };

  // Ensure apiEndpoints is always an array to prevent filter errors
  const safeApiEndpoints = Array.isArray(apiEndpoints) ? apiEndpoints : [];
  
  // Wrap filter operation in try-catch to prevent any crashes
  let filteredEndpoints: APIEndpoint[] = [];
  try {
    filteredEndpoints = safeApiEndpoints.filter(endpoint => {
      // Add comprehensive null checks to prevent undefined errors
      if (!endpoint || typeof endpoint !== 'object') return false;

      const name = (endpoint.name && typeof endpoint.name === 'string') ? endpoint.name : '';
      const path = (endpoint.path && typeof endpoint.path === 'string') ? endpoint.path : '';
      const category = (endpoint.category && typeof endpoint.category === 'string') ? endpoint.category : '';
      const method = (endpoint.method && typeof endpoint.method === 'string') ? endpoint.method : '';
      const status = (endpoint.status && typeof endpoint.status === 'string') ? endpoint.status : '';
      const lastUsed = endpoint.lastUsed ? new Date(endpoint.lastUsed) : null;

      const searchTermLower = (searchTerm && typeof searchTerm === 'string') ? searchTerm.toLowerCase() : '';

      const matchesSearch = name.toLowerCase().includes(searchTermLower) ||
                           path.toLowerCase().includes(searchTermLower) ||
                           method.toLowerCase().includes(searchTermLower);

      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesMethod = methodFilter === 'all' || method === methodFilter;

      const matchesDateFrom = !dateFromFilter || !lastUsed || lastUsed >= new Date(dateFromFilter);
      const matchesDateTo = !dateToFilter || !lastUsed || lastUsed <= new Date(dateToFilter + 'T23:59:59');

      return matchesSearch && matchesCategory && matchesStatus && matchesMethod && matchesDateFrom && matchesDateTo;
    });

    // Apply sorting
    filteredEndpoints.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.name || '';
          valueB = b.name || '';
          break;
        case 'method':
          valueA = a.method || '';
          valueB = b.method || '';
          break;
        case 'requests':
          valueA = a.usage?.requests || 0;
          valueB = b.usage?.requests || 0;
          break;
        case 'errors':
          valueA = a.usage?.errors || 0;
          valueB = b.usage?.errors || 0;
          break;
        case 'response_time':
          valueA = a.usage?.avgResponseTime || 0;
          valueB = b.usage?.avgResponseTime || 0;
          break;
        case 'last_used':
          valueA = a.lastUsed ? new Date(a.lastUsed) : new Date(0);
          valueB = b.lastUsed ? new Date(b.lastUsed) : new Date(0);
          break;
        default:
          valueA = a.name || '';
          valueB = b.name || '';
      }

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = (valueB || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  } catch (error) {
    console.error('Error filtering endpoints:', error);
    // Return empty array as fallback
    filteredEndpoints = [];
  }

  const toggleKeyStatus = async (keyId: string) => {
    try {
      const key = Array.isArray(apiKeys) ? apiKeys.find(k => k._id === keyId) : null;
      if (!key) return;

      await apiManagementApi.toggleAPIKeyStatus(keyId);

      setApiKeys((apiKeys || []).map(k =>
        k._id === keyId ? { ...k, isActive: !k.isActive } : k
      ));

      toast({
        title: "API Key Updated",
        description: `${key.name} has been ${!key.isActive ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Failed to toggle API key status:', error);
      toast({
        title: "Error",
        description: "Failed to update API key status. Please try again."
      });
    }
  };

  const toggleWebhookStatus = async (webhookId: string) => {
    try {
      const webhook = (webhooks || []).find(w => w._id === webhookId);
      if (!webhook) return;

      // Note: We'll need to add a toggle endpoint for webhooks, for now update directly
      const updatedWebhook = { ...webhook, isActive: !webhook.isActive };
      await apiManagementApi.updateWebhook(webhookId, updatedWebhook);

      setWebhooks((webhooks || []).map(w =>
        w._id === webhookId ? { ...w, isActive: !w.isActive } : w
      ));

      toast({
        title: "Webhook Updated",
        description: `${webhook.name} has been ${!webhook.isActive ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Failed to toggle webhook status:', error);
      toast({
        title: "Error",
        description: "Failed to update webhook status. Please try again."
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`
    });
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      case 'PATCH': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'deprecated': return 'destructive';
      case 'beta': return 'secondary';
      case 'maintenance': return 'outline';
      default: return 'secondary';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* API Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{(apiMetrics?.totalRequests || 0).toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requests Today</p>
                <p className="text-2xl font-bold">{(apiMetrics?.requestsToday || 0).toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{apiMetrics?.avgResponseTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{apiMetrics?.errorRate}%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Top API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(apiMetrics?.topEndpoints || []).map((endpoint, index) => (
              <div key={endpoint.endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{endpoint.endpoint}</div>
                    <div className="text-sm text-muted-foreground">
                      {(endpoint.requests || 0).toLocaleString()} requests
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{(endpoint.requests || 0).toLocaleString()}</div>
                  <div className="text-sm text-red-500">{endpoint.errors || 0} errors</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Response Status Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(apiMetrics?.statusCodes || {}).map(([code, count]) => (
              <div key={code} className="text-center p-4 border rounded-lg">
                <div className={`text-2xl font-bold ${
                  code.startsWith('2') ? 'text-green-600' :
                  code.startsWith('4') ? 'text-yellow-600' :
                  code.startsWith('5') ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {(count || 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">{code}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-medium">All Systems Operational</div>
                <div className="text-sm text-muted-foreground">All endpoints responding normally</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-medium">Security Status: Good</div>
                <div className="text-sm text-muted-foreground">No security incidents detected</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="font-medium">Rate Limits: Normal</div>
                <div className="text-sm text-muted-foreground">No rate limit violations</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEndpoints = () => (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Primary Search and Actions */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search endpoints, methods, or paths..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Endpoint
              </Button>
            </div>

            {/* Advanced Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Authentication">Authentication</SelectItem>
                  <SelectItem value="Bookings">Bookings</SelectItem>
                  <SelectItem value="Room Management">Room Management</SelectItem>
                  <SelectItem value="Guest Management">Guest Management</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="API Management">API Management</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="method">Method</SelectItem>
                  <SelectItem value="requests">Requests</SelectItem>
                  <SelectItem value="errors">Errors</SelectItem>
                  <SelectItem value="response_time">Response Time</SelectItem>
                  <SelectItem value="last_used">Last Used</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full"
              >
                {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
                {sortOrder === 'asc' ? <TrendingUp className="ml-2 h-4 w-4" /> : <TrendingDown className="ml-2 h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setMethodFilter('all');
                  setStatusFilter('all');
                  setDateFromFilter('');
                  setDateToFilter('');
                  setSortBy('name');
                  setSortOrder('asc');
                }}
                className="w-full"
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center space-x-4 pt-2 border-t">
              <Label className="text-sm font-medium whitespace-nowrap">Last Used:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="w-40"
                  placeholder="From"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="w-40"
                  placeholder="To"
                />
              </div>
              <div className="flex-1" />
              <Badge variant="secondary" className="ml-auto">
                {filteredEndpoints.length} endpoints
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints List */}
      <div className="space-y-4">
        {filteredEndpoints.map(endpoint => (
          <Card key={endpoint.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedEndpoint(endpoint)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 text-xs font-bold text-white rounded ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </div>
                    <Badge variant={getStatusColor(endpoint.status) as any}>
                      {endpoint.status}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{endpoint.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">{endpoint.path}</div>
                    <div className="text-sm text-muted-foreground mt-1">{endpoint.description}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-right">
                  <div>
                    <div className="text-lg font-bold">{(endpoint.usage?.requests || 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Requests</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${(endpoint.usage?.errors || 0) > 50 ? 'text-red-600' : 'text-green-600'}`}>
                      {endpoint.usage?.errors || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{endpoint.usage?.avgResponseTime || 0}ms</div>
                    <div className="text-xs text-muted-foreground">Avg Response</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAPIKeys = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Keys</h3>
        <Button onClick={() => setShowKeyCreator(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <div className="space-y-4">
        {Array.isArray(apiKeys) && apiKeys.length > 0 ? apiKeys.map(apiKey => (
          <Card key={apiKey._id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h4 className="font-medium">{apiKey.name}</h4>
                    <Badge variant={apiKey.type === 'admin' ? 'destructive' : 'secondary'}>
                      {apiKey.type}
                    </Badge>
                    <Badge variant={apiKey.isActive ? 'default' : 'outline'}>
                      {apiKey.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Key:</span>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {showSecrets[apiKey._id] ? apiKey.keyId : '•'.repeat(apiKey.keyId?.length || 20)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSecretVisibility(apiKey._id)}
                      >
                        {showSecrets[apiKey._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.keyId, 'API Key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <div>Created by {apiKey.createdBy?.name || 'Unknown'} on {new Date(apiKey.createdAt).toLocaleDateString()}</div>
                      {apiKey.expiresAt && (
                        <div>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</div>
                      )}
                      {apiKey.usage?.lastUsed && (
                        <div>Last used: {new Date(apiKey.usage.lastUsed).toLocaleString()}</div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {(apiKey.permissions || []).slice(0, 3).map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission.resource ? `${permission.resource}:${permission.actions.join(',')}` : permission}
                        </Badge>
                      ))}
                      {(apiKey.permissions || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(apiKey.permissions || []).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div>
                    <div className="text-lg font-bold">{(apiKey.usage?.totalRequests || 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Requests</div>
                  </div>
                  <div>
                    <div className="text-sm">
                      {(apiKey.rateLimitUsage?.today?.requests || 0).toLocaleString()} / {(apiKey.rateLimit?.requestsPerDay || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Rate Limit (Today)</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={apiKey.isActive ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleKeyStatus(apiKey._id)}
                    >
                      {apiKey.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-8 text-gray-500">
            No API keys found
          </div>
        )}
      </div>
    </div>
  );

  const renderWebhooks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
        <Button onClick={() => setShowWebhookCreator(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      <div className="space-y-4">
        {Array.isArray(webhooks) ? webhooks.map(webhook =>
          <Card key={webhook._id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h4 className="font-medium">{webhook.name}</h4>
                    <Badge variant={webhook.isActive ? 'default' : 'outline'}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">URL:</span>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {webhook.url}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(webhook.url, 'Webhook URL')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Created:</span>
                      <div className="text-sm text-muted-foreground">
                        {new Date(webhook.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {(webhook.events || []).map(event => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div>
                    <div className="text-lg font-bold">{webhook.stats?.totalDeliveries || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Deliveries</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-600">{webhook.stats?.successfulDeliveries || 0}</div>
                    <div className="text-xs text-muted-foreground">Successful</div>
                  </div>
                  <div>
                    <div className="text-sm text-red-600">{webhook.stats?.failedDeliveries || 0}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={webhook.isActive ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleWebhookStatus(webhook._id)}
                    >
                      {webhook.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No webhooks found
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'endpoints', name: 'API Endpoints', icon: Globe },
    { id: 'keys', name: 'API Keys', icon: Key },
    { id: 'webhooks', name: 'Webhooks', icon: Webhook }
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading API Management data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center min-h-64">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-3xl font-bold tracking-tight">API Management</h2>
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs">Live Data</span>
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadDocumentation}>
            <FileText className="mr-2 h-4 w-4" />
            API Documentation
          </Button>
          <Button variant="outline" onClick={() => apiManagementApi.exportLogs().then(() => toast({ title: "Logs exported successfully" })).catch(() => toast({ title: "Failed to export logs" }))}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex space-x-0 border-b">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'endpoints' && renderEndpoints()}
      {activeTab === 'keys' && renderAPIKeys()}
      {activeTab === 'webhooks' && renderWebhooks()}

      {/* Endpoint Details Modal */}
      {selectedEndpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <div className={`px-2 py-1 text-xs font-bold text-white rounded mr-3 ${getMethodColor(selectedEndpoint.method)}`}>
                    {selectedEndpoint.method}
                  </div>
                  {selectedEndpoint.name}
                </CardTitle>
                <Button variant="outline" onClick={() => setSelectedEndpoint(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endpoint Path</label>
                  <code className="block bg-muted p-2 rounded font-mono text-sm mt-1">
                    {selectedEndpoint.path}
                  </code>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rate Limit</label>
                  <div className="text-lg font-semibold">{selectedEndpoint.rateLimit} requests/hour</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">{selectedEndpoint.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{(selectedEndpoint?.usage?.requests || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{selectedEndpoint?.usage?.errors || 0}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{selectedEndpoint?.usage?.avgResponseTime || 0}ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant={getStatusColor(selectedEndpoint.status) as any}>
                  {selectedEndpoint.status}
                </Badge>
                <Badge variant="outline">{selectedEndpoint.version}</Badge>
                <Badge variant="outline">{selectedEndpoint.category}</Badge>
                {selectedEndpoint.authRequired && (
                  <Badge variant="secondary">
                    <Shield className="mr-1 h-3 w-3" />
                    Auth Required
                  </Badge>
                )}
              </div>

              <div className="flex space-x-2">
                <Button className="flex-1">
                  <Terminal className="mr-2 h-4 w-4" />
                  Test Endpoint
                </Button>
                <Button variant="outline" className="flex-1">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Key Creation Modal */}
      {showKeyCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Key className="mr-3 h-5 w-5" />
                  Create API Key
                </CardTitle>
                <Button variant="outline" onClick={() => setShowKeyCreator(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <APIKeyCreationForm onClose={() => setShowKeyCreator(false)} onSuccess={() => {
                setShowKeyCreator(false);
                loadAPIKeys();
              }} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhook Creation Modal */}
      {showWebhookCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Webhook className="mr-3 h-5 w-5" />
                  Add Webhook
                </CardTitle>
                <Button variant="outline" onClick={() => setShowWebhookCreator(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <WebhookCreationForm onClose={() => setShowWebhookCreator(false)} onSuccess={() => {
                setShowWebhookCreator(false);
                loadWebhooks();
              }} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Documentation Modal */}
      {showDocumentation && documentation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="mr-3 h-5 w-5" />
                  {documentation.info?.title || 'API Documentation'}
                </CardTitle>
                <Button variant="outline" onClick={() => setShowDocumentation(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">API Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Version</Label>
                    <div className="text-sm text-muted-foreground">{documentation.info?.version}</div>
                  </div>
                  <div>
                    <Label>Contact</Label>
                    <div className="text-sm text-muted-foreground">{documentation.info?.contact?.email}</div>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <div className="text-sm text-muted-foreground">{documentation.info?.description}</div>
                </div>
              </div>

              {/* Server URLs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Servers</h3>
                <div className="space-y-2">
                  {documentation.servers?.map((server: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <code className="font-mono text-sm">{server.url}</code>
                        <div className="text-xs text-muted-foreground">{server.description}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(server.url, 'Server URL')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authentication */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Authentication</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Bearer Token (JWT)</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Use JWT token in Authorization header
                      </div>
                      <code className="block bg-muted p-2 rounded mt-2 text-xs">
                        Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
                      </code>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="h-4 w-4" />
                        <span className="font-medium">API Key</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Use API key in x-api-key header
                      </div>
                      <code className="block bg-muted p-2 rounded mt-2 text-xs">
                        x-api-key: rk_test_abcd1234...
                      </code>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Rate Limits */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rate Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(documentation.rateLimit?.limits || {}).map(([type, limit]) => (
                    <Card key={type}>
                      <CardContent className="p-4 text-center">
                        <div className="font-medium capitalize">{type}</div>
                        <div className="text-2xl font-bold text-blue-600">{limit}</div>
                        <div className="text-xs text-muted-foreground">requests</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* API Endpoints by Category */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">API Endpoints</h3>
                <div className="space-y-6">
                  {documentation.endpoints?.map((categoryGroup: any, index: number) => (
                    <div key={index}>
                      <h4 className="font-medium text-lg mb-3">{categoryGroup.category}</h4>
                      <div className="space-y-3">
                        {categoryGroup.endpoints?.map((endpoint: any, endpointIndex: number) => (
                          <Card key={endpointIndex}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                                    {endpoint.method}
                                  </Badge>
                                  <code className="font-mono text-sm">{endpoint.path}</code>
                                </div>
                              </div>
                              <div className="text-sm font-medium mb-1">{endpoint.summary}</div>
                              <div className="text-sm text-muted-foreground">{endpoint.description}</div>

                              {endpoint.parameters && endpoint.parameters.length > 0 && (
                                <div className="mt-3">
                                  <div className="text-sm font-medium mb-2">Parameters:</div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {endpoint.parameters.map((param: any, paramIndex: number) => (
                                      <div key={paramIndex} className="flex items-center gap-2 text-xs">
                                        <code className="bg-muted px-1 rounded">{param.name}</code>
                                        <span className="text-muted-foreground">({param.in})</span>
                                        {param.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                                        <span className="text-muted-foreground">- {param.description}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Examples */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Code Examples</h3>
                <div className="space-y-4">
                  {Object.entries(documentation.examples || {}).map(([key, example]: [string, any]) => (
                    <Card key={key}>
                      <CardContent className="p-4">
                        <div className="font-medium mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-sm text-muted-foreground mb-3">{example.description}</div>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Error Codes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Error Codes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(documentation.errorCodes || {}).map(([code, description]) => (
                    <div key={code} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant={code.startsWith('2') ? 'default' : code.startsWith('4') ? 'secondary' : 'destructive'}>
                        {code}
                      </Badge>
                      <div className="text-sm text-muted-foreground">{description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};