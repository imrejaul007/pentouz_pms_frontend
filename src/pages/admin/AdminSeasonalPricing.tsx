import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  Download,
  Upload,
  AlertTriangle,
  Settings
} from 'lucide-react';
import SeasonCalendar from '../../components/pricing/SeasonCalendar';
import SpecialPeriodManager from '../../components/pricing/SpecialPeriodManager';
import { seasonalPricingService } from '../../services/seasonalPricingService';
import { useToast } from '../../hooks/useToast';

interface Season {
  _id: string;
  seasonId: string;
  name: string;
  description: string;
  type: 'peak' | 'high' | 'shoulder' | 'low' | 'off' | 'custom';
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  rateAdjustments: Array<{
    roomType: string;
    adjustmentType: 'percentage' | 'fixed' | 'absolute';
    adjustmentValue: number;
    currency: string;
  }>;
  priority: number;
  color: string;
  isActive: boolean;
}

interface SpecialPeriod {
  _id: string;
  periodId: string;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  rateOverrides: Array<{
    roomType: string;
    overrideType: 'percentage' | 'fixed' | 'absolute' | 'block';
    overrideValue: number;
    currency: string;
  }>;
  restrictions: {
    bookingRestriction: string;
    minLength: number;
    maxLength: number;
  };
  priority: number;
  color: string;
  isActive: boolean;
}

const AdminSeasonalPricing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'seasons' | 'special-periods' | 'analytics'>('calendar');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [specialPeriods, setSpecialPeriods] = useState<SpecialPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [showCreateSpecialPeriod, setShowCreateSpecialPeriod] = useState(false);
  const [editingItem, setEditingItem] = useState<Season | SpecialPeriod | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [seasonsRes, periodsRes, analyticsRes] = await Promise.all([
        seasonalPricingService.getSeasons({ year: selectedYear }),
        seasonalPricingService.getSpecialPeriods({ year: selectedYear }),
        seasonalPricingService.getSeasonalAnalytics(
          `${selectedYear}-01-01`,
          `${selectedYear}-12-31`
        )
      ]);

      setSeasons(seasonsRes.data);
      setSpecialPeriods(periodsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error: any) {
      showToast('Error loading seasonal pricing data', 'error');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async (seasonData: Partial<Season>) => {
    try {
      await seasonalPricingService.createSeason(seasonData);
      showToast('Season created successfully', 'success');
      setShowCreateSeason(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error creating season', 'error');
    }
  };

  const handleCreateSpecialPeriod = async (periodData: Partial<SpecialPeriod>) => {
    try {
      await seasonalPricingService.createSpecialPeriod(periodData);
      showToast('Special period created successfully', 'success');
      setShowCreateSpecialPeriod(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error creating special period', 'error');
    }
  };

  const handleUpdateItem = async (id: string, data: Partial<Season | SpecialPeriod>, type: 'season' | 'period') => {
    try {
      if (type === 'season') {
        await seasonalPricingService.updateSeason(id, data);
        showToast('Season updated successfully', 'success');
      } else {
        await seasonalPricingService.updateSpecialPeriod(id, data);
        showToast('Special period updated successfully', 'success');
      }
      setEditingItem(null);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error updating item', 'error');
    }
  };

  const handleDeleteItem = async (id: string, type: 'season' | 'period') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      if (type === 'season') {
        await seasonalPricingService.deleteSeason(id);
        showToast('Season deleted successfully', 'success');
      } else {
        await seasonalPricingService.deleteSpecialPeriod(id);
        showToast('Special period deleted successfully', 'success');
      }
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error deleting item', 'error');
    }
  };

  const getSeasonTypeColor = (type: string) => {
    const colors = {
      peak: '#DC2626',
      high: '#EA580C',
      shoulder: '#D97706',
      low: '#16A34A',
      off: '#059669',
      custom: '#6366F1'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  const getPeriodTypeColor = (type: string) => {
    const colors = {
      holiday: '#DC2626',
      festival: '#7C3AED',
      event: '#2563EB',
      conference: '#059669',
      wedding_season: '#EC4899',
      sports_event: '#EAB308',
      blackout: '#374151',
      maintenance: '#6B7280',
      custom: '#6366F1'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seasonal Pricing Management</h1>
          <p className="text-gray-600 mt-2">Manage seasons, special periods, and holiday pricing</p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowCreateSeason(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Season</span>
          </button>
          
          <button
            onClick={() => setShowCreateSpecialPeriod(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Special Period</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Seasons</p>
              <p className="text-2xl font-bold text-gray-900">{seasons.filter(s => s.isActive).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Special Periods</p>
              <p className="text-2xl font-bold text-gray-900">{specialPeriods.filter(p => p.isActive).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Blackout Dates</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.blackoutDates?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Peak Periods</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.seasonsByType?.peak || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'calendar', label: 'Calendar View', icon: Calendar },
              { key: 'seasons', label: 'Seasons', icon: TrendingUp },
              { key: 'special-periods', label: 'Special Periods', icon: Clock },
              { key: 'analytics', label: 'Analytics', icon: Settings }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'calendar' && (
            <SeasonCalendar
              seasons={seasons}
              specialPeriods={specialPeriods}
              year={selectedYear}
              onSeasonClick={(season) => setEditingItem(season)}
              onSpecialPeriodClick={(period) => setEditingItem(period)}
            />
          )}

          {activeTab === 'seasons' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Seasons ({selectedYear})</h3>
                <div className="flex space-x-2">
                  <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                  <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {seasons.map((season) => (
                  <div key={season._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: season.color || getSeasonTypeColor(season.type) }}
                          />
                          <h4 className="text-lg font-semibold">{season.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            season.type === 'peak' ? 'bg-red-100 text-red-800' :
                            season.type === 'high' ? 'bg-orange-100 text-orange-800' :
                            season.type === 'shoulder' ? 'bg-yellow-100 text-yellow-800' :
                            season.type === 'low' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {season.type.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mt-1">{season.description}</p>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>
                            {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                          </span>
                          <span>Priority: {season.priority}</span>
                          {season.isRecurring && <span className="text-blue-600">Recurring</span>}
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">Rate Adjustments:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {season.rateAdjustments.map((adj, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                {adj.roomType}: {adj.adjustmentType === 'percentage' ? `${adj.adjustmentValue}%` : `${adj.adjustmentValue} ${adj.currency}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingItem(season)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(season._id, 'season')}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'special-periods' && (
            <SpecialPeriodManager
              specialPeriods={specialPeriods}
              onUpdate={() => loadData()}
              onEdit={setEditingItem}
              onDelete={(id) => handleDeleteItem(id, 'period')}
            />
          )}

          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Seasonal Analytics ({selectedYear})</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Seasons by Type</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.seasonsByType || {}).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type}</span>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Special Periods by Type</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.specialPeriodsByType || {}).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {analytics.blackoutDates && analytics.blackoutDates.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-red-800">Blackout Dates</h4>
                  <div className="space-y-2">
                    {analytics.blackoutDates.map((blackout: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{blackout.name}</span>
                        <span>
                          {new Date(blackout.startDate).toLocaleDateString()} - {new Date(blackout.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSeasonalPricing;