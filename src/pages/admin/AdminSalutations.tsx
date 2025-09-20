import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import SalutationForm from '../../components/admin/SalutationForm';
import SalutationStats from '../../components/admin/SalutationStats';

interface Salutation {
  _id: string;
  title: string;
  fullForm?: string;
  category: 'personal' | 'professional' | 'religious' | 'cultural' | 'academic';
  gender: 'male' | 'female' | 'neutral' | 'any';
  language: string;
  region?: string;
  sortOrder: number;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AdminSalutations: React.FC = () => {
  const [salutations, setSalutations] = useState<Salutation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSalutation, setEditingSalutation] = useState<Salutation | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    gender: '',
    isActive: '',
    search: ''
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'personal', label: 'Personal' },
    { value: 'professional', label: 'Professional' },
    { value: 'religious', label: 'Religious' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'academic', label: 'Academic' }
  ];

  const genders = [
    { value: '', label: 'All Genders' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'any', label: 'Any' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];

  useEffect(() => {
    fetchSalutations();
  }, [filters]);

  const fetchSalutations = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.gender) queryParams.append('gender', filters.gender);
      if (filters.isActive) queryParams.append('isActive', filters.isActive);

      const response = await fetch(`/api/salutations?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch salutations');
      }

      const data = await response.json();
      let filteredSalutations = data.data.salutations;

      // Client-side search filter
      if (filters.search) {
        filteredSalutations = filteredSalutations.filter((sal: Salutation) =>
          sal.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          (sal.fullForm && sal.fullForm.toLowerCase().includes(filters.search.toLowerCase()))
        );
      }

      setSalutations(filteredSalutations);
    } catch (error) {
      console.error('Error fetching salutations:', error);
      toast.error('Failed to fetch salutations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSalutation(null);
    setShowForm(true);
  };

  const handleEdit = (salutation: Salutation) => {
    setEditingSalutation(salutation);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this salutation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/salutations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete salutation');
      }

      toast.success('Salutation deleted successfully');
      fetchSalutations();
    } catch (error) {
      console.error('Error deleting salutation:', error);
      toast.error('Failed to delete salutation');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/salutations/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle salutation status');
      }

      toast.success(`Salutation ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchSalutations();
    } catch (error) {
      console.error('Error toggling salutation status:', error);
      toast.error('Failed to toggle salutation status');
    }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm('This will create default salutations. Continue?')) {
      return;
    }

    try {
      const response = await fetch('/api/salutations/seed-defaults', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to seed default salutations');
      }

      const data = await response.json();
      toast.success(`Created ${data.data.count} default salutations`);
      fetchSalutations();
    } catch (error) {
      console.error('Error seeding default salutations:', error);
      toast.error('Failed to seed default salutations');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSalutation(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSalutation(null);
    fetchSalutations();
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-800',
      professional: 'bg-green-100 text-green-800',
      religious: 'bg-purple-100 text-purple-800',
      cultural: 'bg-orange-100 text-orange-800',
      academic: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getGenderColor = (gender: string) => {
    const colors = {
      male: 'bg-blue-100 text-blue-800',
      female: 'bg-pink-100 text-pink-800',
      neutral: 'bg-gray-100 text-gray-800',
      any: 'bg-yellow-100 text-yellow-800'
    };
    return colors[gender as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (showForm) {
    return (
      <SalutationForm
        salutation={editingSalutation}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (showStats) {
    return (
      <SalutationStats
        onClose={() => setShowStats(false)}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salutations Management</h1>
            <p className="text-gray-600">Manage guest salutations and titles</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowStats(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Statistics
            </button>
            <button
              onClick={handleSeedDefaults}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Seed Defaults
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Salutation
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search salutations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {genders.map(gender => (
                  <option key={gender.value} value={gender.value}>{gender.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ category: '', gender: '', isActive: '', search: '' })}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Salutations Table */}
      <div className="bg-white shadow-sm rounded-lg border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading salutations...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Form
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language/Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salutations.map((salutation) => (
                  <tr key={salutation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {salutation.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {salutation.fullForm || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(salutation.category)}`}>
                        {salutation.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGenderColor(salutation.gender)}`}>
                        {salutation.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {salutation.language}
                      {salutation.region && ` (${salutation.region})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(salutation._id, salutation.isActive)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          salutation.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {salutation.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(salutation)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(salutation._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && salutations.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500">No salutations found</p>
            <button
              onClick={handleCreate}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Create your first salutation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalutations;
