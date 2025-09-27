import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  Palette,
  Monitor,
  Sun,
  Moon,
  Globe,
  Zap,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';

interface StaffDisplayFormData {
  theme: 'light' | 'dark';
  compactView: boolean;
  language: string;
  quickActions: string[];
}

interface StaffDisplaySettingsProps {
  onSettingsChange?: (hasChanges: boolean) => void;
}

export default function StaffDisplaySettings({ onSettingsChange }: StaffDisplaySettingsProps = {}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty }
  } = useForm<StaffDisplayFormData>({
    defaultValues: {
      theme: 'light',
      compactView: false,
      language: 'en',
      quickActions: ['daily-check', 'guest-request']
    }
  });

  const watchedValues = watch();

  // Watch for form changes
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(isDirty);
    }
  }, [isDirty, onSettingsChange]);

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'hi', label: 'Hindi' }
  ];

  const availableQuickActions = [
    { id: 'daily-check', label: 'Daily Room Check', icon: '🛏️' },
    { id: 'guest-request', label: 'Guest Request', icon: '👤' },
    { id: 'maintenance', label: 'Report Issue', icon: '🔧' },
    { id: 'inventory', label: 'Inventory Check', icon: '📦' },
    { id: 'housekeeping', label: 'Housekeeping Task', icon: '🧹' }
  ];

  // Save display settings mutation
  const saveDisplayMutation = useMutation({
    mutationFn: async (data: StaffDisplayFormData) => {
      const response = await fetch('/api/v1/staff/display-preferences', {
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
      if (onSettingsChange) {
        onSettingsChange(false);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update display settings');
    }
  });

  const onSubmit = (data: StaffDisplayFormData) => {
    saveDisplayMutation.mutate(data);
  };

  const handleQuickActionToggle = (actionId: string) => {
    const currentActions = watchedValues.quickActions || [];
    const newActions = currentActions.includes(actionId)
      ? currentActions.filter(id => id !== actionId)
      : [...currentActions, actionId];
    setValue('quickActions', newActions, { shouldDirty: true });
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Display Settings</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize the appearance and layout of your workspace
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Theme Settings */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span>Theme</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`
                p-4 border-2 rounded-lg cursor-pointer transition-colors flex items-center space-x-3
                ${watchedValues.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
              `}>
                <input
                  {...register('theme')}
                  type="radio"
                  value="light"
                  className="sr-only"
                />
                <Sun className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="font-medium text-gray-900">Light Theme</p>
                  <p className="text-sm text-gray-500">Best for daytime work</p>
                </div>
              </label>

              <label className={`
                p-4 border-2 rounded-lg cursor-pointer transition-colors flex items-center space-x-3
                ${watchedValues.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
              `}>
                <input
                  {...register('theme')}
                  type="radio"
                  value="dark"
                  className="sr-only"
                />
                <Moon className="h-6 w-6 text-gray-700" />
                <div>
                  <p className="font-medium text-gray-900">Dark Theme</p>
                  <p className="text-sm text-gray-500">Easier on the eyes</p>
                </div>
              </label>
            </div>
          </div>

          {/* Layout Preferences */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Layout Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  {...register('compactView')}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900">Compact View</span>
                <span className="text-sm text-gray-500">- Show more information in less space</span>
              </label>
            </div>
          </div>

          {/* Language */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Language</span>
            </h3>
            <select
              {...register('language')}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Quick Action Buttons</span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose which quick action buttons to display on your dashboard
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableQuickActions.map(action => (
                <label key={action.id} className={`
                  flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors
                  ${(watchedValues.quickActions || []).includes(action.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                  }
                `}>
                  <input
                    type="checkbox"
                    checked={(watchedValues.quickActions || []).includes(action.id)}
                    onChange={() => handleQuickActionToggle(action.id)}
                    className="sr-only"
                  />
                  <span className="text-lg">{action.icon}</span>
                  <span className="font-medium text-gray-900">{action.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
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