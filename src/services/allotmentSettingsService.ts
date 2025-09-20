import { api } from './api';

export interface GlobalDefaults {
  totalInventory: number;
  defaultAllocationMethod: 'percentage' | 'fixed' | 'dynamic';
  overbookingAllowed: boolean;
  overbookingLimit: number;
  releaseWindow: number;
  autoRelease: boolean;
  blockPeriod: number;
  currency: string;
  timezone: string;
}

export interface DefaultChannel {
  channelId: string;
  channelName: string;
  isActive: boolean;
  priority: number;
  commission: number;
  markup: number;
  maxAdvanceBooking: number;
  minAdvanceBooking: number;
  cutoffTime: string;
  restrictions: {
    minimumStay: number;
    maximumStay: number;
    closedToArrival: boolean;
    closedToDeparture: boolean;
    stopSell: boolean;
  };
  rateModifiers: {
    weekdays: number;
    weekends: number;
    holidays: number;
  };
}

export interface AllocationRuleTemplate {
  _id?: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'dynamic' | 'priority';
  isDefault: boolean;
  allocation: {
    percentage?: { [channelId: string]: number };
    fixed?: { [channelId: string]: number };
    priority?: Array<{
      channelId: string;
      priority: number;
      minAllocation: number;
      maxAllocation: number;
    }>;
  };
  conditions: {
    seasonality: 'high' | 'medium' | 'low' | 'all';
    daysOfWeek: string[];
    occupancyThreshold?: number;
  };
  fallbackRule: 'equal_distribution' | 'priority_based' | 'historical_performance' | 'revenue_optimization';
}

export interface AnalyticsSettings {
  calculationFrequency: 'hourly' | 'daily' | 'weekly';
  enableRecommendations: boolean;
  alerts: Array<{
    type: 'low_occupancy' | 'high_occupancy' | 'channel_underperforming' | 'inventory_imbalance' | 'overbooking_risk';
    threshold: number;
    isActive: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    recipients?: Array<{
      email: string;
      role: string;
    }>;
  }>;
  performanceThresholds: {
    lowUtilization: number;
    highUtilization: number;
    lowConversion: number;
    highConversion: number;
  };
}

export interface IntegrationSettings {
  channelManager: {
    provider: 'none' | 'siteminder' | 'cloudbeds' | 'rentals_united' | 'channex' | 'custom';
    isConnected: boolean;
    connectionSettings: {
      apiUrl?: string;
      apiKey?: string;
      propertyId?: string;
      username?: string;
    };
    syncSettings: {
      syncFrequency: number;
      autoSync: boolean;
      syncInventory: boolean;
      syncRates: boolean;
      syncRestrictions: boolean;
    };
    lastSync?: string;
    errorLog: Array<{
      timestamp: string;
      channelId: string;
      error: string;
      resolved: boolean;
    }>;
  };
  pms: {
    provider: 'none' | 'opera' | 'protel' | 'mews' | 'cloudbeds' | 'custom';
    isConnected: boolean;
    connectionSettings: {
      apiUrl?: string;
      apiKey?: string;
      propertyCode?: string;
    };
    roomTypeMapping: { [pmsRoomTypeId: string]: string };
    syncSettings: {
      realTimeSync: boolean;
      syncFrequency: number;
      syncBookings: boolean;
      syncInventory: boolean;
    };
    lastSync?: string;
  };
  webhooks: Array<{
    name: string;
    url: string;
    events: Array<{
      type: 'inventory_update' | 'booking_created' | 'booking_cancelled' | 'rate_changed';
    }>;
    isActive: boolean;
    secretKey?: string;
    retryPolicy: {
      maxRetries: number;
      retryDelay: number;
    };
  }>;
}

