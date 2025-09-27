import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Building,
  Award,
  Heart,
  Shield,
  Users,
  Phone,
  CreditCard,
  PiggyBank,
  Briefcase,
  RefreshCw,
  Plus,
  TrendingUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import StaffDocumentUpload from '../../components/staff/StaffDocumentUpload';
import { toast } from 'sonner';

interface Document {
  _id: string;
  originalName: string;
  category: string;
  documentType: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired' | 'renewal_required';
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  expiresAt?: string;
  notes?: string;
  rejectionReason?: string;
  fileUrl: string;
  filePath: string;
  userType: string;
  departmentId?: {
    _id: string;
    name: string;
  };
  viewableByRoles: string[];
  metadata: {
    size: number;
    mimeType: string;
  };
}

interface DocumentStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  expired: number;
  renewalRequired: number;
}

const staffDocumentCategories = {
  employment_verification: { icon: Briefcase, label: 'Employment Verification' },
  id_proof: { icon: Shield, label: 'Identity Proof' },
  training_certificate: { icon: Award, label: 'Training & Certification' },
  health_certificate: { icon: Heart, label: 'Health Certificate' },
  background_check: { icon: Shield, label: 'Background Check' },
  work_permit: { icon: Building, label: 'Work Permit & Visa' },
  emergency_contact: { icon: Phone, label: 'Emergency Contact' },
  tax_document: { icon: CreditCard, label: 'Tax Documents' },
  bank_details: { icon: PiggyBank, label: 'Banking Information' }
};

export default function StaffDocuments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'documents'>('overview');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    expired: 0,
    renewalRequired: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/documents/my-documents?userType=staff', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        calculateStats(data.documents);
      } else {
        toast.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (docs: Document[]) => {
    const newStats = {
      total: docs.length,
      pending: docs.filter(d => d.status === 'pending').length,
      verified: docs.filter(d => d.status === 'verified').length,
      rejected: docs.filter(d => d.status === 'rejected').length,
      expired: docs.filter(d => d.status === 'expired').length,
      renewalRequired: docs.filter(d => d.status === 'renewal_required').length
    };
    setStats(newStats);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'renewal_required':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'renewal_required':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      const response = await fetch(`/api/v1/documents/${doc._id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        toast.error('Failed to view document');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Error opening document');
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await fetch(`/api/v1/documents/${doc._id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error downloading document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staffDocumentCategories[doc.category]?.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: string; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Documents</h1>
          <p className="text-gray-600 mt-1">Manage your employment and compliance documents</p>
        </div>
        <Button
          onClick={() => setActiveTab('upload')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        <TabButton tab="overview" label="Overview" icon={TrendingUp} />
        <TabButton tab="upload" label="Upload" icon={Upload} />
        <TabButton tab="documents" label="My Documents" icon={FileText} />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Renewal</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.renewalRequired}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-400" />
              </div>
            </Card>
          </div>

          {/* Recent Documents */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Documents</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('documents')}
              >
                View All
              </Button>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents uploaded yet</p>
                <Button
                  className="mt-4"
                  onClick={() => setActiveTab('upload')}
                >
                  Upload Your First Document
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.slice(0, 5).map(doc => {
                  const category = staffDocumentCategories[doc.category];
                  const Icon = category?.icon || FileText;

                  return (
                    <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-sm">{doc.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {category?.label} • {formatDate(doc.uploadedAt)} • {formatFileSize(doc.metadata.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(doc.status)}`}>
                          {doc.status.replace('_', ' ')}
                        </Badge>
                        {getStatusIcon(doc.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'upload' && (
        <StaffDocumentUpload />
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                  <option value="renewal_required">Renewal Required</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(staffDocumentCategories).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Documents List */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                My Documents ({filteredDocuments.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDocuments}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'No documents match your filters'
                    : 'No documents uploaded yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map(doc => {
                  const category = staffDocumentCategories[doc.category];
                  const Icon = category?.icon || FileText;

                  return (
                    <div key={doc._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="h-6 w-6 text-gray-600 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{doc.originalName}</h4>
                              <Badge className={`text-xs ${getStatusColor(doc.status)}`}>
                                {doc.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {category?.label}
                              {doc.departmentId && ` • ${doc.departmentId.name}`}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                              <span>Uploaded: {formatDate(doc.uploadedAt)}</span>
                              <span>•</span>
                              <span>Size: {formatFileSize(doc.metadata.size)}</span>
                              {doc.verifiedAt && (
                                <>
                                  <span>•</span>
                                  <span>Verified: {formatDate(doc.verifiedAt)}</span>
                                </>
                              )}
                              {doc.expiresAt && (
                                <>
                                  <span>•</span>
                                  <span>Expires: {formatDate(doc.expiresAt)}</span>
                                </>
                              )}
                            </div>
                            {doc.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                Note: {doc.notes}
                              </p>
                            )}
                            {doc.rejectionReason && (
                              <p className="text-sm text-red-600 mt-2">
                                Rejection reason: {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}