import React, { useState, useCallback, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  isExpiring?: boolean;
  isExpired?: boolean;
}

interface DocumentRequirement {
  _id: string;
  category: string;
  documentType: string;
  isMandatory: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  displaySettings: {
    title: string;
    description: string;
    helpText?: string;
    examples?: string[];
  };
  validationRules: {
    allowedFileTypes: string[];
    maxFileSize: number;
  };
}

interface DocumentUploadProps {
  bookingId?: string;
  userType?: 'guest' | 'staff';
  onDocumentUploaded?: (document: Document) => void;
  className?: string;
}

const GUEST_DOCUMENT_CATEGORIES = [
  { value: 'identity_proof', label: 'Identity Proof' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'travel_document', label: 'Travel Document' },
  { value: 'visa', label: 'Visa' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'booking_related', label: 'Booking Related' },
  { value: 'payment_proof', label: 'Payment Proof' }
];

export default function DocumentUpload({
  bookingId,
  userType = 'guest',
  onDocumentUploaded,
  className = ''
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [showRequirements, setShowRequirements] = useState(false);

  // Fetch document requirements on component mount
  useEffect(() => {
    fetchDocumentRequirements();
    fetchUserDocuments();
  }, [userType, bookingId]);

  const fetchDocumentRequirements = async () => {
    try {
      const response = await fetch(`/api/v1/documents/requirements/${userType}?bookingType=${bookingId ? 'direct' : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequirements(data.data.requirements);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
    }
  };

  const fetchUserDocuments = async () => {
    try {
      let url = `/api/v1/documents?userType=${userType}`;
      if (bookingId) {
        url += `&bookingId=${bookingId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input value to allow uploading same file again
    e.target.value = '';
  }, []);

  const handleFiles = async (files: FileList) => {
    if (!selectedCategory || !selectedDocumentType) {
      toast.error('Please select document category and type before uploading');
      return;
    }

    const file = files[0];

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('category', selectedCategory);
      formData.append('documentType', selectedDocumentType);
      formData.append('description', description);
      formData.append('userType', userType);
      formData.append('priority', 'medium');

      if (bookingId) {
        formData.append('bookingId', bookingId);
      }

      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }

      const data = await response.json();
      const newDocument = data.data.document;

      setDocuments(prev => [newDocument, ...prev]);

      // Clear form
      setSelectedCategory('');
      setSelectedDocumentType('');
      setDescription('');

      toast.success('Document uploaded successfully');

      if (onDocumentUploaded) {
        onDocumentUploaded(newDocument);
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const validateFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed. Please upload JPEG, PNG, WebP, or PDF files.`
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds the maximum limit of 10MB.`
      };
    }

    return { isValid: true };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'expired':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      case 'renewal_required':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'expired':
        return 'text-orange-600 bg-orange-50';
      case 'renewal_required':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        toast.error('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        toast.success('Document deleted successfully');
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getMandatoryRequirements = () => {
    return requirements.filter(req => req.isMandatory);
  };

  const getOptionalRequirements = () => {
    return requirements.filter(req => !req.isMandatory);
  };

  const getCompletionStatus = () => {
    const mandatoryReqs = getMandatoryRequirements();
    const completedMandatory = mandatoryReqs.filter(req =>
      documents.some(doc => doc.category === req.category && doc.status === 'verified')
    );

    return {
      mandatoryTotal: mandatoryReqs.length,
      mandatoryCompleted: completedMandatory.length,
      isComplete: completedMandatory.length === mandatoryReqs.length
    };
  };

  const status = getCompletionStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with completion status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
          <p className="text-gray-600">Upload your required documents for verification</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.isComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {status.mandatoryCompleted}/{status.mandatoryTotal} Required Documents
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowRequirements(!showRequirements)}
          >
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            Requirements
          </Button>
        </div>
      </div>

      {/* Requirements Panel */}
      {showRequirements && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Document Requirements</h3>

          {getMandatoryRequirements().length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-blue-800 mb-2">Required Documents</h4>
              <div className="space-y-2">
                {getMandatoryRequirements().map(req => (
                  <div key={req._id} className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">{req.displaySettings.title}</p>
                      <p className="text-sm text-blue-700">{req.displaySettings.description}</p>
                      {req.displaySettings.examples && req.displaySettings.examples.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Examples: {req.displaySettings.examples.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {getOptionalRequirements().length > 0 && (
            <div>
              <h4 className="text-md font-medium text-blue-800 mb-2">Optional Documents</h4>
              <div className="space-y-2">
                {getOptionalRequirements().map(req => (
                  <div key={req._id} className="flex items-start space-x-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">{req.displaySettings.title}</p>
                      <p className="text-sm text-blue-700">{req.displaySettings.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Upload Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h3>

        {/* Document Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Category *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select category...</option>
              {GUEST_DOCUMENT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type *
            </label>
            <input
              type="text"
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              placeholder="e.g., Passport, Driver's License, Utility Bill"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any additional notes about this document..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Drag & Drop Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Uploading document...</p>
              <p className="text-sm text-gray-600">Please wait while we process your file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your document here, or click to browse
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Supports PDF, JPEG, PNG, and WebP files up to 10MB
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={() => document.getElementById('fileInput')?.click()}
                disabled={!selectedCategory || !selectedDocumentType}
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Choose File
              </Button>

              <input
                id="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileInput}
                className="hidden"
              />

              <p className="text-xs text-gray-500 mt-4">
                Your documents are encrypted and securely stored
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Documents ({documents.length})
          </h3>

          <div className="space-y-4">
            {documents.map(document => (
              <div key={document._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <DocumentTextIcon className="w-8 h-8 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{document.originalName}</h4>
                    <p className="text-sm text-gray-600">
                      {document.documentType} • {formatFileSize(document.fileSize)} •
                      {new Date(document.createdAt).toLocaleDateString()}
                    </p>
                    {document.description && (
                      <p className="text-sm text-gray-500 mt-1">{document.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
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
                    variant="danger"
                    size="sm"
                    onClick={() => deleteDocument(document._id)}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}