export interface UIPreferences {
  defaultView: 'overview' | 'dashboard' | 'calendar';
  calendarView: 'week' | 'month';
  showChannelColors: boolean;
  compactMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface HotelAllotmentSettings {
  _id: string;
  hotelId: string;
  globalDefaults: GlobalDefaults;
  defaultChannels: DefaultChannel[];
  allocationRuleTemplates: AllocationRuleTemplate[];
  analyticsSettings: AnalyticsSettings;
  integrationSettings: IntegrationSettings;
  uiPreferences: UIPreferences;
  createdBy: string;
  updatedBy?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Virtuals
  activeChannelsCount: number;
  activeAlertsCount: number;
  integrationStatus: 'full' | 'partial' | 'none';
}

export interface SettingsSummary {
  activeChannelsCount: number;
  activeAlertsCount: number;
  integrationStatus: 'full' | 'partial' | 'none';
  allocationRuleTemplatesCount: number;
  lastUpdated: string;
  version: number;
  configuration: {
    overbookingEnabled: boolean;
    autoReleaseEnabled: boolean;
    analyticsEnabled: boolean;
    channelManagerConnected: boolean;
    pmsConnected: boolean;
  };
}

export interface TestResult {
  success: boolean;
  message: string;
  details: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  section: string;
}

class AllotmentSettingsService {
  async getHotelSettings(): Promise<HotelAllotmentSettings> {
    console.log('🔍 [AllotmentSettingsService] Fetching hotel settings');
    const response = await api.get('/allotments/settings/hotel');
    console.log('✅ [AllotmentSettingsService] Hotel settings fetched successfully:', response.data);
    return response.data.data;
  }

  async getSettingsSummary(): Promise<SettingsSummary> {
    console.log('📊 [AllotmentSettingsService] Fetching settings summary');
    const response = await api.get('/allotments/settings/summary');
    console.log('✅ [AllotmentSettingsService] Settings summary fetched successfully:', response.data);
    return response.data.data;
  }

  async updateGlobalSettings(settings: Partial<HotelAllotmentSettings>): Promise<HotelAllotmentSettings> {
    try {
      console.log('🔧 [AllotmentSettingsService] Updating global settings:', settings);
      const response = await api.put('/allotments/settings/global', settings);
      console.log('✅ [AllotmentSettingsService] Global settings updated successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error updating global settings:', error);
      throw error;
    }
  }

  async updateIntegrationSettings(settings: { [key: string]: any }): Promise<HotelAllotmentSettings> {
    try {
      console.log('🔧 [AllotmentSettingsService] Updating integration settings:', settings);
      const response = await api.put('/allotments/settings/integrations', settings);
      console.log('✅ [AllotmentSettingsService] Integration settings updated successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error updating integration settings:', error);
      throw error;
    }
  }

  async updateAnalyticsSettings(analyticsSettings: AnalyticsSettings): Promise<HotelAllotmentSettings> {
    try {
      console.log('🔧 [AllotmentSettingsService] Updating analytics settings:', analyticsSettings);
      const response = await api.put('/allotments/settings/analytics', { analyticsSettings });
      console.log('✅ [AllotmentSettingsService] Analytics settings updated successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error updating analytics settings:', error);
      throw error;
    }
  }

  async addAllocationRuleTemplate(template: Omit<AllocationRuleTemplate, '_id'>): Promise<HotelAllotmentSettings> {
    try {
      console.log('🎯 [AllotmentSettingsService] Adding allocation rule template:', template);
      const response = await api.post('/allotments/settings/templates', template);
      console.log('✅ [AllotmentSettingsService] Allocation rule template added successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error adding allocation rule template:', error);
      throw error;
    }
  }

  async updateAllocationRuleTemplate(template: AllocationRuleTemplate): Promise<HotelAllotmentSettings> {
    try {
      console.log('🔧 [AllotmentSettingsService] Updating allocation rule template:', template);
      const response = await api.post('/allotments/settings/templates', template);
      console.log('✅ [AllotmentSettingsService] Allocation rule template updated successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error updating allocation rule template:', error);
      throw error;
    }
  }

  async deleteAllocationRuleTemplate(templateId: string): Promise<HotelAllotmentSettings> {
    try {
      console.log('🗑️ [AllotmentSettingsService] Deleting allocation rule template:', templateId);
      const response = await api.delete(`/allotments/settings/templates/${templateId}`);
      console.log('✅ [AllotmentSettingsService] Allocation rule template deleted successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error deleting allocation rule template:', error);
      throw error;
    }
  }

