import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  User,
  Camera,
  Save,
  Loader2,
  Phone,
  Mail,
  Badge,
  Building
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

interface StaffProfileFormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  employeeId: string;
  avatar?: string;
}

interface StaffProfileSettingsProps {
  onSettingsChange?: (hasChanges: boolean) => void;
}

export default function StaffProfileSettings({ onSettingsChange }: StaffProfileSettingsProps = {}) {
  const { user } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<StaffProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || 'Housekeeping',
      employeeId: user?.employeeId || '',
      avatar: user?.avatar || ''
    }
  });

  // Watch for form changes
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(isDirty);
    }
  }, [isDirty, onSettingsChange]);

  // Departments list
  const departments = [
    { value: 'Housekeeping', label: 'Housekeeping' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Front Desk', label: 'Front Desk' },
    { value: 'Guest Services', label: 'Guest Services' },
    { value: 'Kitchen', label: 'Kitchen' },
    { value: 'Security', label: 'Security' },
    { value: 'Management', label: 'Management' }
  ];

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: StaffProfileFormData) => {
      // Mock API call - replace with actual API endpoint
      const response = await fetch('/api/v1/staff/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      if (onSettingsChange) {
        onSettingsChange(false);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });

  const onSubmit = (data: StaffProfileFormData) => {
    saveProfileMutation.mutate(data);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const response = await fetch('/api/v1/upload/avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload avatar');
        }

        const data = await response.json();
        setValue('avatar', data.data.avatarUrl, { shouldDirty: true });

        // Update localStorage immediately
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const updatedUser = { ...parsedUser, avatar: data.data.avatarUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (e) {
            console.error('Failed to update stored user:', e);
          }
        }

        toast.success('Avatar uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload avatar');
        console.error('Avatar upload error:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Staff Profile</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your personal information and work details
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || (user?.avatar?.startsWith('/') ? `${window.location.origin}${user.avatar}` : user?.avatar)}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Camera className="h-3 w-3 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profile Picture</p>
              <p className="text-xs text-gray-500">
                Upload a new profile picture (JPG, PNG up to 2MB)
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Full Name
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email format'
                  }
                })}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Badge className="h-4 w-4 inline mr-1" />
                Employee ID
              </label>
              <input
                {...register('employeeId', { required: 'Employee ID is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.employeeId && (
                <p className="text-red-500 text-xs mt-1">{errors.employeeId.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-1" />
                Department
              </label>
              <select
                {...register('department', { required: 'Department is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>
              )}
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Work Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <span className="ml-2 text-gray-900 capitalize">{user?.role}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Hotel:</span>
                  <span className="ml-2 text-gray-900">{user?.hotelName || 'THE PENTOUZ Hotel'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Join Date:</span>
                  <span className="ml-2 text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              type="submit"
              disabled={!isDirty || saveProfileMutation.isLoading}
              className="flex items-center space-x-2"
            >
              {saveProfileMutation.isLoading ? (
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