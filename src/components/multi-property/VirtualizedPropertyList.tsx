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
  itemHeight = 240,
  containerHeight = 500
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
        className="px-3 py-2"
      >
        <Card className="h-full border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white cursor-pointer overflow-hidden"
              onClick={() => onPropertySelect(property)}>
          {/* Header Section - Compact */}
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold text-gray-900 truncate">{property.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-200 capitalize px-2 py-0">
                      {property.type}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-gray-600">{property.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <Badge className={`${getStatusColor(property.status)} border text-xs font-medium px-2 py-1`}>
                  {getStatusIcon(property.status)}
                  <span className="ml-1 capitalize">{property.status}</span>
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPropertySelect(property); }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPropertyEdit(property); }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Property
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={(e) => { e.stopPropagation(); onPropertyDelete(property.id); }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Property
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Location & Brand */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="truncate">{property.location.city}, {property.location.country}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="font-medium text-gray-700">{property.brand}</span>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-4">
            {/* Room Statistics - Compact Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{property.rooms.total}</div>
                <div className="text-xs text-blue-600 font-medium">Total</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{property.rooms.occupied}</div>
                <div className="text-xs text-green-600 font-medium">Occupied</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{property.rooms.available}</div>
                <div className="text-xs text-orange-600 font-medium">Available</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">{property.rooms.outOfOrder}</div>
                <div className="text-xs text-red-600 font-medium">Maintenance</div>
              </div>
            </div>

            {/* Performance Metrics - Compact Layout */}
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-900">{property.performance.occupancyRate}%</span>
                  {getPerformanceIndicator(property.performance.occupancyRate, property.performance.lastMonth.occupancyRate)}
                </div>
                <span className="text-xs text-gray-600">Occupancy</span>
              </div>

              <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-900">₹{property.performance.revpar.toFixed(0)}</span>
                  {getPerformanceIndicator(property.performance.revpar, property.performance.lastMonth.revpar)}
                </div>
                <span className="text-xs text-gray-600">RevPAR</span>
              </div>

              <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-900">₹{property.performance.adr}</span>
                  {getPerformanceIndicator(property.performance.adr, property.performance.lastMonth.adr)}
                </div>
                <span className="text-xs text-gray-600">ADR</span>
              </div>

              <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-900">₹{(property.performance.revenue / 1000).toFixed(0)}K</span>
                  {getPerformanceIndicator(property.performance.revenue, property.performance.lastMonth.revenue)}
                </div>
                <span className="text-xs text-gray-600">Revenue</span>
              </div>
            </div>

            {/* Key Features - Fixed Height to Prevent Overlap */}
            <div className="min-h-[2.5rem]">
              <div className="text-sm text-gray-600 font-medium mb-2">Key Features</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(property.features)
                  .filter(([, enabled]) => enabled)
                  .slice(0, 4)
                  .map(([feature]) => {
                    const IconComponent = amenityIcons[feature] || Star;
                    return (
                      <div key={feature} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        <IconComponent className="h-3 w-3" />
                        <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    );
                  })}
                {Object.entries(property.features).filter(([, enabled]) => enabled).length > 4 && (
                  <div className="flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                    +{Object.entries(property.features).filter(([, enabled]) => enabled).length - 4} more
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer - Compact */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-20">{property.contact.manager}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span className="truncate max-w-20">{property.contact.phone}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onPropertySelect(property); }}
                className="h-6 px-3 text-xs border-gray-200 hover:bg-gray-50"
              >
                Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (filteredProperties.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters to find properties.'
                : 'No properties have been added to your portfolio yet.'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  // Reset filters - this would need to be passed as props
                  window.location.reload(); // Temporary solution
                }}
                className="border-gray-300 hover:bg-gray-50"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Showing {filteredProperties.length} of {properties.length} properties
          </h3>
          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Filtered results
            </Badge>
          )}
        </div>
      </div>

      {/* Virtualized List Container */}
      <div
        ref={parentRef}
        style={{ height: `${containerHeight}px` }}
        className="overflow-auto border-0 rounded-xl bg-gray-50/50"
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