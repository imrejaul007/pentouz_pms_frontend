import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  Globe,
  CreditCard,
  BarChart,
  Zap,
  Key,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';

interface IntegrationFormData {
  payment: {
    stripe: {
      enabled: boolean;
      publicKey: string;
      secretKey: string;
    };
    razorpay: {
      enabled: boolean;
      keyId: string;
      keySecret: string;
    };
  };
  ota: {
    booking: {
      enabled: boolean;
      apiKey: string;
      hotelId: string;
    };
    expedia: {
      enabled: boolean;
      apiKey: string;
      hotelId: string;
    };
  };
  analytics: {
    googleAnalytics: {
      enabled: boolean;
      trackingId: string;
    };
    mixpanel: {
      enabled: boolean;
      token: string;
    };
  };
}

interface IntegrationSettingsProps {
  onSettingsChange?: (hasChanges: boolean) => void;
}

export default function IntegrationSettings({ onSettingsChange }: IntegrationSettingsProps = {}) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty }
  } = useForm<IntegrationFormData>({
    defaultValues: {
      payment: {
        stripe: {
          enabled: false,
          publicKey: '',
          secretKey: ''
        },
        razorpay: {
          enabled: false,
          keyId: '',
          keySecret: ''
        }
      },
      ota: {
        booking: {
          enabled: false,
          apiKey: '',
          hotelId: ''
        },
        expedia: {
          enabled: false,
          apiKey: '',
          hotelId: ''
        }
      },
      analytics: {
        googleAnalytics: {
          enabled: false,
          trackingId: ''
        },
        mixpanel: {
          enabled: false,
          token: ''
        }
      }
    }
  });

  const watchedValues = watch();

  // Load existing integration settings on mount
  useEffect(() => {
    const loadIntegrationSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/integrations/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          reset(data.data);
        } else {
          console.warn('Failed to load integration settings, using defaults');
        }
      } catch (error) {
        console.error('Error loading integration settings:', error);
        toast.error('Failed to load integration settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadIntegrationSettings();
  }, [reset]);

  // Watch for form changes
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(isDirty);
    }
  }, [isDirty, onSettingsChange]);

  // Save integration settings mutation
  const saveIntegrationMutation = useMutation({
    mutationFn: async (data: IntegrationFormData) => {
      // Mock API call
      const response = await fetch('/api/v1/integrations/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update integration settings');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Integration settings updated successfully');
      if (onSettingsChange) {
        onSettingsChange(false);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update integration settings');
    }
  });

  const onSubmit = (data: IntegrationFormData) => {
    saveIntegrationMutation.mutate(data);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderSecretField = (name: string, label: string, secretKey: string, placeholder: string = '') => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Key className="h-4 w-4 inline mr-1" />
        {label}
      </label>
      <div className="relative">
        <input
          {...register(name as any)}
          type={showSecrets[secretKey] ? 'text' : 'password'}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => toggleShowSecret(secretKey)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showSecrets[secretKey] ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading integration settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Integration Settings</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Connect with third-party services and configure API integrations
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Payment Gateways */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payment Gateways</span>
            </h3>

            {/* Stripe */}
            <div className="border border-gray-200 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Stripe</h4>
                    <p className="text-sm text-gray-500">Accept credit cards and digital payments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {watchedValues.payment?.stripe?.enabled ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      {...register('payment.stripe.enabled')}
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {watchedValues.payment?.stripe?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publishable Key
                    </label>
                    <input
                      {...register('payment.stripe.publicKey')}
                      type="text"
                      placeholder="pk_live_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {renderSecretField('payment.stripe.secretKey', 'Secret Key', 'stripe_secret', 'sk_live_...')}
                </div>
              )}
            </div>

            {/* Razorpay */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Razorpay</h4>
                    <p className="text-sm text-gray-500">Indian payment gateway for UPI, cards, and more</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {watchedValues.payment?.razorpay?.enabled ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      {...register('payment.razorpay.enabled')}
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {watchedValues.payment?.razorpay?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key ID
                    </label>
                    <input
                      {...register('payment.razorpay.keyId')}
                      type="text"
                      placeholder="rzp_live_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {renderSecretField('payment.razorpay.keySecret', 'Key Secret', 'razorpay_secret')}
                </div>
              )}
            </div>
          </div>

          {/* Analytics */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <BarChart className="h-4 w-4" />
              <span>Analytics</span>
            </h3>

            {/* Google Analytics */}
            <div className="border border-gray-200 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                    <BarChart className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Google Analytics</h4>
                    <p className="text-sm text-gray-500">Track website usage and visitor behavior</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    {...register('analytics.googleAnalytics.enabled')}
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {watchedValues.analytics?.googleAnalytics?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking ID
                  </label>
                  <input
                    {...register('analytics.googleAnalytics.trackingId')}
                    type="text"
                    placeholder="GA-XXXXXXXX-X or G-XXXXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              type="submit"
              disabled={!isDirty || saveIntegrationMutation.isLoading}
              className="flex items-center space-x-2"
            >
              {saveIntegrationMutation.isLoading ? (
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