  async testIntegration(type: 'channel_manager' | 'pms' | 'webhook', config: any): Promise<TestResult> {
    try {
      console.log('🧪 [AllotmentSettingsService] Testing integration:', type, config);
      const response = await api.post(`/allotments/settings/test/${type}`, config);
      console.log('✅ [AllotmentSettingsService] Integration test completed:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error testing integration:', error);
      throw error;
    }
  }

  async validateSettings(section: string, settings: any): Promise<ValidationResult> {
    try {
      console.log('🔍 [AllotmentSettingsService] Validating settings:', section, settings);
      const response = await api.post('/allotments/settings/validate', { section, settings });
      console.log('✅ [AllotmentSettingsService] Settings validation completed:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error validating settings:', error);
      throw error;
    }
  }

  async resetToDefaults(): Promise<HotelAllotmentSettings> {
    try {
      console.log('🔄 [AllotmentSettingsService] Resetting settings to defaults');
      const response = await api.post('/allotments/settings/reset');
      console.log('✅ [AllotmentSettingsService] Settings reset to defaults successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error resetting settings:', error);
      throw error;
    }
  }

  async exportSettings(): Promise<Blob> {
    try {
      console.log('📤 [AllotmentSettingsService] Exporting settings');
      const response = await api.get('/allotments/settings/export', {
        responseType: 'blob'
      });
      console.log('✅ [AllotmentSettingsService] Settings exported successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error exporting settings:', error);
      throw error;
    }
  }

  async downloadSettings(): Promise<void> {
    try {
      const blob = await this.exportSettings();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `allotment-settings-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error downloading settings:', error);
      throw error;
    }
  }

  async importSettings(settingsData: any): Promise<HotelAllotmentSettings> {
    try {
      console.log('📥 [AllotmentSettingsService] Importing settings:', settingsData);
      const response = await api.post('/allotments/settings/import', settingsData);
      console.log('✅ [AllotmentSettingsService] Settings imported successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error importing settings:', error);
      throw error;
    }
  }

  async uploadSettings(file: File): Promise<HotelAllotmentSettings> {
    try {
      const fileContent = await this.readFileContent(file);
      const settingsData = JSON.parse(fileContent);
      return await this.importSettings(settingsData);
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error uploading settings:', error);
      throw error;
    }
  }

  async getDefaultChannels(): Promise<DefaultChannel[]> {
    try {
      console.log('🔍 [AllotmentSettingsService] Fetching default channels');
      const response = await api.get('/allotments/settings/channels/defaults');
      console.log('✅ [AllotmentSettingsService] Default channels fetched successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [AllotmentSettingsService] Error fetching default channels:', error);
      throw error;
    }
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  // Utility methods for UI
  getChannelDisplayName(channelId: string): string {
    const channelNames: { [key: string]: string } = {
      direct: 'Direct Booking',
      booking_com: 'Booking.com',
      expedia: 'Expedia',
      airbnb: 'Airbnb',
      agoda: 'Agoda',
      hotels_com: 'Hotels.com',
      custom: 'Custom Channel'
    };

    return channelNames[channelId] || channelId;
  }

  getProviderDisplayName(provider: string): string {
    const providerNames: { [key: string]: string } = {
      none: 'No Provider',
      siteminder: 'SiteMinder',
      cloudbeds: 'Cloudbeds',
      rentals_united: 'Rentals United',
      channex: 'Channex',
      opera: 'Opera',
      protel: 'Protel',
      mews: 'Mews',
      custom: 'Custom Integration'
    };

    return providerNames[provider] || provider;
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value}%`;
  }

  validateChannelAllocation(channels: DefaultChannel[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate channels
    const channelIds = channels.map(c => c.channelId);
    const duplicates = channelIds.filter((id, index) => channelIds.indexOf(id) !== index);

    if (duplicates.length > 0) {
      errors.push(`Duplicate channels found: ${duplicates.join(', ')}`);
    }

    // Validate commission ranges
    channels.forEach((channel, index) => {
      if (channel.commission < 0 || channel.commission > 100) {
        errors.push(`Channel ${index + 1}: Commission must be between 0% and 100%`);
      }

      if (!channel.channelName.trim()) {
        errors.push(`Channel ${index + 1}: Channel name is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new AllotmentSettingsService();