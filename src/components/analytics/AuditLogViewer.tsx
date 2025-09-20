import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Pagination } from '../ui/Pagination';
import OptimizedSearch from '../ui/OptimizedSearch';
import {
  Calendar,
  FileText,
  User,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resourceType: 'property' | 'group' | 'user' | 'booking' | 'system';
  resourceId: string;
  resourceName: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failed' | 'pending';
  metadata?: Record<string, any>;
}

interface AuditLogViewerProps {
  propertyGroupId?: string;
  onExport?: (filters: any) => void;
}

// Mock data for demonstration
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    userId: 'user-1',
    userName: 'John Admin',
    userEmail: 'john@hotel.com',
    action: 'UPDATE',
    resourceType: 'property',
    resourceId: 'prop-1',
    resourceName: 'Grand Hotel Mumbai',
    changes: [
      { field: 'status', oldValue: 'inactive', newValue: 'active' },
      { field: 'rooms.total', oldValue: 120, newValue: 125 }
    ],
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Chrome/91.0',
    severity: 'medium',
    status: 'success'
  },
  {
    id: 'audit-2',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    userId: 'user-2',
    userName: 'Sarah Manager',
    userEmail: 'sarah@hotel.com',
    action: 'CREATE',
    resourceType: 'group',
    resourceId: 'group-1',
    resourceName: 'Luxury Properties',
    changes: [
      { field: 'name', oldValue: null, newValue: 'Luxury Properties' },
      { field: 'type', oldValue: null, newValue: 'premium' }
    ],
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 Safari/14.0',
    severity: 'low',
    status: 'success'
  },
  {
    id: 'audit-3',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    userId: 'user-1',
    userName: 'John Admin',
    userEmail: 'john@hotel.com',
    action: 'DELETE',
    resourceType: 'user',
    resourceId: 'user-3',
    resourceName: 'Former Employee',
    changes: [
      { field: 'status', oldValue: 'active', newValue: 'deleted' }
    ],
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Chrome/91.0',
    severity: 'high',
    status: 'success'
  },
  {
    id: 'audit-4',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    userId: 'user-4',
    userName: 'Mike Staff',
    userEmail: 'mike@hotel.com',
    action: 'LOGIN_FAILED',
    resourceType: 'system',
    resourceId: 'auth-system',
    resourceName: 'Authentication System',
    changes: [],
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 Firefox/89.0',
    severity: 'medium',
    status: 'failed',
    metadata: { reason: 'Invalid password', attempts: 3 }
  }
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CREATE': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'UPDATE': return <Activity className="h-4 w-4 text-blue-500" />;
    case 'DELETE': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'LOGIN': return <User className="h-4 w-4 text-blue-500" />;
    case 'LOGIN_FAILED': return <Shield className="h-4 w-4 text-red-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  propertyGroupId,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter logs based on criteria
  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter(log => {
      const matchesSearch = !searchTerm ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesResource = resourceFilter === 'all' || log.resourceType === resourceFilter;
      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

      const matchesDateFrom = !dateFrom || log.timestamp >= new Date(dateFrom);
      const matchesDateTo = !dateTo || log.timestamp <= new Date(dateTo + 'T23:59:59');

      return matchesSearch && matchesAction && matchesResource &&
             matchesSeverity && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [searchTerm, actionFilter, resourceFilter, severityFilter, statusFilter, dateFrom, dateTo]);

  // Paginate results
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleExport = () => {
    const filters = {
      searchTerm,
      actionFilter,
      resourceFilter,
      severityFilter,
      statusFilter,
      dateFrom,
      dateTo,
      propertyGroupId
    };

    if (onExport) {
      onExport(filters);
    } else {
      // Default export logic
      const csvData = filteredLogs.map(log => ({
        timestamp: format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        user: log.userName,
        action: log.action,
        resource: `${log.resourceType}:${log.resourceName}`,
        severity: log.severity,
        status: log.status,
        ipAddress: log.ipAddress
      }));

      console.log('Exporting audit logs:', csvData);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Audit Log Viewer
          <Badge variant="secondary" className="ml-2">
            {filteredLogs.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="filters">Advanced Filters</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            {/* Quick Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <OptimizedSearch
                  placeholder="Search by user, action, or resource..."
                  onSearch={setSearchTerm}
                  initialValue={searchTerm}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex flex-wrap gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Audit Log Entries */}
            <div className="space-y-2">
              {paginatedLogs.map((log) => (
                <Card key={log.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedEntry(log)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getActionIcon(log.action)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{log.action}</span>
                            <Badge className={`${getSeverityColor(log.severity)} border text-xs`}>
                              {log.severity}
                            </Badge>
                            {getStatusIcon(log.status)}
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>{log.userName}</strong> performed <strong>{log.action}</strong> on {log.resourceType}
                            "<strong>{log.resourceName}</strong>"
                          </p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(log.timestamp, 'MMM dd, yyyy HH:mm')}
                            </span>
                            <span>IP: {log.ipAddress}</span>
                            {log.changes.length > 0 && (
                              <span>{log.changes.length} changes</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredLogs.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div>
                <Label>Resource Type</Label>
                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredLogs.filter(l => l.status === 'success').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful Actions</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredLogs.filter(l => l.status === 'failed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed Actions</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredLogs.filter(l => l.severity === 'high' || l.severity === 'critical').length}
                  </div>
                  <div className="text-sm text-muted-foreground">High/Critical Issues</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Detailed Entry Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Audit Log Details</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(null)}>
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Timestamp:</strong> {format(selectedEntry.timestamp, 'PPpp')}</div>
                  <div><strong>User:</strong> {selectedEntry.userName}</div>
                  <div><strong>Action:</strong> {selectedEntry.action}</div>
                  <div><strong>Resource:</strong> {selectedEntry.resourceType}:{selectedEntry.resourceName}</div>
                  <div><strong>IP Address:</strong> {selectedEntry.ipAddress}</div>
                  <div><strong>Status:</strong> {selectedEntry.status}</div>
                </div>

                {selectedEntry.changes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Changes Made:</h4>
                    <div className="space-y-2">
                      {selectedEntry.changes.map((change, index) => (
                        <div key={index} className="p-2 bg-muted rounded text-sm">
                          <div><strong>Field:</strong> {change.field}</div>
                          <div><strong>Old Value:</strong> {JSON.stringify(change.oldValue)}</div>
                          <div><strong>New Value:</strong> {JSON.stringify(change.newValue)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntry.metadata && (
                  <div>
                    <h4 className="font-medium mb-2">Additional Information:</h4>
                    <pre className="p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(selectedEntry.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};