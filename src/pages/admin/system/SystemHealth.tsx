import React, { useState } from 'react';
import { cn } from '../../../utils/cn';
import {
  MetricCard,
  ChartCard,
  FilterBar,
  ExportButton,
  LineChart,
  DonutChart,
  ProgressBar,
  CircularProgress,
} from '../../../components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemHealth } from '../../../hooks/useDashboard';
import { formatRelativeTime, formatDuration } from '../../../utils/dashboardUtils';

export default function SystemHealth() {
  const [filters, setFilters] = useState({
    hotelId: '',
    component: '',
    timeRange: '24h',
  });

  const healthQuery = useSystemHealth(
    filters.hotelId,
    filters.component,
    { refetchInterval: 30000 }
  );

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const data = healthQuery.data?.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600 mt-1">Infrastructure monitoring and performance analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => healthQuery.refetch()}
            loading={healthQuery.isLoading}
            variant="secondary"
          >
            Refresh
          </Button>
          <ExportButton
            endpoint="system-health"
            params={{
              hotelId: filters.hotelId,
              component: filters.component,
              timeRange: filters.timeRange,
            }}
            filename="system-health-report"
          />
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={[
          {
            key: 'hotelId',
            label: 'Hotel',
            type: 'select',
            options: [
              { value: '', label: 'All Hotels' },
              { value: 'hotel1', label: 'Grand Hotel' },
              { value: 'hotel2', label: 'Business Center' },
            ],
          },
          {
            key: 'component',
            label: 'Component',
            type: 'select',
            options: [
              { value: '', label: 'All Components' },
              { value: 'database', label: 'Database' },
              { value: 'api', label: 'API Server' },
              { value: 'storage', label: 'File Storage' },
              { value: 'cache', label: 'Cache Server' },
              { value: 'queue', label: 'Message Queue' },
            ],
          },
          {
            key: 'timeRange',
            label: 'Time Range',
            type: 'select',
            options: [
              { value: '1h', label: 'Last Hour' },
              { value: '24h', label: 'Last 24 Hours' },
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
            ],
          },
        ]}
        values={filters}
        onChange={handleFilterChange}
      />

      {/* Overall System Status */}
      <Card className={cn(
        'border-l-4',
        data?.overall.status === 'healthy' ? 'border-green-500 bg-green-50' :
        data?.overall.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
        'border-red-500 bg-red-50'
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'p-2 rounded-full',
                getStatusColor(data?.overall.status || 'unknown')
              )}>
                {getStatusIcon(data?.overall.status || 'unknown')}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  System Status: {data?.overall.status?.toUpperCase() || 'UNKNOWN'}
                </h2>
                <p className="text-gray-600">
                  Overall Health Score: {data?.overall.score || 0}/100
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {data?.overall.score || 0}%
              </div>
              <p className="text-sm text-gray-500">
                Last updated: {data?.overall.lastUpdated ? 
                  formatRelativeTime(data.overall.lastUpdated) : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="System Uptime"
          value={data?.metrics.systemUptime || 0}
          suffix="days"
          trend={{
            value: 99.9,
            direction: 'up',
            label: 'uptime %'
          }}
          color="green"
          loading={healthQuery.isLoading}
        />
        
        <MetricCard
          title="Avg Response Time"
          value={data?.metrics.averageResponseTime || 0}
          suffix="ms"
          trend={{
            value: -15,
            direction: 'down',
            label: 'improvement'
          }}
          color="blue"
          loading={healthQuery.isLoading}
        />
        
        <MetricCard
          title="Active Users"
          value={data?.metrics.totalUsers || 0}
          trend={{
            value: 12,
            direction: 'up',
            label: 'online now'
          }}
          color="purple"
          loading={healthQuery.isLoading}
        />
        
        <MetricCard
          title="Total Requests"
          value={45678}
          trend={{
            value: 8.3,
            direction: 'up',
            label: 'vs yesterday'
          }}
          color="yellow"
          loading={healthQuery.isLoading}
        />
      </div>

      {/* System Components Status */}
      <Card>
        <CardHeader>
          <CardTitle>Component Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          {healthQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.components?.map((component) => (
                <div
                  key={component.name}
                  className={cn(
                    'p-4 rounded-lg border-2',
                    component.status === 'healthy' ? 'border-green-200 bg-green-50' :
                    component.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        'p-1 rounded-full',
                        getStatusColor(component.status)
                      )}>
                        {getStatusIcon(component.status)}
                      </div>
                      <h3 className="font-medium text-gray-900 capitalize">
                        {component.name.replace('_', ' ')}
                      </h3>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={getStatusColor(component.status)}
                    >
                      {component.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Uptime</span>
                      <span className="font-medium">{component.uptime?.toFixed(1) || 0}%</span>
                    </div>
                    
                    {component.responseTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Response Time</span>
                        <span className="font-medium">{component.responseTime}ms</span>
                      </div>
                    )}
                    
                    {component.errorRate !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Error Rate</span>
                        <span className="font-medium">{component.errorRate}%</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Last Check</span>
                      <span>{formatRelativeTime(component.lastCheck)}</span>
                    </div>
                  </div>

                  {/* Component Health Score */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Health Score</span>
                      <span className="text-sm font-medium">
                        {Math.round(component.uptime || 0)}/100
                      </span>
                    </div>
                    <ProgressBar
                      value={component.uptime || 0}
                      size="sm"
                      color={
                        component.status === 'healthy' ? 'green' :
                        component.status === 'warning' ? 'yellow' :
                        'red'
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Trends */}
        <ChartCard
          title="Response Time Trends"
          subtitle="Average API response times over time"
          loading={healthQuery.isLoading}
          height="400px"
        >
          <LineChart
            data={[
              { time: '00:00', api: 120, database: 45, storage: 30 },
              { time: '04:00', api: 110, database: 42, storage: 28 },
              { time: '08:00', api: 150, database: 55, storage: 40 },
              { time: '12:00', api: 180, database: 70, storage: 50 },
              { time: '16:00', api: 160, database: 60, storage: 45 },
              { time: '20:00', api: 130, database: 50, storage: 35 },
            ]}
            xDataKey="time"
            lines={[
              { dataKey: 'api', name: 'API Server', color: '#3b82f6' },
              { dataKey: 'database', name: 'Database', color: '#10b981' },
              { dataKey: 'storage', name: 'Storage', color: '#f59e0b' },
            ]}
            height={350}
          />
        </ChartCard>

        {/* System Resource Usage */}
        <ChartCard
          title="Resource Usage Distribution"
          subtitle="Current system resource allocation"
          loading={healthQuery.isLoading}
          height="400px"
        >
          <DonutChart
            data={[
              { name: 'CPU Usage', value: 65, color: '#3b82f6' },
              { name: 'Memory Usage', value: 78, color: '#10b981' },
              { name: 'Disk Usage', value: 45, color: '#f59e0b' },
              { name: 'Network Usage', value: 32, color: '#ef4444' },
            ]}
            height={350}
            centerContent={
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data?.overall.score || 0}%
                </div>
                <div className="text-sm text-gray-500">Health Score</div>
              </div>
            }
          />
        </ChartCard>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {data?.metrics.totalBookings?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {data?.metrics.totalRooms?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Total Rooms</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {data?.metrics.totalReviews?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {data?.metrics.totalCommunications?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Communications</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Logs & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Recent Errors</span>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                3 errors
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {[
                {
                  timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                  component: 'API Server',
                  error: 'Database connection timeout',
                  severity: 'warning'
                },
                {
                  timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                  component: 'Storage',
                  error: 'Disk space warning at 85%',
                  severity: 'warning'
                },
                {
                  timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
                  component: 'Cache',
                  error: 'Redis connection failed',
                  severity: 'critical'
                },
              ].map((error, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                    error.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{error.component}</p>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(error.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{error.error}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {[
                { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), event: 'Database backup completed successfully' },
                { timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), event: 'System maintenance scheduled for tonight' },
                { timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), event: 'Cache server restarted' },
                { timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), event: 'Security scan completed - no issues found' },
                { timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), event: 'API rate limiting updated' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-900">{activity.event}</p>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}