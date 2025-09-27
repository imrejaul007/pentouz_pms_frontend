import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '../../../context/ThemeContext';
import {
  Palette,
  Monitor,
  Sun,
  Moon,
  Globe,
  Calendar,
  Clock,
  DollarSign,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';

interface DisplayFormData {
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  numberFormat: string;
  compactView: boolean;
  highContrast: boolean;
}

interface DisplaySettingsProps {
  onSettingsChange?: (hasChanges: boolean) => void;
}

export default function DisplaySettings({ onSettingsChange }: DisplaySettingsProps = {}) {
  const { theme, setTheme } = useTheme();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty }
  } = useForm<DisplayFormData>({
    defaultValues: {
      theme: 'light',
      sidebarCollapsed: false,
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      currency: 'INR',
      numberFormat: 'en-IN',
      compactView: false,
      highContrast: false
    }
  });

  const watchedValues = watch();

  // Watch for theme changes and apply immediately
  const watchedTheme = watch('theme');
  useEffect(() => {
    if (watchedTheme && watchedTheme !== theme) {
      setTheme(watchedTheme as 'light' | 'dark' | 'auto');
    }
  }, [watchedTheme, theme, setTheme]);

  // Fetch current display settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/v1/users/display-preferences', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const preferences = data.data.preferences;

          // Update form with current settings from the API
          setValue('theme', preferences.theme || theme, { shouldDirty: false });
          setValue('sidebarCollapsed', preferences.sidebarCollapsed || false, { shouldDirty: false });
          setValue('language', preferences.language || 'English', { shouldDirty: false });
          setValue('dateFormat', preferences.dateFormat || 'DD/MM/YYYY', { shouldDirty: false });
          setValue('timeFormat', preferences.timeFormat || '24 Hour', { shouldDirty: false });
          setValue('currency', preferences.currency || 'INR', { shouldDirty: false });
          setValue('numberFormat', preferences.numberFormat || 'en-IN', { shouldDirty: false });
          setValue('compactView', preferences.compactView || false, { shouldDirty: false });
          setValue('highContrast', preferences.highContrastMode || preferences.highContrast || false, { shouldDirty: false });
        }
      } catch (error) {
        console.error('Failed to fetch display settings:', error);
      }
    };

    fetchSettings();
  }, [setValue, theme]);

  // Sync form theme value with context theme
  useEffect(() => {
    setValue('theme', theme, { shouldDirty: false });
  }, [theme, setValue]);

  // Watch for form changes
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(isDirty);
    }
  }, [isDirty, onSettingsChange]);

  // Save display settings mutation
  const saveDisplayMutation = useMutation({
    mutationFn: async (data: DisplayFormData) => {
      // Mock API call - replace with actual API endpoint
      const response = await fetch('/api/v1/users/display-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update display settings');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Display settings updated successfully');

      // Reset the form's dirty state without changing values
      // This tells the form that the current values are now the "saved" state
      const currentValues = watch();
      Object.keys(currentValues).forEach(key => {
        setValue(key as keyof DisplayFormData, currentValues[key], { shouldDirty: false });
      });

      if (onSettingsChange) {
        onSettingsChange(false);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update display settings');
    }
  });

  const onSubmit = (data: DisplayFormData) => {
    // Update theme context if theme changed
    if (data.theme !== theme) {
      setTheme(data.theme as 'light' | 'dark' | 'auto');
    }

    saveDisplayMutation.mutate(data);
  };

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'hi', label: 'Hindi' },
    { value: 'ja', label: 'Japanese' }
  ];

  const currencies = [
    { value: 'INR', label: 'INR - Indian Rupee (₹)' },
    { value: 'USD', label: 'USD - US Dollar ($)' },
    { value: 'EUR', label: 'EUR - Euro (€)' },
    { value: 'GBP', label: 'GBP - British Pound (£)' },
    { value: 'JPY', label: 'JPY - Japanese Yen (¥)' }
  ];

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 transition-colors">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Display Settings</span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize the appearance and formatting preferences
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Theme Settings */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span>Theme</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`
                p-4 border-2 rounded-lg cursor-pointer transition-colors flex flex-col items-center space-y-2
                ${watchedValues.theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}>
                <input
                  {...register('theme')}
                  type="radio"
                  value="light"
                  className="sr-only"
                />
                <Sun className="h-8 w-8 text-yellow-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Light</span>
              </label>

              <label className={`
                p-4 border-2 rounded-lg cursor-pointer transition-colors flex flex-col items-center space-y-2
                ${watchedValues.theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}>
                <input
                  {...register('theme')}
                  type="radio"
                  value="dark"
                  className="sr-only"
                />
                <Moon className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Dark</span>
              </label>

              <label className={`
                p-4 border-2 rounded-lg cursor-pointer transition-colors flex flex-col items-center space-y-2
                ${watchedValues.theme === 'auto'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}>
                <input
                  {...register('theme')}
                  type="radio"
                  value="auto"
                  className="sr-only"
                />
                <Monitor className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Auto</span>
              </label>
            </div>
          </div>

          {/* Layout Settings */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Layout Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  {...register('sidebarCollapsed')}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">Collapse sidebar by default</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  {...register('compactView')}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">Use compact view</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  {...register('highContrast')}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">High contrast mode</span>
              </label>
            </div>
          </div>

          {/* Localization */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Localization</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  {...register('language')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Currency
                </label>
                <select
                  {...register('currency')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date & Time Format */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Date & Time Format</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Format
                </label>
                <select
                  {...register('dateFormat')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {dateFormats.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Time Format
                </label>
                <select
                  {...register('timeFormat')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="12h">12 Hour (AM/PM)</option>
                  <option value="24h">24 Hour</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              type="submit"
              disabled={!isDirty || saveDisplayMutation.isLoading}
              className="flex items-center space-x-2"
            >
              {saveDisplayMutation.isLoading ? (
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