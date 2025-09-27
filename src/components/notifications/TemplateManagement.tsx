import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Copy,
  Play,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Bell,
  Smartphone,
  MessageSquare,
  Eye
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { TemplateEditor } from './TemplateEditor';

interface NotificationTemplate {
  _id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  subject: string;
  title: string;
  message: string;
  channels: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  variables: any[];
  routing: {
    targetRoles: string[];
    departments?: string[];
  };
  usage: {
    timesUsed: number;
    lastUsed?: Date;
    avgDeliveryRate: number;
    avgReadRate: number;
  };
  metadata: {
    isSystem: boolean;
    version: number;
    isActive: boolean;
    createdBy?: any;
    updatedBy?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateManagementProps {
  className?: string;
}

export const TemplateManagement: React.FC<TemplateManagementProps> = ({
  className = ''
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch templates
  const { data: templatesData, isLoading, error } = useQuery({
    queryKey: ['notification-templates', page, searchQuery, categoryFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await apiRequest(`/api/v1/notifications/templates?${params}`);
      return response.data;
    },
    staleTime: 30000
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest(`/api/v1/notifications/templates/${templateId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    }
  });

  // Initialize templates mutation
  const initializeTemplatesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/v1/notifications/templates/initialize', {
        method: 'POST'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    }
  });

  const handleEditTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowEditor(true);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(undefined);
    setShowEditor(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleInitializeTemplates = () => {
    if (window.confirm('This will create default system templates for your hotel. Continue?')) {
      initializeTemplatesMutation.mutate();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-3 h-3" />;
      case 'in_app': return <Bell className="w-3 h-3" />;
      case 'push': return <Smartphone className="w-3 h-3" />;
      case 'sms': return <MessageSquare className="w-3 h-3" />;
      case 'browser': return <Eye className="w-3 h-3" />;
      default: return <Bell className="w-3 h-3" />;
    }
  };

  const categories = [
    'booking', 'payment', 'service', 'maintenance', 'inventory',
    'system', 'security', 'promotional', 'emergency', 'staff',
    'guest_experience', 'loyalty', 'review'
  ];

  const templates = templatesData?.templates || [];
  const pagination = templatesData?.pagination || {};
  const hasPermission = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>
          <p className="text-gray-600">Create and manage notification templates</p>
        </div>

        <div className="flex items-center gap-3">
          {hasPermission && templates.length === 0 && (
            <button
              onClick={handleInitializeTemplates}
              disabled={initializeTemplatesMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {initializeTemplatesMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              Initialize Templates
            </button>
          )}

          {hasPermission && (
            <button
              onClick={handleCreateTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('');
                setTypeFilter('');
                setPage(1);
              }}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="flex items-center gap-4">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="w-6 h-6 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Templates</h3>
            <p className="text-gray-600">Failed to load notification templates</p>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter ? 'No templates match your filters' : 'Get started by creating your first template'}
            </p>
            {hasPermission && !searchQuery && !categoryFilter && (
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleInitializeTemplates}
                  disabled={initializeTemplatesMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {initializeTemplatesMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  Initialize Default Templates
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Template
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {templates.map((template: NotificationTemplate) => (
              <div key={template._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {template.name}
                      </h3>

                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(template.priority)}`}>
                        {template.priority}
                      </span>

                      {template.metadata.isSystem && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          System
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.description || 'No description provided'}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Category:</span>
                        <span className="capitalize">
                          {template.category.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-medium">Type:</span>
                        <span className="capitalize">
                          {template.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Channels:</span>
                        <div className="flex items-center gap-1">
                          {template.channels.slice(0, 3).map((channel, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center"
                              title={channel}
                            >
                              {getChannelIcon(channel)}
                            </div>
                          ))}
                          {template.channels.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{template.channels.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-medium">Variables:</span>
                        <span>{template.variables?.length || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>Used {template.usage.timesUsed} times</span>
                      </div>

                      {template.usage.avgDeliveryRate > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>{template.usage.avgDeliveryRate.toFixed(1)}% delivery</span>
                        </div>
                      )}

                      {template.usage.avgReadRate > 0 && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{template.usage.avgReadRate.toFixed(1)}% read</span>
                        </div>
                      )}

                      {template.usage.lastUsed && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Last used {new Date(template.usage.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasPermission && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditTemplate(template._id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit template"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!template.metadata.isSystem && (
                        <button
                          onClick={() => handleDeleteTemplate(template._id)}
                          disabled={deleteTemplateMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} templates
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <TemplateEditor
          templateId={selectedTemplate}
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setSelectedTemplate(undefined);
          }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
          }}
        />
      )}
    </div>
  );
};

export default TemplateManagement;