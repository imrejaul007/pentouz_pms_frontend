import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

interface PrivacyFormData {
  dataSharing: boolean;
  locationTracking: boolean;
  analyticsTracking: boolean;
  marketingEmails: boolean;
  thirdPartySharing: boolean;
  profileVisibility: boolean;
  bookingHistoryVisibility: boolean;
  personalizedExperience: boolean;
}

interface DataDownloadRequest {
  requestDate: string;
  status: 'pending' | 'processing' | 'ready' | 'expired';
  downloadUrl?: string;
}

const PrivacySettings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dataDownloadRequest, setDataDownloadRequest] = useState<DataDownloadRequest | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PrivacyFormData>();

  useEffect(() => {
    // Load existing privacy settings
    if (user?.privacy) {
      setValue('dataSharing', user.privacy.dataSharing || false);
      setValue('locationTracking', user.privacy.locationTracking || false);
      setValue('analyticsTracking', user.privacy.analyticsTracking || true);
      setValue('marketingEmails', user.privacy.marketingEmails || false);
      setValue('thirdPartySharing', user.privacy.thirdPartySharing || false);
      setValue('profileVisibility', user.privacy.profileVisibility || false);
      setValue('bookingHistoryVisibility', user.privacy.bookingHistoryVisibility || true);
      setValue('personalizedExperience', user.privacy.personalizedExperience || true);
    }

    // Check for existing data download requests
    fetchDataDownloadRequest();
  }, [user, setValue]);

  const fetchDataDownloadRequest = async () => {
    try {
      const response = await fetch('/api/v1/settings/privacy/data-request', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDataDownloadRequest(data.request);
      }
    } catch (error) {
      console.error('Failed to fetch data download request:', error);
    }
  };

  const onSubmit = async (data: PrivacyFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/settings/guest/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          privacy: data
        })
      });

      if (!response.ok) throw new Error('Failed to update privacy settings');

      showToast('Privacy settings updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update privacy settings', 'error');
      console.error('Privacy settings update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestDataDownload = async () => {
    try {
      const response = await fetch('/api/v1/settings/privacy/request-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to request data download');

      const data = await response.json();
      setDataDownloadRequest(data.request);
      showToast('Data download request submitted successfully', 'success');
    } catch (error) {
      showToast('Failed to request data download', 'error');
      console.error('Data download request error:', error);
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await fetch('/api/v1/settings/privacy/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete account');

      showToast('Account deletion request submitted', 'success');
      setShowDeleteModal(false);
      // Redirect to logout or confirmation page
    } catch (error) {
      showToast('Failed to delete account', 'error');
      console.error('Account deletion error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Settings</h1>
        <p className="text-gray-600">Control how your data is collected, used, and shared</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Data Collection */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Data Collection Preferences
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Analytics & Usage Data
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Help improve our services by sharing anonymous usage statistics and analytics data.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  {...register('analyticsTracking')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Location Tracking
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Allow us to collect your location data to provide location-based services and recommendations.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  {...register('locationTracking')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Personalized Experience
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Use your data to personalize your experience and provide tailored recommendations.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  {...register('personalizedExperience')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Sharing */}
        <div className="bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Data Sharing Preferences
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Third-Party Data Sharing
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Allow sharing of anonymized data with trusted third-party partners for research and improvement purposes.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  {...register('thirdPartySharing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Marketing Communications
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Receive marketing emails, special offers, and promotional content based on your preferences.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  {...register('marketingEmails')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Profile Visibility */}
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Profile Visibility
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Public Profile Visibility
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Make your basic profile information visible to other guests and hotel staff.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  {...register('profileVisibility')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Booking History Visibility
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Allow hotel staff to access your booking history to provide better personalized service.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  {...register('bookingHistoryVisibility')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Privacy Settings'}
          </button>
        </div>
      </form>

      {/* Data Management */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Management</h2>

        <div className="space-y-6">
          {/* Download Data */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Your Data
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Request a copy of all personal data we have collected about you.
            </p>

            {dataDownloadRequest ? (
              <div className="bg-white rounded-md p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Status: <span className="capitalize">{dataDownloadRequest.status}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Requested: {new Date(dataDownloadRequest.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  {dataDownloadRequest.status === 'ready' && dataDownloadRequest.downloadUrl && (
                    <a
                      href={dataDownloadRequest.downloadUrl}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={requestDataDownload}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Request Data Download
              </button>
            )}
          </div>

          {/* Delete Account */}
          <div className="bg-red-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Account Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete your account? This action is permanent and cannot be undone.
              All your data, bookings, and preferences will be permanently removed.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySettings;