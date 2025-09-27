import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  FileText,
  DollarSign,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';

interface HotelFormData {
  basicInfo: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    contact: {
      phone: string;
      email: string;
      website: string;
    };
  };
  operations: {
    checkInTime: string;
    checkOutTime: string;
    currency: string;
    timezone: string;
  };
  policies: {
    cancellation: string;
    child: string;
    pet: string;
    smoking: string;
    extraBed: string;
  };
  taxes: {
    gst: number;
    serviceCharge: number;
    localTax: number;
    tourismTax: number;
  };
}

interface HotelSettingsProps {
  onSettingsChange?: (hasChanges: boolean) => void;
}

export default function HotelSettings({ onSettingsChange }: HotelSettingsProps = {}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<HotelFormData>({
    defaultValues: {
      basicInfo: {
        name: 'THE PENTOUZ Hotel',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400001'
        },
        contact: {
          phone: '+91-9876543210',
          email: 'info@thepentouz.com',
          website: 'https://thepentouz.com'
        }
      },
      operations: {
        checkInTime: '15:00',
        checkOutTime: '11:00',
        currency: 'INR',
        timezone: 'Asia/Kolkata'
      },
      policies: {
        cancellation: '24 hours before check-in',
        child: 'Children under 12 stay free with parents',
        pet: 'Pets are not allowed',
        smoking: 'Smoking is not allowed in rooms',
        extraBed: 'Extra bed available on request'
      },
      taxes: {
        gst: 12,
        serviceCharge: 10,
        localTax: 0,
        tourismTax: 0
      }
    }
  });

  // Fetch hotel settings
  const { data: hotelSettings, isLoading } = useQuery({
    queryKey: ['hotel-settings'],
    queryFn: async () => {
      const response = await fetch('/api/v1/hotel-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hotel settings');
      }

      const data = await response.json();
      return data.data.settings;
    },
    onSuccess: (data) => {
      if (data) {
        // Update form values with fetched data
        setValue('basicInfo', data.basicInfo || {}, { shouldDirty: false });
        setValue('operations', data.operations || {}, { shouldDirty: false });
        setValue('policies', data.policies || {}, { shouldDirty: false });
        setValue('taxes', data.taxes || {}, { shouldDirty: false });
      }
    }
  });

  // Watch for form changes
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(isDirty);
    }
  }, [isDirty, onSettingsChange]);

  // Save basic info mutation
  const saveBasicInfoMutation = useMutation({
    mutationFn: async (data: HotelFormData['basicInfo']) => {
      const response = await fetch('/api/v1/hotel-settings/basic-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update basic information');
      }

      return response.json();
    }
  });

  // Save operations mutation
  const saveOperationsMutation = useMutation({
    mutationFn: async (data: HotelFormData['operations']) => {
      const response = await fetch('/api/v1/hotel-settings/operations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update operations settings');
      }

      return response.json();
    }
  });

  // Save policies mutation
  const savePoliciesMutation = useMutation({
    mutationFn: async (data: HotelFormData['policies']) => {
      const response = await fetch('/api/v1/hotel-settings/policies', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update policies');
      }

      return response.json();
    }
  });

  // Save taxes mutation
  const saveTaxesMutation = useMutation({
    mutationFn: async (data: HotelFormData['taxes']) => {
      const response = await fetch('/api/v1/hotel-settings/taxes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update taxes');
      }

      return response.json();
    }
  });

  const onSubmit = async (data: HotelFormData) => {
    try {
      // Save all sections concurrently
      await Promise.all([
        saveBasicInfoMutation.mutateAsync(data.basicInfo),
        saveOperationsMutation.mutateAsync(data.operations),
        savePoliciesMutation.mutateAsync(data.policies),
        saveTaxesMutation.mutateAsync(data.taxes)
      ]);

      toast.success('Hotel settings updated successfully');

      // Reset form dirty state
      const currentValues = watch();
      Object.keys(currentValues).forEach(key => {
        setValue(key as keyof HotelFormData, currentValues[key], { shouldDirty: false });
      });

      if (onSettingsChange) {
        onSettingsChange(false);
      }
    } catch (error) {
      toast.error('Failed to update hotel settings');
    }
  };

  const isAnyLoading = saveBasicInfoMutation.isLoading ||
                     saveOperationsMutation.isLoading ||
                     savePoliciesMutation.isLoading ||
                     saveTaxesMutation.isLoading;

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 transition-colors">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 transition-colors">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Hotel Settings</span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure your hotel's basic information, policies, and pricing
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Basic Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hotel Name
                </label>
                <input
                  {...register('basicInfo.name', { required: 'Hotel name is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.basicInfo?.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.basicInfo.name.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Street Address
                </label>
                <input
                  {...register('basicInfo.address.street', { required: 'Address is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.basicInfo?.address?.street && (
                  <p className="text-red-500 text-xs mt-1">{errors.basicInfo.address.street.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  {...register('basicInfo.address.city', { required: 'City is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State/Province
                </label>
                <input
                  {...register('basicInfo.address.state', { required: 'State is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <input
                  {...register('basicInfo.address.country', { required: 'Country is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Postal Code
                </label>
                <input
                  {...register('basicInfo.address.postalCode')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Contact Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  {...register('basicInfo.contact.phone', { required: 'Phone is required' })}
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  {...register('basicInfo.contact.email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email format'
                    }
                  })}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Website
                </label>
                <input
                  {...register('basicInfo.contact.website')}
                  type="url"
                  placeholder="https://"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Operational Settings */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Operational Settings</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check-in Time
                </label>
                <input
                  {...register('operations.checkInTime', { required: 'Check-in time is required' })}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check-out Time
                </label>
                <input
                  {...register('operations.checkOutTime', { required: 'Check-out time is required' })}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  {...register('operations.currency')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  {...register('operations.timezone')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Hotel Policies</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cancellation Policy
                </label>
                <textarea
                  {...register('policies.cancellation')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your cancellation policy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Child Policy
                </label>
                <textarea
                  {...register('policies.child')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your policy for children..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pet Policy
                </label>
                <textarea
                  {...register('policies.pet')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your policy for pets..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Smoking Policy
                </label>
                <textarea
                  {...register('policies.smoking')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your smoking policy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Extra Bed Policy
                </label>
                <textarea
                  {...register('policies.extraBed')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your extra bed policy..."
                />
              </div>
            </div>
          </div>

          {/* Taxes and Charges */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Taxes & Charges (%)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GST/VAT Rate
                </label>
                <input
                  {...register('taxes.gst', {
                    required: 'GST rate is required',
                    min: { value: 0, message: 'Rate must be 0 or greater' },
                    max: { value: 100, message: 'Rate cannot exceed 100%' }
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Charge
                </label>
                <input
                  {...register('taxes.serviceCharge', {
                    min: { value: 0, message: 'Rate must be 0 or greater' },
                    max: { value: 100, message: 'Rate cannot exceed 100%' }
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Local Tax
                </label>
                <input
                  {...register('taxes.localTax', {
                    min: { value: 0, message: 'Rate must be 0 or greater' },
                    max: { value: 100, message: 'Rate cannot exceed 100%' }
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tourism Tax
                </label>
                <input
                  {...register('taxes.tourismTax', {
                    min: { value: 0, message: 'Rate must be 0 or greater' },
                    max: { value: 100, message: 'Rate cannot exceed 100%' }
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              type="submit"
              disabled={!isDirty || isAnyLoading}
              className="flex items-center space-x-2"
            >
              {isAnyLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}