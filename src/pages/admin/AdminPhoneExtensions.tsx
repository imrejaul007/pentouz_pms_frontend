import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Settings, 
  PhoneCall,
  Building,
  Users,
  AlertTriangle,
  Wrench,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PhoneExtensionForm from '@/components/admin/PhoneExtensionForm';
import PhoneAssignmentTool from '@/components/admin/PhoneAssignmentTool';
import PhoneDirectory from '@/components/admin/PhoneDirectory';

interface PhoneExtension {
  _id: string;
  extensionNumber: string;
  displayName: string;
  description?: string;
  phoneType: string;
  status: 'active' | 'inactive' | 'maintenance' | 'out_of_order' | 'temporary';
  isAvailable: boolean;
  roomInfo?: {
    roomNumber: string;
    floor: number;
    roomType: string;
    status: string;
  };
  location?: {
    floor?: number;
    wing?: string;
    area?: string;
  };
  features: string[];
  directorySettings: {
    showInDirectory: boolean;
    publicListing: boolean;
    category: string;
    sortOrder: number;
  };
  maintenanceMode?: {
    isEnabled: boolean;
    reason?: string;
    scheduledUntil?: string;
    technician?: string;
  };
  usageStats?: {
    totalCallsReceived: number;
    totalCallsMade: number;
    lastUsed?: string;
    averageDailyUsage: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ExtensionSummary {
  totalExtensions: number;
  activeExtensions: number;
  inactiveExtensions: number;
  maintenanceExtensions: number;
  assignedToRooms: number;
  phoneTypeStats: Record<string, number>;
}

const AdminPhoneExtensions: React.FC = () => {
  const { toast } = useToast();
  const [extensions, setExtensions] = useState<PhoneExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ExtensionSummary | null>(null);
  
  // Filters and search
  const [search, setSearch] = useState('');
  const [phoneTypeFilter, setPhoneTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // UI state
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  const [showAssignmentTool, setShowAssignmentTool] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [editingExtension, setEditingExtension] = useState<PhoneExtension | null>(null);
  const [activeTab, setActiveTab] = useState('extensions');

  // Options for dropdowns
  const [options, setOptions] = useState<{
    phoneTypes: string[];
    statuses: string[];
    categories: string[];
    features: string[];
  } | null>(null);

  useEffect(() => {
    fetchExtensions();
    fetchOptions();
  }, [currentPage, search, phoneTypeFilter, statusFilter, floorFilter, categoryFilter]);

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      const hotelId = localStorage.getItem('currentHotelId') || 'default-hotel-id';
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        includeStats: 'true'
      });
      
      if (search) params.append('search', search);
      if (phoneTypeFilter) params.append('phoneType', phoneTypeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (floorFilter) params.append('floor', floorFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`/api/v1/phone-extensions/hotels/${hotelId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExtensions(data.data.extensions || []);
        setSummary(data.data.summary || null);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalCount(data.data.pagination?.totalCount || 0);
      } else {
        throw new Error('Failed to fetch phone extensions');
      }
    } catch (error) {
      console.error('Error fetching extensions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch phone extensions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/v1/phone-extensions/options', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const handleCreateExtension = () => {
    setEditingExtension(null);
    setShowExtensionForm(true);
  };

  const handleEditExtension = (extension: PhoneExtension) => {
    setEditingExtension(extension);
    setShowExtensionForm(true);
  };

  const handleDeleteExtension = async (extensionId: string) => {
    if (!confirm('Are you sure you want to delete this phone extension?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/phone-extensions/${extensionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Phone extension deleted successfully'
        });
        fetchExtensions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete extension');
      }
    } catch (error) {
      console.error('Error deleting extension:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete extension',
        variant: 'destructive'
      });
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedExtensions.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select extensions to update',
        variant: 'destructive'
      });
      return;
    }

    try {
      const hotelId = localStorage.getItem('currentHotelId') || 'default-hotel-id';
      
      const response = await fetch(`/api/v1/phone-extensions/hotels/${hotelId}/bulk-update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extensionIds: selectedExtensions,
          status
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: data.message || 'Extensions updated successfully'
        });
        setSelectedExtensions([]);
        fetchExtensions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update extensions');
      }
    } catch (error) {
      console.error('Error updating extensions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update extensions',
        variant: 'destructive'
      });
    }
  };

  const handleSetMaintenance = async (extensionId: string, reason: string, scheduledUntil?: string, technician?: string) => {
    try {
      const response = await fetch(`/api/v1/phone-extensions/${extensionId}/maintenance`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason,
          scheduledUntil,
          technician
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Extension set to maintenance mode'
        });
        fetchExtensions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set maintenance mode');
      }
    } catch (error) {
      console.error('Error setting maintenance:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set maintenance mode',
        variant: 'destructive'
      });
    }
  };

  const handleClearMaintenance = async (extensionId: string) => {
    try {
      const response = await fetch(`/api/v1/phone-extensions/${extensionId}/maintenance/clear`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Maintenance mode cleared'
        });
        fetchExtensions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear maintenance mode');
      }
    } catch (error) {
      console.error('Error clearing maintenance:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clear maintenance mode',
        variant: 'destructive'
      });
    }
  };

  const exportDirectory = async (format: 'pdf' | 'csv' = 'csv') => {
    try {
      const hotelId = localStorage.getItem('currentHotelId') || 'default-hotel-id';
      
      const response = await fetch(`/api/v1/phone-extensions/hotels/${hotelId}/directory?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `phone-directory.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Success',
          description: `Directory exported as ${format.toUpperCase()}`
        });
      } else {
        throw new Error('Failed to export directory');
      }
    } catch (error) {
      console.error('Error exporting directory:', error);
      toast({
        title: 'Error',
        description: 'Failed to export directory',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (extension: PhoneExtension) => {
    const { status, isAvailable, maintenanceMode } = extension;
    
    if (maintenanceMode?.isEnabled) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Wrench className="w-3 h-3 mr-1" />
        Maintenance
      </Badge>;
    }
    
    if (!isAvailable || status !== 'active') {
      return <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {status === 'active' ? 'Unavailable' : status.replace('_', ' ')}
      </Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800">
      <PhoneCall className="w-3 h-3 mr-1" />
      Active
    </Badge>;
  };

  const columns = [
    {
      accessorKey: 'extensionNumber',
      header: 'Extension',
      cell: ({ row }: any) => (
        <div className="font-mono font-semibold">
          {row.original.extensionNumber}
        </div>
      )
    },
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.displayName}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'phoneType',
      header: 'Type',
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {row.original.phoneType.replace('_', ' ')}
        </Badge>
      )
    },
    {
      accessorKey: 'roomInfo',
      header: 'Room',
      cell: ({ row }: any) => {
        const { roomInfo, location } = row.original;
        return (
          <div>
            {roomInfo ? (
              <div>
                <div className="font-medium">{roomInfo.roomNumber}</div>
                <div className="text-sm text-muted-foreground">
                  Floor {roomInfo.floor}
                </div>
              </div>
            ) : location?.area ? (
              <div className="text-sm">
                {location.area}
                {location.floor && ` (Floor ${location.floor})`}
              </div>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => getStatusBadge(row.original)
    },
    {
      accessorKey: 'usageStats',
      header: 'Usage',
      cell: ({ row }: any) => {
        const stats = row.original.usageStats;
        if (!stats) return <span className="text-muted-foreground">-</span>;
        
        const totalCalls = stats.totalCallsReceived + stats.totalCallsMade;
        return (
          <div className="text-sm">
            <div>{totalCalls} calls</div>
            {stats.lastUsed && (
              <div className="text-muted-foreground">
                Last: {new Date(stats.lastUsed).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const extension = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditExtension(extension)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {extension.maintenanceMode?.isEnabled ? (
                <DropdownMenuItem onClick={() => handleClearMaintenance(extension._id)}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Clear Maintenance
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => {
                  const reason = prompt('Maintenance reason:');
                  if (reason) {
                    handleSetMaintenance(extension._id, reason);
                  }
                }}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Set Maintenance
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteExtension(extension._id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phone Extensions</h1>
          <p className="text-muted-foreground">
            Manage hotel phone extensions and directory
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAssignmentTool(true)}
          >
            <Building className="w-4 h-4 mr-2" />
            Bulk Assign
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDirectory(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Directory
          </Button>
          <Button onClick={handleCreateExtension}>
            <Plus className="w-4 h-4 mr-2" />
            Add Extension
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Extensions</p>
                  <p className="text-2xl font-bold">{summary.totalExtensions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-2xl font-bold">{summary.activeExtensions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Assigned to Rooms</p>
                  <p className="text-2xl font-bold">{summary.assignedToRooms}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Maintenance</p>
                  <p className="text-2xl font-bold">{summary.maintenanceExtensions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Inactive</p>
                  <p className="text-2xl font-bold">{summary.inactiveExtensions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="extensions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search extensions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <Select value={phoneTypeFilter} onValueChange={setPhoneTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Phone Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {options?.phoneTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    {options?.statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {options?.categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  {selectedExtensions.length > 0 && (
                    <>
                      <Select onValueChange={handleBulkStatusUpdate}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Bulk Action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Set Active</SelectItem>
                          <SelectItem value="inactive">Set Inactive</SelectItem>
                          <SelectItem value="maintenance">Set Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => exportDirectory('csv')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extensions Table */}
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={extensions}
                loading={loading}
                pagination={{
                  currentPage,
                  totalPages,
                  totalCount,
                  onPageChange: setCurrentPage
                }}
                selection={{
                  selectedRows: selectedExtensions,
                  onSelectionChange: setSelectedExtensions
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Phone extension usage statistics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms and Modals */}
      {showExtensionForm && (
        <PhoneExtensionForm
          extension={editingExtension}
          onClose={() => {
            setShowExtensionForm(false);
            setEditingExtension(null);
          }}
          onSuccess={() => {
            setShowExtensionForm(false);
            setEditingExtension(null);
            fetchExtensions();
          }}
        />
      )}

      {showAssignmentTool && (
        <PhoneAssignmentTool
          onClose={() => setShowAssignmentTool(false)}
          onSuccess={fetchExtensions}
        />
      )}

      {showDirectory && (
        <PhoneDirectory
          onClose={() => setShowDirectory(false)}
        />
      )}
    </div>
  );
};

export default AdminPhoneExtensions;