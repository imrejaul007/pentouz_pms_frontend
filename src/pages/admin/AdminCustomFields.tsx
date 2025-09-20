import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  FunnelIcon,
  CogIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import CustomFieldForm from '../../components/admin/CustomFieldForm';
import CustomFieldBuilder from '../../components/admin/CustomFieldBuilder';
import CustomFieldAnalytics from '../../components/admin/CustomFieldAnalytics';

interface CustomField {
  _id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'multiselect' | 'textarea' | 'email' | 'phone' | 'url';
  category: 'personal' | 'preferences' | 'contact' | 'business' | 'special' | 'other';
  description?: string;
  isRequired: boolean;
  isActive: boolean;
  isVisible: boolean;
  isEditable: boolean;
  validation: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  displayOrder: number;
  defaultValue?: string;
  helpText?: string;
  group?: string;
  tags: string[];
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const AdminCustomFields: React.FC = () => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    isActive: '',
    sortBy: 'displayOrder',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const fieldTypes = [
    { value: '', label: 'All Types' },
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'dropdown', label: 'Dropdown', icon: '📋' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { value: 'multiselect', label: 'Multi-select', icon: '☑️☑️' },
    { value: 'textarea', label: 'Text Area', icon: '📄' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'phone', label: 'Phone', icon: '📞' },
    { value: 'url', label: 'URL', icon: '🔗' }
  ];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'personal', label: 'Personal', color: 'bg-blue-100 text-blue-800' },
    { value: 'preferences', label: 'Preferences', color: 'bg-green-100 text-green-800' },
    { value: 'contact', label: 'Contact', color: 'bg-purple-100 text-purple-800' },
    { value: 'business', label: 'Business', color: 'bg-orange-100 text-orange-800' },
    { value: 'special', label: 'Special', color: 'bg-red-100 text-red-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];

  useEffect(() => {
    fetchCustomFields();
  }, [filters, pagination.current]);

  const fetchCustomFields = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', pagination.current.toString());
      queryParams.append('limit', '20');
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.isActive) queryParams.append('isActive', filters.isActive);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/v1/custom-fields?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch custom fields');
      }

      const data = await response.json();
      setCustomFields(data.data.customFields);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      toast.error('Failed to fetch custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingField(null);
    setShowForm(true);
  };

  const handleCreateWithBuilder = () => {
    setEditingField(null);
    setShowBuilder(true);
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom field? This will also delete all associated guest data.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/custom-fields/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete custom field');
      }

      toast.success('Custom field deleted successfully');
      fetchCustomFields();
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast.error('Failed to delete custom field');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/v1/custom-fields/export?format=csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export custom fields');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'custom_fields.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Custom fields exported successfully');
    } catch (error) {
      console.error('Error exporting custom fields:', error);
      toast.error('Failed to export custom fields');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/custom-fields/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to import custom fields');
      }

      const data = await response.json();
      toast.success(`Imported ${data.data.created} fields, updated ${data.data.updated} fields`);
      fetchCustomFields();
    } catch (error) {
      console.error('Error importing custom fields:', error);
      toast.error('Failed to import custom fields');
    }
  };

  const handleReorder = async (fieldId: string, direction: 'up' | 'down') => {
    try {
      const fieldIndex = customFields.findIndex(f => f._id === fieldId);
      if (fieldIndex === -1) return;

      const newOrder = [...customFields];
      const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

      if (targetIndex < 0 || targetIndex >= newOrder.length) return;

      // Swap display orders
      const tempOrder = newOrder[fieldIndex].displayOrder;
      newOrder[fieldIndex].displayOrder = newOrder[targetIndex].displayOrder;
      newOrder[targetIndex].displayOrder = tempOrder;

      // Update in backend
      const fieldOrders = newOrder.map(field => ({
        fieldId: field._id,
        displayOrder: field.displayOrder
      }));

      const response = await fetch('/api/v1/custom-fields/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ fieldOrders })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder fields');
      }

      setCustomFields(newOrder);
      toast.success('Field order updated successfully');
    } catch (error) {
      console.error('Error reordering fields:', error);
      toast.error('Failed to reorder fields');
    }
  };

  const handleSelectField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFields.length === customFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(customFields.map(field => field._id));
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingField(null);
  };

  const handleBuilderClose = () => {
    setShowBuilder(false);
    setEditingField(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setShowBuilder(false);
    setEditingField(null);
    fetchCustomFields();
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = fieldTypes.find(t => t.value === type);
    return typeConfig?.icon || '📝';
  };

  const getCategoryColor = (category: string) => {
    const categoryConfig = categories.find(c => c.value === category);
    return categoryConfig?.color || 'bg-gray-100 text-gray-800';
  };

  if (showForm) {
    return (
      <CustomFieldForm
        field={editingField}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (showBuilder) {
    return (
      <CustomFieldBuilder
        onClose={handleBuilderClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (showAnalytics) {
    return (
      <CustomFieldAnalytics
        onClose={() => setShowAnalytics(false)}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Fields Management</h1>
            <p className="text-gray-600">Create and manage custom fields for guest data collection</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAnalytics(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Analytics
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Export
            </button>
            <label className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              Import
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                className="hidden"
              />
            </label>
            <button
              onClick={handleCreateWithBuilder}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <CogIcon className="w-4 h-4 mr-2" />
              Field Builder
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Field
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search fields..."
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
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fieldTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="displayOrder">Display Order</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="category">Category</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ 
                  search: '', 
                  category: '', 
                  type: '',
                  isActive: '',
                  sortBy: 'displayOrder',
                  sortOrder: 'asc'
                })}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Fields Table */}
      <div className="bg-white shadow-sm rounded-lg border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading custom fields...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFields.length === customFields.length && customFields.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Properties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customFields.map((field, index) => (
                  <tr key={field._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field._id)}
                        onChange={() => handleSelectField(field._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleReorder(field._id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-900">
                          {field.displayOrder}
                        </span>
                        <button
                          onClick={() => handleReorder(field._id, 'down')}
                          disabled={index === customFields.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {field.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {field.name}
                        </div>
                        {field.description && (
                          <div className="text-xs text-gray-400 mt-1">
                            {field.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTypeIcon(field.type)}</span>
                        <span className="text-sm text-gray-900 capitalize">
                          {field.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(field.category)}`}>
                        {field.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {field.isRequired && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                        {field.isActive && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                        {field.isVisible && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Visible
                          </span>
                        )}
                        {field.isEditable && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Editable
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(field)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(field._id)}
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

        {!loading && customFields.length === 0 && (
          <div className="p-8 text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No custom fields found</p>
            <button
              onClick={handleCreate}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Create first custom field
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                disabled={pagination.current === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                disabled={pagination.current === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.current}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span> ({pagination.total} total fields)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                    disabled={pagination.current === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomFields;
