import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import {
  Building2,
  MapPin,
  Users,
  IndianRupee,
  TrendingUp,
  Star,
  Phone,
  Mail,
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
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';

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
    wifi: boolean;
    parking: boolean;
    restaurant: boolean;
    gym: boolean;
    spa: boolean;
    pool: boolean;
    businessCenter: boolean;
    petFriendly: boolean;
  };
}

interface VirtualizedPropertyListProps {
  properties: Property[];
  onPropertySelect: (property: Property) => void;
  onPropertyEdit: (property: Property) => void;
  onPropertyDelete: (propertyId: string) => void;
  searchTerm?: string;
  statusFilter?: string;
  typeFilter?: string;
  itemHeight?: number;
  containerHeight?: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'inactive':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'maintenance':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-green-600 bg-green-50 border-green-200';
    case 'inactive': return 'text-red-600 bg-red-50 border-red-200';
    case 'maintenance': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getPerformanceIndicator = (current: number, previous: number) => {
  if (current > previous) {
    return <ArrowUpRight className="h-3 w-3 text-green-500" />;
  } else if (current < previous) {
    return <ArrowDownRight className="h-3 w-3 text-red-500" />;
  }
  return null;
};

const amenityIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  wifi: Shield,
  parking: Car,
  restaurant: Utensils,
  gym: Dumbbell,
  spa: Star,
  pool: Coffee,
  businessCenter: Building2,
  petFriendly: Star
};

export const VirtualizedPropertyList: React.FC<VirtualizedPropertyListProps> = ({
  properties,
  onPropertySelect,
  onPropertyEdit,
  onPropertyDelete,
  searchTerm = '',
  statusFilter = 'all',
  typeFilter = 'all',
  itemHeight = 280,
  containerHeight = 600
}) => {
  // Filter properties based on search and filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = !searchTerm ||
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      const matchesType = typeFilter === 'all' || property.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [properties, searchTerm, statusFilter, typeFilter]);

  // Set up virtualizer
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredProperties.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 3,
  });

  const renderPropertyCard = (property: Property, virtualItem: any) => {
    const occupancyChange = property.performance.occupancyRate - property.performance.lastMonth.occupancyRate;
    const revenueChange = property.performance.revenue - property.performance.lastMonth.revenue;

    return (
      <div
        key={virtualItem.key}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualItem.size}px`,
          transform: `translateY(${virtualItem.start}px)`,
        }}
        className="px-2 py-2"
      >
        <Card className="h-full hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {property.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{property.location.city}, {property.location.country}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{property.brand}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{property.rating}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(property.status)} border`}>
                  {getStatusIcon(property.status)}
                  <span className="ml-1 capitalize">{property.status}</span>
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPropertySelect(property)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPropertyEdit(property)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Property
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onPropertyDelete(property.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Property
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Room Statistics */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{property.rooms.total}</div>
                <div className="text-xs text-muted-foreground">Total Rooms</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{property.rooms.occupied}</div>
                <div className="text-xs text-muted-foreground">Occupied</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{property.rooms.available}</div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{property.rooms.outOfOrder}</div>
                <div className="text-xs text-muted-foreground">Maintenance</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Occupancy</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{property.performance.occupancyRate}%</span>
                    {getPerformanceIndicator(property.performance.occupancyRate, property.performance.lastMonth.occupancyRate)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ADR</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">₹{property.performance.adr}</span>
                    {getPerformanceIndicator(property.performance.adr, property.performance.lastMonth.adr)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">RevPAR</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">₹{property.performance.revpar}</span>
                    {getPerformanceIndicator(property.performance.revpar, property.performance.lastMonth.revpar)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">₹{(property.performance.revenue / 1000).toFixed(0)}K</span>
                    {getPerformanceIndicator(property.performance.revenue, property.performance.lastMonth.revenue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <div className="text-sm text-muted-foreground mb-2">Key Features</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(property.features)
                  .filter(([, enabled]) => enabled)
                  .slice(0, 6)
                  .map(([feature]) => {
                    const IconComponent = amenityIcons[feature] || Star;
                    return (
                      <div key={feature} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs">
                        <IconComponent className="h-3 w-3" />
                        <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Contact Information */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{property.contact.manager}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{property.contact.phone}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPropertySelect(property)}
                className="h-7 px-3 text-xs"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (filteredProperties.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No properties found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredProperties.length} of {properties.length} properties</span>
        {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
          <span>Filtered results</span>
        )}
      </div>

      {/* Virtualized List Container */}
      <div
        ref={parentRef}
        style={{ height: `${containerHeight}px` }}
        className="overflow-auto border rounded-lg"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) =>
            renderPropertyCard(filteredProperties[virtualItem.index], virtualItem)
          )}
        </div>
      </div>
    </div>
  );
};