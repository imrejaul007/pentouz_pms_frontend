import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AddPropertyModal } from './AddPropertyModal';
import { EditPropertyModal } from './EditPropertyModal';
import { AddGroupModal } from './AddGroupModal';
import { EditGroupModal } from './EditGroupModal';
import { ExportModal } from './ExportModal';
import { PerformanceBenchmarking } from '../analytics/PerformanceBenchmarking';
import { RevenueOptimizationInsights } from '../analytics/RevenueOptimizationInsights';
import { CustomReportBuilder } from '../analytics/CustomReportBuilder';
import { AutomatedReportScheduling } from '../analytics/AutomatedReportScheduling';
import { VirtualizedPropertyList } from './VirtualizedPropertyList';
import { Pagination } from '../ui/Pagination';
import {
  useProperties,
  usePropertyGroups,
  useCreatePropertyGroup,
  useUpdatePropertyGroup,
  useDeletePropertyGroup,
  useSyncGroupSettings,
  useAddPropertiesToGroup,
  useRemovePropertiesFromGroup
} from '../../hooks/usePropertyQueries';
import { 
  Building2,
  MapPin,
  Users,
  IndianRupee,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Globe,
  Wifi,
  Star,
  Phone,
  Mail,
  Clock,
  Bed,
  Car,
  Coffee,
  Utensils,
  Dumbbell,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { propertyGroupsApi, api } from '../../services/api';

interface Property {
  id: string;
  name: string;
  brand: string;
  type: 'hotel' | 'resort' | 'aparthotel' | 'hostel' | 'boutique';
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  contact: {
    phone: string;
    email: string;
    manager: string;
  };
  rooms: {
    total: number;
    occupied: number;
    available: number;
    outOfOrder: number;
  };
  performance: {
    occupancyRate: number;
    adr: number;
    revpar: number;
    revenue: number;
    lastMonth: {
      occupancyRate: number;
      adr: number;
      revpar: number;
      revenue: number;
    };
  };
  amenities: string[];
  rating: number;
  status: 'active' | 'inactive' | 'maintenance';
  features: {
    pms: boolean;
    pos: boolean;
    spa: boolean;
    restaurant: boolean;
    parking: boolean;
    wifi: boolean;
    fitness: boolean;
    pool: boolean;
  };
  operationalHours: {
    checkIn: string;
    checkOut: string;
    frontDesk: string;
  };
  originalHotel?: any; // Store original hotel data for editing
}

interface PropertyGroup {
  id: string;
  name: string;
  description: string;
  properties: string[];
  manager: string;
  budget: number;
  performance: {
    totalRevenue: number;
    avgOccupancy: number;
    avgADR: number;
    totalRooms: number;
  };
}

export const MultiPropertyManager: React.FC = () => {
  const { toast } = useToast();

  // UI state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PropertyGroup | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'properties' | 'groups' | 'analytics'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(false);
  const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<Property | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<PropertyGroup | null>(null);
  const [showPropertyAssignment, setShowPropertyAssignment] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0
  });

  // React Query hooks
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const {
    data: propertyGroupsData,
    isLoading: groupsLoading,
    error: groupsError
  } = usePropertyGroups({
    page: pagination.currentPage,
    limit: pagination.itemsPerPage,
    status: statusFilter,
    search: searchTerm
  });

  // Extract data from React Query response
  const propertyGroups = propertyGroupsData?.data || [];
  const groupsPagination = propertyGroupsData?.pagination;

  // Mutations
  const createGroupMutation = useCreatePropertyGroup();
  const updateGroupMutation = useUpdatePropertyGroup();
  const deleteGroupMutation = useDeletePropertyGroup();
  const syncGroupMutation = useSyncGroupSettings();
  const addPropertiesMutation = useAddPropertiesToGroup();
  const removePropertiesMutation = useRemovePropertiesFromGroup();
  const [selectedPropertiesForAssignment, setSelectedPropertiesForAssignment] = useState<string[]>([]);
  const [targetGroup, setTargetGroup] = useState<PropertyGroup | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Update pagination when React Query data changes
  React.useEffect(() => {
    if (groupsPagination) {
      setPagination({
        currentPage: groupsPagination.page || 1,
        itemsPerPage: groupsPagination.limit || 20,
        totalItems: groupsPagination.total || 0,
        totalPages: groupsPagination.pages || 0
      });
    }
  }, [groupsPagination]);

  // Fetch property groups from API
  useEffect(() => {
    fetchPropertyGroups();
    fetchProperties();
  }, []);

  const fetchPropertyGroups = async (page = 1, limit = 20) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await propertyGroupsApi.getGroups({
        page,
        limit,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      setPropertyGroups(response.data.data || []);
      setPagination({
        currentPage: response.data.pagination?.page || 1,
        itemsPerPage: response.data.pagination?.limit || 20,
        totalItems: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.pages || 0
      });
    } catch (err: any) {
      console.error('Error fetching property groups:', err);
      setError(err.response?.data?.message || 'Failed to fetch property groups');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch property groups. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    fetchPropertyGroups(page, pagination.itemsPerPage);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    fetchPropertyGroups(1, itemsPerPage);
  };

  const fetchProperties = async () => {
    try {
      setPropertiesLoading(true);
      // Fetch hotels/properties from API
      const response = await api.get('/admin/hotels');
      console.log('Hotels API response:', response.data);

      // Handle different response structures
      let hotelsData = [];
      if (response.data.data && response.data.data.hotels && Array.isArray(response.data.data.hotels)) {
        hotelsData = response.data.data.hotels;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        hotelsData = response.data.data;
      } else if (response.data.hotels && Array.isArray(response.data.hotels)) {
        hotelsData = response.data.hotels;
      } else if (Array.isArray(response.data)) {
        hotelsData = response.data;
      }

      console.log('Processed hotelsData:', hotelsData);

      // Fetch analytics data for each hotel
      const hotelsWithAnalytics = await Promise.all(
        hotelsData.map(async (hotel: any) => {
          try {
            // Get current analytics data for the hotel (last 30 days)
            const analyticsResponse = await api.get('/admin-dashboard/kpis', {
              params: {
                period: 'month'
              }
            });
            
            const analytics = analyticsResponse.data.data;
            console.log('Analytics response for hotel:', hotel.name, analytics);

            return {
              ...hotel,
              analytics: {
                revenue: analytics.totalRevenue || 0,
                occupancyRate: analytics.occupancy?.rate || 0,
                adr: analytics.revenue?.averageDailyRate || 0,
                revpar: analytics.revenue?.revenuePerAvailableRoom || 0,
                bookings: analytics.totalBookings || 0,
                totalRooms: analytics.totalRooms || 0,
                activeGuests: analytics.activeGuests || 0,
                lastMonth: {
                  revenue: 0, // Previous month comparison would need separate endpoint
                  occupancyRate: 0,
                  adr: 0,
                  revpar: 0,
                  bookings: 0
                }
              }
            };
          } catch (analyticsError) {
            console.warn(`Failed to fetch analytics for hotel ${hotel._id}:`, analyticsError);
            // Return hotel with default analytics if analytics fetch fails
            return {
              ...hotel,
              analytics: {
                revenue: 0,
                occupancyRate: 0,
                adr: 0,
                revpar: 0,
                bookings: 0,
                totalRooms: 0,
                activeGuests: 0,
                lastMonth: {
                  revenue: 0,
                  occupancyRate: 0,
                  adr: 0,
                  revpar: 0,
                  bookings: 0
                }
              }
            };
          }
        })
      );
      
      // Transform hotel data to Property interface format
      const transformedProperties: Property[] = hotelsWithAnalytics.map((hotel: any) => ({
        id: hotel._id,
        name: hotel.name,
        brand: hotel.brand || 'Independent',
        type: hotel.type || 'hotel',
        location: {
          address: hotel.address?.street || '',
          city: hotel.address?.city || '',
          country: hotel.address?.country || '',
          coordinates: {
            lat: hotel.address?.coordinates?.latitude || 0,
            lng: hotel.address?.coordinates?.longitude || 0
          }
        },
        contact: {
          phone: hotel.contact?.phone || '',
          email: hotel.contact?.email || '',
          manager: hotel.manager || 'N/A'
        },
        rooms: {
          total: hotel.analytics?.totalRooms || 100, // fallback to default hotel room count
          occupied: hotel.analytics?.activeGuests || 0,
          available: (hotel.analytics?.totalRooms || 100) - (hotel.analytics?.activeGuests || 0),
          outOfOrder: 0
        },
        performance: {
          occupancyRate: hotel.analytics.occupancyRate,
          adr: hotel.analytics.adr,
          revpar: hotel.analytics.revpar,
          revenue: hotel.analytics.revenue,
          lastMonth: {
            occupancyRate: hotel.analytics.lastMonth.occupancyRate,
            adr: hotel.analytics.lastMonth.adr,
            revpar: hotel.analytics.lastMonth.revpar,
            revenue: hotel.analytics.lastMonth.revenue
          }
        },
        amenities: hotel.amenities || [],
        rating: hotel.rating || 0,
        status: hotel.isActive ? 'active' : 'inactive',
        features: {
          pms: hotel.features?.pms || false,
          pos: hotel.features?.pos || false,
          spa: hotel.features?.spa || false,
          restaurant: hotel.features?.restaurant || false,
          parking: hotel.features?.parking || false,
          wifi: hotel.features?.wifi || false,
          fitness: hotel.features?.fitness || false,
          pool: hotel.features?.pool || false
        },
        operationalHours: {
          checkIn: hotel.policies?.checkInTime || '15:00',
          checkOut: hotel.policies?.checkOutTime || '11:00',
          frontDesk: '24/7'
        },
        originalHotel: hotel // Store original hotel data for editing
      }));
      
      setProperties(transformedProperties);
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch properties. Please try again."
      });
    } finally {
      setPropertiesLoading(false);
    }
  };

  // Property Group Management Functions
  const handleCreateGroup = async (groupData: any) => {
    try {
      await propertyGroupsApi.createGroup(groupData);
      toast({
        title: "Success",
        description: "Property group created successfully"
      });
      fetchPropertyGroups();
      setShowAddGroup(false);
    } catch (err: any) {
      console.error('Error creating group:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to create property group"
      });
    }
  };

  const handleUpdateGroup = async (groupId: string, groupData: any) => {
    try {
      await propertyGroupsApi.updateGroup(groupId, groupData);
      toast({
        title: "Success",
        description: "Property group updated successfully"
      });
      fetchPropertyGroups();
    } catch (err: any) {
      console.error('Error updating group:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to update property group"
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this property group?')) {
      try {
        await propertyGroupsApi.deleteGroup(groupId);
        toast({
          title: "Success",
          description: "Property group deleted successfully"
        });
        fetchPropertyGroups();
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null);
        }
      } catch (err: any) {
        console.error('Error deleting group:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: err.response?.data?.message || "Failed to delete property group"
        });
      }
    }
  };

  const handleSyncGroupSettings = async (groupId: string) => {
    try {
      await propertyGroupsApi.syncGroupSettings(groupId);
      toast({
        title: "Success",
        description: "Group settings synced successfully"
      });
      fetchPropertyGroups();
    } catch (err: any) {
      console.error('Error syncing group settings:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to sync group settings"
      });
    }
  };

  // Property Assignment Functions
  const handleAddPropertiesToGroup = async (groupId: string, propertyIds: string[]) => {
    try {
      await propertyGroupsApi.addPropertiesToGroup(groupId, { propertyIds });
      toast({
        title: "Success",
        description: `Added ${propertyIds.length} property(ies) to group successfully`
      });
      fetchPropertyGroups();
      fetchProperties();
    } catch (err: any) {
      console.error('Error adding properties to group:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to add properties to group"
      });
    }
  };

  const handleRemovePropertiesFromGroup = async (groupId: string, propertyIds: string[]) => {
    if (window.confirm(`Are you sure you want to remove ${propertyIds.length} property(ies) from this group?`)) {
      try {
        await propertyGroupsApi.removePropertiesFromGroup(groupId, { propertyIds });
        toast({
          title: "Success",
          description: `Removed ${propertyIds.length} property(ies) from group successfully`
        });
        fetchPropertyGroups();
        fetchProperties();
      } catch (err: any) {
        console.error('Error removing properties from group:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: err.response?.data?.message || "Failed to remove properties from group"
        });
      }
    }
  };

  const openPropertyAssignmentModal = (group: PropertyGroup) => {
    setTargetGroup(group);
    setSelectedPropertiesForAssignment([]);
    setShowPropertyAssignment(true);
  };

  const handlePropertySelection = (propertyId: string, isSelected: boolean) => {
    setSelectedPropertiesForAssignment(prev => 
      isSelected 
        ? [...prev, propertyId]
        : prev.filter(id => id !== propertyId)
    );
  };

  const handleBulkAssignment = async () => {
    if (targetGroup && selectedPropertiesForAssignment.length > 0) {
      await handleAddPropertiesToGroup(targetGroup._id, selectedPropertiesForAssignment);
      setShowPropertyAssignment(false);
      setTargetGroup(null);
      setSelectedPropertiesForAssignment([]);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesType = typeFilter === 'all' || property.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalStats = {
    properties: properties.length,
    totalRooms: properties.reduce((sum, p) => sum + (p.rooms?.total || 0), 0),
    totalRevenue: properties.reduce((sum, p) => sum + (p.performance?.revenue || 0), 0),
    avgOccupancy: properties.length > 0 ? properties.reduce((sum, p) => sum + (p.performance?.occupancyRate || 0), 0) / properties.length : 0,
    avgADR: properties.length > 0 ? properties.reduce((sum, p) => sum + (p.performance?.adr || 0), 0) / properties.length : 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPerformanceChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    };
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
                <p className="text-2xl font-bold">{totalStats.properties}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{totalStats.totalRooms}</p>
              </div>
              <Bed className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{(totalStats.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Occupancy</p>
                <p className="text-2xl font-bold">{totalStats.avgOccupancy.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Groups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Property Groups</CardTitle>
            <Button onClick={() => setShowAddGroup(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {propertyGroups.map(group => (
              <div key={group.id} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                   onClick={() => setSelectedGroup(group)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{group.name}</h3>
                      <Badge variant="secondary">{group.properties.length} properties</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span>Manager: {group.manager || 'Not assigned'}</span>
                      <span>Budget: ₹{(group.budget || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₹{(group.metrics?.totalRevenue || 0).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {properties
              .sort((a, b) => (b.performance?.revpar || 0) - (a.performance?.revpar || 0))
              .slice(0, 3)
              .map(property => {
                const revparChange = getPerformanceChange(
                  property.performance?.revpar || 0,
                  property.performance?.lastMonth?.revpar || 0
                );
                return (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {property.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{property.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {property.location?.city || 'Unknown'}, {property.location?.country || 'Unknown'}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{property.type}</Badge>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-xs">{property.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">₹{(property.performance?.revpar || 0).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">RevPAR</div>
                      <div className={`flex items-center text-sm ${
                        revparChange.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {revparChange.isPositive ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {revparChange.value}%
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="resort">Resort</SelectItem>
                <SelectItem value="aparthotel">Apart Hotel</SelectItem>
                <SelectItem value="boutique">Boutique</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddProperty(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Property Cards */}
      {/* Virtualized Property List */}
      <VirtualizedPropertyList
        properties={filteredProperties}
        onPropertySelect={setSelectedProperty}
        onPropertyEdit={(property) => {
          setSelectedPropertyForEdit(property.originalHotel || property);
          setShowEditProperty(true);
        }}
        onPropertyDelete={(propertyId) => {
          console.log('Delete property:', propertyId);
          toast({ title: 'Property Deleted', description: 'Property has been removed from the system.' });
        }}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        containerHeight={700}
      />
      <div style={{ display: 'none' }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProperties.map(property => {
          const occupancyChange = getPerformanceChange(
            property.performance.occupancyRate,
            property.performance.lastMonth.occupancyRate
          );
          const adrChange = getPerformanceChange(
            property.performance.adr,
            property.performance.lastMonth.adr
          );

          return (
            <Card key={property.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedProperty(property)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      {property.name}
                      <Badge variant={getStatusColor(property.status) as any} className="ml-2">
                        {property.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {property.brand} • {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{property.rating}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Location */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    {property.location.city}, {property.location.country}
                  </div>

                  {/* Room Stats */}
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{property.rooms.available}</div>
                      <div className="text-xs text-muted-foreground">Available</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{property.rooms.occupied}</div>
                      <div className="text-xs text-muted-foreground">Occupied</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{property.rooms.outOfOrder}</div>
                      <div className="text-xs text-muted-foreground">OOO</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{property.rooms.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{property.performance.occupancyRate}%</div>
                      <div className="text-xs text-muted-foreground">Occupancy</div>
                      <div className={`text-xs flex items-center justify-center ${
                        occupancyChange.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {occupancyChange.isPositive ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {occupancyChange.value}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">₹{property.performance.adr}</div>
                      <div className="text-xs text-muted-foreground">ADR</div>
                      <div className={`text-xs flex items-center justify-center ${
                        adrChange.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {adrChange.isPositive ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {adrChange.value}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">₹{property.performance.revpar.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">RevPAR</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {property.features.restaurant && <Badge variant="outline" className="text-xs">Restaurant</Badge>}
                    {property.features.spa && <Badge variant="outline" className="text-xs">Spa</Badge>}
                    {property.features.fitness && <Badge variant="outline" className="text-xs">Fitness</Badge>}
                    {property.features.pool && <Badge variant="outline" className="text-xs">Pool</Badge>}
                    {property.features.parking && <Badge variant="outline" className="text-xs">Parking</Badge>}
                    {property.features.wifi && <Badge variant="outline" className="text-xs">WiFi</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalStats.avgOccupancy.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Average Occupancy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">₹{totalStats.avgADR.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Average ADR</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">₹{(totalStats.totalRevenue || 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{properties.length}</div>
              <div className="text-sm text-muted-foreground">Total Properties</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Benchmarking Dashboard */}
      <PerformanceBenchmarking
        properties={properties}
        selectedProperty={selectedProperty}
      />

      {/* Revenue Optimization Insights */}
      <RevenueOptimizationInsights
        properties={properties}
        selectedProperty={selectedProperty}
      />

      {/* Custom Report Builder */}
      <CustomReportBuilder
        properties={properties}
        selectedProperty={selectedProperty}
        onSaveReport={(config) => {
          console.log('Saving report configuration:', config);
          toast({ title: 'Report Template Saved', description: 'Your custom report template has been saved successfully.' });
        }}
        onGenerateReport={(config) => {
          console.log('Generating report with configuration:', config);
          toast({ title: 'Report Generation Started', description: 'Your custom report is being generated and will be sent to recipients.' });
        }}
      />

      {/* Automated Report Scheduling */}
      <AutomatedReportScheduling
        onCreateSchedule={(schedule) => {
          console.log('Creating schedule:', schedule);
          toast({ title: 'Schedule Created', description: 'Your automated report schedule has been created successfully.' });
        }}
        onUpdateSchedule={(id, updates) => {
          console.log('Updating schedule:', id, updates);
          toast({ title: 'Schedule Updated', description: 'Your report schedule has been updated successfully.' });
        }}
        onDeleteSchedule={(id) => {
          console.log('Deleting schedule:', id);
          toast({ title: 'Schedule Deleted', description: 'The report schedule has been deleted successfully.' });
        }}
        onRunSchedule={(id) => {
          console.log('Running schedule:', id);
          toast({ title: 'Report Generated', description: 'The scheduled report has been generated and sent to recipients.' });
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Property Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...new Set(properties.map(p => p.type).filter(Boolean))].map(type => {
                const typeProperties = properties.filter(p => p.type === type);
                const avgRevenue = typeProperties.length > 0 ? typeProperties.reduce((sum, p) => sum + (p.performance?.revenue || 0), 0) / typeProperties.length : 0;
                const avgOccupancy = typeProperties.length > 0 ? typeProperties.reduce((sum, p) => sum + (p.performance?.occupancyRate || 0), 0) / typeProperties.length : 0;

                return (
                  <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{type}s</div>
                      <div className="text-sm text-muted-foreground">{typeProperties.length} properties</div>
                      <div className="text-sm text-blue-600">{avgOccupancy.toFixed(1)}% avg occupancy</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{avgRevenue.toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">Avg Revenue</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...new Set(properties.map(p => p.location?.city).filter(Boolean))].map(city => {
                const cityProperties = properties.filter(p => p.location?.city === city);
                const totalRevenue = cityProperties.reduce((sum, p) => sum + (p.performance?.revenue || 0), 0);
                const avgOccupancy = cityProperties.length > 0 ? cityProperties.reduce((sum, p) => sum + (p.performance?.occupancyRate || 0), 0) / cityProperties.length : 0;

                return (
                  <div key={city} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{city}</div>
                      <div className="text-sm text-muted-foreground">{cityProperties.length} properties</div>
                      <div className="text-sm text-blue-600">{avgOccupancy.toFixed(1)}% avg occupancy</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{(totalRevenue || 0).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-6">
      {/* Group Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Property Groups</h3>
          <p className="text-sm text-muted-foreground">Manage and organize properties into groups</p>
        </div>
        <Button onClick={() => setShowAddGroup(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </div>

      {/* Property Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {propertyGroups.map(group => (
          <Card key={group._id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">{group.groupType || 'Standard'}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedGroup(group);
                      setSelectedGroupForEdit(group);
                      setShowEditGroup(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Group
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSyncGroupSettings(group._id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDeleteGroup(group._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Group Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">{group.properties?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Properties</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {group.metrics ? `${group.metrics.avgOccupancy}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Occupancy</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">
                      ₹{(group.metrics?.totalRevenue || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                </div>

                {/* Group Description */}
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}

                {/* Group Status */}
                <div className="flex items-center justify-between">
                  <Badge variant={group.isActive ? "default" : "secondary"}>
                    {group.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        // Navigate to group dashboard
                        setSelectedGroup(group);
                      }}
                    >
                      <BarChart3 className="mr-1 h-3 w-3" />
                      Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        // Navigate to group settings
                        setSelectedGroup(group);
                        setSelectedGroupForEdit(group);
                        setShowEditGroup(true);
                      }}
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      Settings
                    </Button>
                  </div>
                  <Button 
                    variant="default"
                    size="sm" 
                    className="w-full"
                    onClick={() => openPropertyAssignmentModal(group)}
                  >
                    <Building2 className="mr-1 h-3 w-3" />
                    Manage Properties
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          isLoading={isLoading}
        />
      )}

      {/* Empty State */}
      {propertyGroups.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No property groups yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by creating your first property group to organize your properties.
              </p>
              <Button className="mt-4" onClick={() => setShowAddGroup(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Group
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'properties', name: 'Properties', icon: Building2 },
    { id: 'groups', name: 'Groups', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && propertyGroups.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64 flex-col">
          <AlertCircle className="h-8 w-8 text-red-600 mb-4" />
          <span className="text-gray-600 text-center">
            {error}
          </span>
          <Button 
            onClick={() => {
              fetchPropertyGroups();
              fetchProperties();
            }}
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Multi-Property Manager</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => {
            fetchPropertyGroups();
            fetchProperties();
          }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
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
                  onClick={() => setActiveView(tab.id as any)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeView === tab.id
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
      {activeView === 'dashboard' && renderDashboard()}
      {activeView === 'properties' && renderProperties()}
      {activeView === 'groups' && renderGroups()}
      {activeView === 'analytics' && renderAnalytics()}

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedProperty.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPropertyForEdit(selectedProperty.originalHotel || selectedProperty);
                      setShowEditProperty(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedProperty(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Property Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Brand:</span>
                        <div className="font-medium">{selectedProperty.brand}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <div className="font-medium capitalize">{selectedProperty.type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rating:</span>
                        <div className="font-medium flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {selectedProperty.rating}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={getStatusColor(selectedProperty.status) as any}>
                          {selectedProperty.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <div className="font-medium">{selectedProperty.location.address}</div>
                      <div className="text-sm">{selectedProperty.location.city}, {selectedProperty.location.country}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{selectedProperty.contact.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{selectedProperty.contact.email}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Manager: {selectedProperty.contact.manager}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedProperty.performance.occupancyRate}%</div>
                      <div className="text-sm text-muted-foreground">Occupancy Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">₹{selectedProperty.performance.adr}</div>
                      <div className="text-sm text-muted-foreground">ADR</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">₹{selectedProperty.performance.revpar.toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">RevPAR</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">₹{(selectedProperty.performance?.revenue || 0).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features and Amenities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features & Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {Object.entries(selectedProperty.features).map(([feature, enabled]) => {
                      const icons: { [key: string]: React.ComponentType<any> } = {
                        pms: Settings,
                        pos: IndianRupee,
                        spa: Star,
                        restaurant: Utensils,
                        parking: Car,
                        wifi: Wifi,
                        fitness: Dumbbell,
                        pool: Coffee
                      };
                      const Icon = icons[feature] || CheckCircle;
                      
                      return (
                        <div key={feature} className={`flex items-center space-x-2 ${enabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <Icon className="h-4 w-4" />
                          <span className="capitalize text-sm">{feature}</span>
                          {enabled ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Amenities:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProperty.amenities.map(amenity => (
                        <Badge key={amenity} variant="secondary">{amenity}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Property Assignment Modal */}
      {showPropertyAssignment && targetGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Properties for {targetGroup.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add or remove properties from this group
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowPropertyAssignment(false);
                    setTargetGroup(null);
                    setSelectedPropertiesForAssignment([]);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Properties in Group */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    Current Properties ({targetGroup.properties?.length || 0})
                  </h4>
                  {targetGroup.properties && targetGroup.properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {targetGroup.properties.map((propertyId: string) => {
                        const property = properties.find(p => p.id === propertyId);
                        if (!property) return null;
                        
                        return (
                          <div key={property.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="text-sm font-medium">{property.name}</div>
                                <div className="text-xs text-muted-foreground">{property.location.city}</div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemovePropertiesFromGroup(targetGroup._id, [property.id])}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No properties assigned to this group yet.</p>
                  )}
                </div>

                {/* Available Properties to Add */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Available Properties
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {properties
                      .filter(property => !targetGroup.properties?.includes(property.id))
                      .map(property => (
                        <label
                          key={property.id}
                          className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPropertiesForAssignment.includes(property.id)}
                            onChange={(e) => handlePropertySelection(property.id, e.target.checked)}
                            className="rounded"
                          />
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{property.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {property.location.city} • {property.rooms.total} rooms • {property.type}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {property.status}
                          </Badge>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedPropertiesForAssignment.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {selectedPropertiesForAssignment.length} property(ies) selected
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPropertiesForAssignment([])}
                      >
                        Clear Selection
                      </Button>
                      <Button onClick={handleBulkAssignment}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Group
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={showAddProperty}
        onClose={() => setShowAddProperty(false)}
        onSuccess={() => {
          fetchProperties();
          setShowAddProperty(false);
        }}
      />

      {/* Edit Property Modal */}
      <EditPropertyModal
        isOpen={showEditProperty}
        onClose={() => {
          setShowEditProperty(false);
          setSelectedPropertyForEdit(null);
        }}
        onSuccess={() => {
          fetchProperties();
          setShowEditProperty(false);
          setSelectedPropertyForEdit(null);
        }}
        property={selectedPropertyForEdit}
      />

      {/* Add Group Modal */}
      <AddGroupModal
        isOpen={showAddGroup}
        onClose={() => setShowAddGroup(false)}
        onSuccess={() => {
          fetchPropertyGroups();
          setShowAddGroup(false);
        }}
      />

      {/* Edit Group Modal */}
      <EditGroupModal
        isOpen={showEditGroup}
        onClose={() => {
          setShowEditGroup(false);
          setSelectedGroupForEdit(null);
        }}
        onSuccess={() => {
          fetchPropertyGroups();
          setShowEditGroup(false);
          setSelectedGroupForEdit(null);
        }}
        group={selectedGroupForEdit}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        properties={properties}
        groups={propertyGroups}
      />
    </div>
  );
};