import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle,
  XCircle,
  Coffee,
  UserX,
  Bell,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';

interface StaffAvailabilityFormData {
  status: 'available' | 'busy' | 'break' | 'offline';
  autoStatusChange: boolean;
  breakReminder: boolean;
  breakDuration: number;
  maxTasksPerHour: number;
}

interface StaffAvailabilitySettingsProps {
  onSettingsChange?: (hasChanges: boolean) => void;
}

export default function StaffAvailabilitySettings({ onSettingsChange }: StaffAvailabilitySettingsProps = {}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty }
  } = useForm<StaffAvailabilityFormData>({
    defaultValues: {
      status: 'available',
      autoStatusChange: true,
      breakReminder: true,
      breakDuration: 15,
      maxTasksPerHour: 8
    }
  });

  const watchedValues = watch();

  // Watch for form changes
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(isDirty);
    }
  }, [isDirty, onSettingsChange]);

  // Save availability settings mutation
  const saveAvailabilityMutation = useMutation({
    mutationFn: async (data: StaffAvailabilityFormData) => {
      const response = await fetch('/api/v1/staff/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update availability settings');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Availability settings updated successfully');
      if (onSettingsChange) {
        onSettingsChange(false);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update availability settings');
    }
  });

  const onSubmit = (data: StaffAvailabilityFormData) => {
    saveAvailabilityMutation.mutate(data);
  };

  const statusOptions = [
    {
      value: 'available',
      label: 'Available',
      description: 'Ready to take on new tasks',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      value: 'busy',
      label: 'Busy',
      description: 'Currently working on tasks',
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      value: 'break',
      label: 'On Break',
      description: 'Taking a scheduled break',
      icon: Coffee,
      color: 'text-blue-600'
    },
    {
      value: 'offline',
      label: 'Offline',
      description: 'Not available for new assignments',
      icon: UserX,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Availability Settings</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your work status and availability preferences
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Current Status */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Current Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statusOptions.map(option => {
                const Icon = option.icon;
                const isSelected = watchedValues.status === option.value;

                return (
                  <label key={option.value} className={`
                    p-4 border-2 rounded-lg cursor-pointer transition-colors
                    ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
                  `}>
                    <input
                      {...register('status')}
                      type="radio"
                      value={option.value}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-6 w-6 ${option.color}`} />
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Automatic Status Management */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Automatic Status Management</h3>
            <div className="space-y-4">
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  {...register('autoStatusChange')}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Auto Status Change</p>
                  <p className="text-sm text-gray-500">
                    Automatically update status based on task completion and work patterns
                  </p>
                </div>
              </label>

              {watchedValues.autoStatusChange && (
                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Tasks Per Hour
                    </label>
                    <input
                      {...register('maxTasksPerHour', { min: 1, max: 20 })}
                      type="number"
                      min="1"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      System will mark you as busy when this limit is reached
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Break Settings */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Coffee className="h-4 w-4" />
              <span>Break Settings</span>
            </h3>
            <div className="space-y-4">
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  {...register('breakReminder')}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Break Reminders</p>
                  <p className="text-sm text-gray-500">
                    Get reminded to take breaks after continuous work periods
                  </p>
                </div>
              </label>

              {watchedValues.breakReminder && (
                <div className="ml-6">
                  <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Bell className="h-4 w-4 inline mr-1" />
                      Break Duration (minutes)
                    </label>
                    <select
                      {...register('breakDuration')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Hours Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Work Hours Information</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Today's Status:</span>
                <span className="ml-2 text-green-600">On Shift</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Hours Worked:</span>
                <span className="ml-2 text-gray-900">6h 30m</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tasks Completed:</span>
                <span className="ml-2 text-gray-900">12</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Next Break:</span>
                <span className="ml-2 text-gray-900">In 45 minutes</span>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your status affects task assignments and guest service routing</li>
              <li>• Emergency situations may override availability settings</li>
              <li>• Regular breaks improve work quality and job satisfaction</li>
              <li>• Managers can view staff availability for better scheduling</li>
            </ul>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              type="submit"
              disabled={!isDirty || saveAvailabilityMutation.isLoading}
              className="flex items-center space-x-2"
            >
              {saveAvailabilityMutation.isLoading ? (
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