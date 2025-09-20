import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Star,
  Clock,
  MapPin,
  Users,
  Calendar,
  Phone,
  Mail,
  Heart,
  HeartOff,
  ChevronRight,
  Loader2,
  Sparkles,
  TrendingUp,
  Activity,
  Eye,
  Settings,
  Zap
} from 'lucide-react';
import { hotelServicesService, HotelService, ServiceType } from '../../services/hotelServicesService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { useRealTime } from '../../services/realTimeService';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function HotelServicesDashboard() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filterFeatured, setFilterFeatured] = useState(false);

  const queryClient = useQueryClient();
  const { connectionState, connect, disconnect, on, off } = useRealTime();

  // WebSocket connection setup
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Real-time event listeners for hotel services updates
  useEffect(() => {
    if (connectionState !== 'connected') return;

    const handleServiceUpdated = (data: any) => {
      console.log('Hotel service updated:', data);
      const updatedService = data.service;
      
      // Update services cache
      queryClient.setQueryData(['hotel-services'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((service: HotelService) => 
          service._id === updatedService._id ? updatedService : service
        );
      });

      // Update featured services cache if applicable
      if (updatedService.featured) {
        queryClient.invalidateQueries({ queryKey: ['featured-services'] });
      }

      // Show notification for price changes or availability updates
      if (data.priceChanged) {
        toast.info(`Price updated for ${updatedService.name}`, {
          duration: 4000,
          icon: '💰'
        });
      }

      if (data.availabilityChanged) {
        toast.info(`Availability updated for ${updatedService.name}`, {
          duration: 3000,
          icon: updatedService.available ? '✅' : '❌'
        });
      }
    };

    const handleServiceCreated = (data: any) => {
      console.log('New hotel service created:', data);
      const newService = data.service;
      
      // Invalidate queries to refresh with new service
      queryClient.invalidateQueries({ queryKey: ['hotel-services'] });
      if (newService.featured) {
        queryClient.invalidateQueries({ queryKey: ['featured-services'] });
      }

      toast.success(`New service available: ${newService.name}`, {
        duration: 4000,
        icon: '🆕'
      });
    };

    const handleServiceUnavailable = (data: any) => {
      console.log('Service became unavailable:', data);
      const service = data.service;
      
      // Update cache to reflect unavailable status
      queryClient.setQueryData(['hotel-services'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((s: HotelService) => 
          s._id === service._id ? { ...s, available: false } : s
        );
      });

      toast.error(`${service.name} is temporarily unavailable`, {
        duration: 4000,
        icon: '⚠️'
      });
    };

    // Set up event listeners
    on('hotel-service:updated', handleServiceUpdated);
    on('hotel-service:created', handleServiceCreated);
    on('hotel-service:unavailable', handleServiceUnavailable);

    return () => {
      off('hotel-service:updated', handleServiceUpdated);
      off('hotel-service:created', handleServiceCreated);
      off('hotel-service:unavailable', handleServiceUnavailable);
    };
  }, [connectionState, on, off, queryClient]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('hotelServicesFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('hotelServicesFavorites', JSON.stringify(newFavorites));
  };

  // Toggle favorite
  const toggleFavorite = (serviceId: string) => {
    const newFavorites = favorites.includes(serviceId)
      ? favorites.filter(id => id !== serviceId)
      : [...favorites, serviceId];
    saveFavorites(newFavorites);
  };

  // Get services based on filters
  const getServicesQuery = () => {
    const params: any = {};
    if (selectedType) params.type = selectedType;
    if (searchTerm) params.search = searchTerm;
    if (filterFeatured) params.featured = true;
    return params;
  };

  // Queries
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['hotel-services', getServicesQuery()],
    queryFn: () => hotelServicesService.getServices(getServicesQuery()),
    staleTime: 5 * 60 * 1000
  });

  const { data: serviceTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['service-types'],
    queryFn: hotelServicesService.getServiceTypes,
    staleTime: 10 * 60 * 1000
  });

  const { data: featuredServices, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-services'],
    queryFn: hotelServicesService.getFeaturedServices,
    staleTime: 5 * 60 * 1000
  });

  // Filter services based on favorites if needed
  const filteredServices = services?.filter(service => 
    !filterFeatured || service.featured
  ) || [];

  const handleServiceClick = (service: HotelService) => {
    // Navigate to service detail page
    window.location.href = `/app/services/${service._id}`;
  };

  const handleBookNow = (service: HotelService) => {
    // Navigate to booking page
    window.location.href = `/app/services/${service._id}/book`;
  };

  if (servicesLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transform -skew-y-1 shadow-xl rounded-3xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Hotel Services
                  </h1>
                  <p className="text-gray-600 mt-1">Discover and book amazing hotel services and experiences</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Real-time connection status */}
                <div className="flex items-center space-x-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-xl shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionState === 'connected' ? 'bg-green-500 animate-pulse' :
                    connectionState === 'connecting' ? 'bg-yellow-500 animate-bounce' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600 capitalize font-medium">
                    {connectionState === 'connected' ? 'Live Updates' :
                     connectionState === 'connecting' ? 'Connecting...' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {/* Total Services */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl h-24">
              <div className="p-3 text-center flex flex-col justify-center h-full">
                <div className="flex items-center justify-center mb-1">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {services?.length || 0}
                </div>
                <div className="text-xs font-medium text-gray-600">Total Services</div>
              </div>
            </Card>
          </div>

          {/* Featured Services */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl h-24">
              <div className="p-3 text-center flex flex-col justify-center h-full">
                <div className="flex items-center justify-center mb-1">
                  <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {featuredServices?.length || 0}
                </div>
                <div className="text-xs font-medium text-gray-600">Featured</div>
              </div>
            </Card>
          </div>

          {/* Available Now */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl h-24">
              <div className="p-3 text-center flex flex-col justify-center h-full">
                <div className="flex items-center justify-center mb-1">
                  <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {services?.filter(s => s.available).length || 0}
                </div>
                <div className="text-xs font-medium text-gray-600">Available</div>
              </div>
            </Card>
          </div>

          {/* Categories */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl h-24">
              <div className="p-3 text-center flex flex-col justify-center h-full">
                <div className="flex items-center justify-center mb-1">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {serviceTypes?.length || 0}
                </div>
                <div className="text-xs font-medium text-gray-600">Categories</div>
              </div>
            </Card>
          </div>

          {/* Favorites */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl h-24">
              <div className="p-3 text-center flex flex-col justify-center h-full">
                <div className="flex items-center justify-center mb-1">
                  <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {favorites.length}
                </div>
                <div className="text-xs font-medium text-gray-600">Favorites</div>
              </div>
            </Card>
          </div>

          {/* Booking Rate */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl h-24">
              <div className="p-3 text-center flex flex-col justify-center h-full">
                <div className="flex items-center justify-center mb-1">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  98%
                </div>
                <div className="text-xs font-medium text-gray-600">Satisfaction</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-100 to-gray-100 px-6 py-4 border-b border-gray-200/50">
            <div className="flex items-center text-gray-800">
              <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl mr-3">
                <Search className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold">Search & Filter Services</div>
                <div className="text-sm text-gray-600 mt-1">Find your perfect hotel experience</div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 border-2 border-gray-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium text-lg"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Service Type Filter */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium text-gray-700 min-w-[150px]"
                >
                  <option value="">All Types</option>
                  {serviceTypes?.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured Filter */}
              <Button
                variant={filterFeatured ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterFeatured(!filterFeatured)}
                className={`rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
                  filterFeatured
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-white/80 hover:bg-white/90 border-2 border-gray-200 hover:border-yellow-300 shadow-lg hover:shadow-xl'
                }`}
              >
                <Star className="h-4 w-4 mr-2" />
                Featured Only
              </Button>

              {/* Clear Filters */}
              {(selectedType || searchTerm || filterFeatured) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedType('');
                    setSearchTerm('');
                    setFilterFeatured(false);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-xl px-4 py-3 font-semibold transition-all duration-200 hover:shadow-lg"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Featured Services Section */}
        {!selectedType && !searchTerm && !filterFeatured && featuredServices && featuredServices.length > 0 && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-5 border-b border-gray-200/50">
              <div className="flex items-center text-gray-800">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl mr-3">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Featured Services</h2>
                  <div className="text-sm text-gray-600 mt-1">Handpicked premium experiences just for you</div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredServices.slice(0, 3).map((service) => (
                  <ServiceCard
                    key={service._id}
                    service={service}
                    isFavorite={favorites.includes(service._id)}
                    onToggleFavorite={toggleFavorite}
                    onClick={() => handleServiceClick(service)}
                    onBookNow={() => handleBookNow(service)}
                    featured
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* All Services */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-800">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {filterFeatured ? 'Featured Services' : 'All Services'}
                  </h2>
                  <div className="text-sm text-gray-600 mt-1">
                    {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-50 rounded-xl inline-block mb-4">
                  <Search className="h-12 w-12 mx-auto text-gray-300" />
                </div>
                <p className="text-gray-500 text-lg mb-2 font-semibold">No services found</p>
                <p className="text-gray-400">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service._id}
                    service={service}
                    isFavorite={favorites.includes(service._id)}
                    onToggleFavorite={toggleFavorite}
                    onClick={() => handleServiceClick(service)}
                    onBookNow={() => handleBookNow(service)}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

interface ServiceCardProps {
  service: HotelService;
  isFavorite: boolean;
  onToggleFavorite: (serviceId: string) => void;
  onClick: () => void;
  onBookNow: () => void;
  featured?: boolean;
}

function ServiceCard({
  service,
  isFavorite,
  onToggleFavorite,
  onClick,
  onBookNow,
  featured = false
}: ServiceCardProps) {
  const typeInfo = hotelServicesService.getServiceTypeInfo(service.type);

  return (
    <div className="relative group">
      {featured && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
      )}
      <Card className={`relative p-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer rounded-2xl ${
        featured ? 'ring-2 ring-yellow-200' : ''
      }`}>
      {/* Service Image */}
      <div className="relative mb-4">
        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
          {service.images && service.images.length > 0 ? (
            <img
              src={service.images[0]}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl">{typeInfo.icon}</span>
            </div>
          )}
        </div>
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(service._id);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
        >
          {isFavorite ? (
            <Heart className="h-5 w-5 text-red-500 fill-current" />
          ) : (
            <Heart className="h-5 w-5 text-gray-400 hover:text-red-400 transition-colors duration-200" />
          )}
        </button>

        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
              ⭐ Featured
            </span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg ${typeInfo.color} backdrop-blur-sm`}>
            {typeInfo.icon} {typeInfo.label}
          </span>
        </div>
      </div>

      {/* Service Info */}
      <div onClick={onClick}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {service.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {service.description}
        </p>

        {/* Service Details */}
        <div className="space-y-2 mb-4">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600">
              {hotelServicesService.formatPrice(service.price, service.currency)}
            </span>
            {service.duration && (
              <span className="text-sm text-gray-500">
                {hotelServicesService.formatDuration(service.duration)}
              </span>
            )}
          </div>

          {/* Rating */}
          {service.rating.count > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {service.rating.average.toFixed(1)} ({service.rating.count} reviews)
              </span>
            </div>
          )}

          {/* Location */}
          {service.location && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{service.location}</span>
            </div>
          )}

          {/* Operating Hours */}
          {service.operatingHours && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{hotelServicesService.formatOperatingHours(service.operatingHours)}</span>
            </div>
          )}

          {/* Capacity */}
          {service.capacity && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>Up to {service.capacity} people</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {service.amenities && service.amenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {service.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {amenity}
                </span>
              ))}
              {service.amenities.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{service.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-white/80 hover:bg-white/90 border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-semibold"
            onClick={onClick}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-xl font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onBookNow();
            }}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Book Now
          </Button>
        </div>
      </Card>
    </div>
  );
}
