import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  Eye,
  MapPin,
  Smartphone,
  DollarSign,
  Users,
  Activity,
  RefreshCw,
  Filter,
  Download,
  Search
} from 'lucide-react';
import { bypassSecurityService } from '../../services/bypassSecurityService';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SecurityMetrics {
  totalBypasses: number;
  averageRiskScore: number;
  totalFinancialImpact: number;
  highRiskCount: number;
  criticalFlags: number;
  suspiciousPatterns: number;
  pendingApprovals: number;
  activeAlerts: number;
}

interface SecurityEvent {
  _id: string;
  bypassId: string;
  adminId: {
    _id: string;
    name: string;
    email: string;
  };
  riskScore: number;
  riskLevel: string;
  reason: {
    category: string;
    description: string;
    urgencyLevel: string;
  };
  financialImpact: {
    estimatedLoss: number;
    currency: string;
  };
  securityFlags: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  operationStatus: {
    status: string;
  };
  createdAt: string;
  analytics: {
    shift: string;
    businessHours: boolean;
  };
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  adminId?: string;
  count?: number;
}

const BypassSecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSecurityData();
  }, [timeRange]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, eventsData, alertsData] = await Promise.all([
        bypassSecurityService.getSecurityMetrics(timeRange),
        bypassSecurityService.getSecurityEvents({ timeRange, limit: 50 }),
        bypassSecurityService.getActiveAlerts()
      ]);

      setMetrics(metricsData.data);
      setSecurityEvents(eventsData.data);
      setSecurityAlerts(alertsData.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityData();
    setRefreshing(false);
  };

  const handleExportReport = async () => {
    try {
      const report = await bypassSecurityService.exportSecurityReport(timeRange);
      const blob = new Blob([report.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bypass_security_report_${timeRange}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getRiskLevelFromScore = (score: number) => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const getRiskLevelColor = (riskLevel: string, riskScore: number) => {
    if (riskLevel === 'Critical' || riskScore >= 80) return 'bg-red-100 text-red-800 border-red-200';
    if (riskLevel === 'High' || riskScore >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (riskLevel === 'Medium' || riskScore >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (riskLevel === 'Low' || riskScore >= 20) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-blue-600" />;
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesRiskLevel = filterRiskLevel === 'all' || getRiskLevelFromScore(event.securityMetadata?.riskScore || 0).toLowerCase() === filterRiskLevel;
    const matchesSearch = searchTerm === '' ||
      event.adminId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.reason?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.bypassId?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRiskLevel && matchesSearch;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Bypass Security Monitoring
          </h1>
          <p className="text-gray-600 mt-1">Real-time security monitoring and threat detection</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <Button onClick={handleRefresh} disabled={refreshing} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={handleExportReport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Active Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-red-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Active Security Alerts ({securityAlerts.length})
          </h2>
          <div className="grid gap-3">
            {securityAlerts.map((alert) => (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-center">
                  {getAlertIcon(alert.severity)}
                  <div className="ml-3 flex-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                      {alert.count && ` • ${alert.count} occurrences`}
                    </p>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Security Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Bypasses</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalBypasses}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(metrics.averageRiskScore)}
                  </p>
                </div>
                <TrendingUp className={`h-8 w-8 ${
                  metrics.averageRiskScore > 60 ? 'text-red-600' :
                  metrics.averageRiskScore > 40 ? 'text-yellow-600' :
                  'text-green-600'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Financial Impact</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${metrics.totalFinancialImpact.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">High Risk Events</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.highRiskCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Recent Security Events
            </CardTitle>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <select
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="mx-auto h-12 w-12 mb-3 text-gray-400" />
              <p>No security events found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge
                          className={`${getRiskLevelColor(getRiskLevelFromScore(event.securityMetadata?.riskScore || 0), event.securityMetadata?.riskScore || 0)}`}
                        >
                          {getRiskLevelFromScore(event.securityMetadata?.riskScore || 0)} Risk ({event.securityMetadata?.riskScore || 0})
                        </Badge>

                        <Badge variant="outline">
                          {event.reason?.category?.replace('_', ' ') || 'Unknown'}
                        </Badge>

                        <Badge
                          variant={
                            event.operationStatus?.status === 'completed' ? 'default' :
                            event.operationStatus?.status === 'failed' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {event.operationStatus?.status || 'Unknown'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {event.adminId?.name || 'Unknown Admin'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Bypass ID: {event.bypassId || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.reason?.description?.substring(0, 100) || 'No description'}
                            {(event.reason?.description?.length || 0) > 100 ? '...' : ''}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {new Date(event.createdAt || Date.now()).toLocaleString()}
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="h-4 w-4 mr-2" />
                            ₹{event.financialImpact?.estimatedLoss?.toLocaleString() || '0'} impact
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            {event.analytics?.shift || 'unknown'} shift
                            {!event.analytics?.businessHours && ' (after hours)'}
                          </div>
                        </div>
                      </div>

                      {event.securityMetadata?.securityFlags?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-sm font-medium text-gray-700">Security Flags:</p>
                          <div className="flex flex-wrap gap-2">
                            {event.securityMetadata.securityFlags.map((flag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className={
                                  flag.severity === 'critical' ? 'border-red-300 text-red-700' :
                                  flag.severity === 'warning' ? 'border-yellow-300 text-yellow-700' :
                                  'border-blue-300 text-blue-700'
                                }
                              >
                                {flag.flag?.replace('_', ' ')}: {flag.details || 'No details'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BypassSecurityDashboard;