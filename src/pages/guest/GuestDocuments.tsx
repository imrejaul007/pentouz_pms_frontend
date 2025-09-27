import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  FolderIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DocumentUpload from '@/components/guest/DocumentUpload';
import { toast } from 'react-hot-toast';

interface Document {
  _id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  category: string;
  documentType: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired' | 'renewal_required';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  expiryDate?: string;
  verificationDetails?: {
    verifiedBy?: {
      name: string;
      email: string;
    };
    verifiedAt?: string;
    comments?: string;
    rejectionReason?: string;
  };
  bookingId?: {
    _id: string;
    bookingNumber: string;
    checkIn: string;
    checkOut: string;
  };
  isExpiring?: boolean;
  isExpired?: boolean;
}

interface Booking {
  _id: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

const CATEGORY_ICONS: { [key: string]: React.ComponentType<any> } = {
  identity_proof: DocumentTextIcon,
  address_proof: FolderIcon,
  travel_document: DocumentTextIcon,
  visa: DocumentTextIcon,
  certificate: DocumentTextIcon,
  booking_related: FolderIcon,
  payment_proof: DocumentTextIcon
};

const CATEGORY_LABELS: { [key: string]: string } = {
  identity_proof: 'Identity Proof',
  address_proof: 'Address Proof',
  travel_document: 'Travel Document',
  visa: 'Visa',
  certificate: 'Certificate',
  booking_related: 'Booking Related',
  payment_proof: 'Payment Proof'
};

export default function GuestDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'documents'>('overview');

  useEffect(() => {
    fetchDocuments();
    fetchBookings();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/v1/documents?userType=guest', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data.documents);
      } else {
        toast.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/v1/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleDocumentUploaded = (newDocument: Document) => {
    setDocuments(prev => [newDocument, ...prev]);
    setActiveTab('documents');
  };

  const getFilteredDocuments = () => {
    return documents.filter(doc => {
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
      const matchesBooking = selectedBooking === 'all' ||
        (selectedBooking === 'no_booking' && !doc.bookingId) ||
        (doc.bookingId && doc.bookingId._id === selectedBooking);
      const matchesSearch = searchTerm === '' ||
        doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesStatus && matchesBooking && matchesSearch;
    });
  };

  const getDocumentStats = () => {
    const total = documents.length;
    const verified = documents.filter(doc => doc.status === 'verified').length;
    const pending = documents.filter(doc => doc.status === 'pending').length;
    const rejected = documents.filter(doc => doc.status === 'rejected').length;
    const expiring = documents.filter(doc => doc.isExpiring).length;
    const expired = documents.filter(doc => doc.isExpired).length;

    return { total, verified, pending, rejected, expiring, expired };
  };

  const getCategoryStats = () => {
    const categories = Object.keys(CATEGORY_LABELS);
    return categories.map(category => {
      const categoryDocs = documents.filter(doc => doc.category === category);
      return {
        category,
        label: CATEGORY_LABELS[category],
        count: categoryDocs.length,
        verified: categoryDocs.filter(doc => doc.status === 'verified').length,
        pending: categoryDocs.filter(doc => doc.status === 'pending').length
      };
    }).filter(stat => stat.count > 0);
  };

  const downloadDocument = async (document: Document) => {
    try {
      const response = await fetch(`/api/v1/documents/${document._id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Document downloaded successfully');
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const viewDocument = async (document: Document) => {
    try {
      const response = await fetch(`/api/v1/documents/${document._id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } else {
        toast.error('Failed to view document');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'expired':
      case 'renewal_required':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'expired':
      case 'renewal_required':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = getDocumentStats();
  const categoryStats = getCategoryStats();
  const filteredDocuments = getFilteredDocuments();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-600 mt-2">
          Manage your uploaded documents and track verification status
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: FolderIcon },
            { id: 'upload', label: 'Upload Documents', icon: DocumentTextIcon },
            { id: 'documents', label: 'All Documents', icon: DocumentTextIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Expiring</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-700" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Category Breakdown */}
          {categoryStats.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents by Category</h3>
              <div className="space-y-4">
                {categoryStats.map(stat => {
                  const IconComponent = CATEGORY_ICONS[stat.category] || DocumentTextIcon;
                  return (
                    <div key={stat.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-6 h-6 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{stat.label}</p>
                          <p className="text-sm text-gray-600">{stat.count} document(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-600">{stat.verified}</p>
                          <p className="text-xs text-gray-500">Verified</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-yellow-600">{stat.pending}</p>
                          <p className="text-xs text-gray-500">Pending</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recent Documents */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Documents</h3>
              <Button
                variant="secondary"
                onClick={() => setActiveTab('documents')}
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {documents.slice(0, 5).map(document => (
                <div key={document._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{document.originalName}</p>
                      <p className="text-sm text-gray-600">
                        {CATEGORY_LABELS[document.category]} • {new Date(document.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(document.status)}`}>
                    {getStatusIcon(document.status)}
                    <span className="capitalize">{document.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <DocumentUpload
          userType="guest"
          onDocumentUploaded={handleDocumentUploaded}
        />
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="renewal_required">Renewal Required</option>
              </select>

              <select
                value={selectedBooking}
                onChange={(e) => setSelectedBooking(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Bookings</option>
                <option value="no_booking">Not Linked to Booking</option>
                {bookings.map(booking => (
                  <option key={booking._id} value={booking._id}>
                    {booking.bookingNumber}
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-2 flex-1 min-w-64">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Documents List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Documents ({filteredDocuments.length})
              </h3>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No documents found</p>
                <p className="text-gray-600 mb-4">
                  {documents.length === 0
                    ? "You haven't uploaded any documents yet."
                    : "No documents match your current filters."
                  }
                </p>
                <Button onClick={() => setActiveTab('upload')}>
                  Upload Your First Document
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map(document => (
                  <div key={document._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <DocumentTextIcon className="w-8 h-8 text-gray-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{document.originalName}</h4>
                          <p className="text-sm text-gray-600">
                            {CATEGORY_LABELS[document.category]} • {document.documentType} •
                            {formatFileSize(document.fileSize)} •
                            {new Date(document.createdAt).toLocaleDateString()}
                          </p>
                          {document.description && (
                            <p className="text-sm text-gray-500 mt-1">{document.description}</p>
                          )}
                          {document.bookingId && (
                            <p className="text-sm text-blue-600 mt-1">
                              Linked to booking: {document.bookingId.bookingNumber}
                            </p>
                          )}
                          {document.verificationDetails?.rejectionReason && (
                            <p className="text-sm text-red-600 mt-1">
                              Rejection reason: {document.verificationDetails.rejectionReason}
                            </p>
                          )}
                          {document.verificationDetails?.comments && document.status === 'verified' && (
                            <p className="text-sm text-green-600 mt-1">
                              Verification notes: {document.verificationDetails.comments}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(document.status)}`}>
                          {getStatusIcon(document.status)}
                          <span className="capitalize">{document.status.replace('_', ' ')}</span>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => viewDocument(document)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadDocument(document)}
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}