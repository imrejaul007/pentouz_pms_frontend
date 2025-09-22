import axios from 'axios';

import { API_CONFIG } from '../config/api';

const API_BASE = API_CONFIG.BASE_URL;

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'time' | 'datetime' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'hidden' | 'section' | 'divider' | 'html';
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  order: number;
  width?: string;
  options?: Array<{
    value: string;
    label: string;
    selected?: boolean;
  }>;
  validation?: Array<{
    type: string;
    value?: any;
    message?: string;
  }>;
  conditional?: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
    value: any;
  };
  styling?: {
    className?: string;
    style?: Record<string, any>;
  };
}

export interface FormStyling {
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      error: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    spacing: {
      small: string;
      medium: string;
      large: string;
    };
  };
  layout: {
    maxWidth: string;
    padding: string;
    borderRadius: string;
    boxShadow: string;
  };
  fields: {
    height: string;
    borderRadius: string;
    borderWidth: string;
    borderColor: string;
    focusBorderColor: string;
    backgroundColor: string;
  };
  buttons: {
    height: string;
    borderRadius: string;
    fontSize: string;
    fontWeight: string;
  };
}

export interface FormSettings {
  submitUrl?: string;
  method?: 'POST' | 'GET';
  redirectUrl?: string;
  successMessage?: string;
  errorMessage?: string;
  enableProgressBar?: boolean;
  enableSaveProgress?: boolean;
  allowFileUploads?: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  enableCaptcha?: boolean;
  captchaProvider?: 'recaptcha' | 'hcaptcha';
  captchaSiteKey?: string;
  enableAnalytics?: boolean;
  gtmId?: string;
  customCSS?: string;
  customJS?: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  percentage: number;
  formData: {
    fields: FormField[];
    styling: FormStyling;
    settings: FormSettings;
  };
  isControl?: boolean;
  isActive?: boolean;
}

export interface BookingFormTemplate {
  _id: string;
  hotelId: string;
  name: string;
  description?: string;
  category: 'booking' | 'inquiry' | 'registration' | 'survey' | 'custom';
  fields: FormField[];
  styling: FormStyling;
  settings: FormSettings;
  status: 'draft' | 'active' | 'archived';
  isPublished?: boolean;
  publishedAt?: Date;
  usage?: {
    views: number;
    submissions: number;
    conversionRate: number;
    lastUsed?: Date;
  };
  abTest?: {
    isEnabled: boolean;
    variants: ABTestVariant[];
    currentWinner?: string;
  };
  tags?: string[];
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  integrations?: {
    pms?: {
      enabled: boolean;
      mapping?: Record<string, string>;
    };
    crm?: {
      enabled: boolean;
      provider?: string;
      mapping?: Record<string, string>;
    };
    emailMarketing?: {
      enabled: boolean;
      provider?: string;
      listId?: string;
    };
  };
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  fieldCount?: number;
  requiredFieldCount?: number;
}

export interface FormSubmission {
  _id: string;
  templateId: string;
  formData: Record<string, any>;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  conversionValue?: number;
  status: 'pending' | 'processed' | 'failed';
  processing?: {
    pmsBooked?: boolean;
    crmAdded?: boolean;
    emailSent?: boolean;
    errors?: string[];
  };
}

export interface FormAnalytics {
  templateId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    views: number;
    submissions: number;
    conversionRate: number;
    averageCompletionTime: number;
    bounceRate: number;
    fieldAnalytics: Array<{
      fieldId: string;
      fieldName: string;
      completionRate: number;
      errorRate: number;
      averageTime: number;
    }>;
  };
  trends: Array<{
    date: string;
    views: number;
    submissions: number;
    conversionRate: number;
  }>;
  sources: Array<{
    source: string;
    views: number;
    submissions: number;
    conversionRate: number;
  }>;
  devices: Array<{
    device: string;
    views: number;
    submissions: number;
    conversionRate: number;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
}

export interface PaginatedResponse<T> {
  templates: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

class BookingFormService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Template Management
  async getTemplates(params?: {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<PaginatedResponse<BookingFormTemplate>>> {
    try {
      console.log('🔍 Frontend Service: Getting templates with params:', params);
      
      const token = localStorage.getItem('token');
      if (token) {
        // Decode JWT to see hotelId
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔑 Frontend Service: JWT payload hotelId:', payload.hotelId);
      }
      
      console.log('🔑 Frontend Service: Auth headers for getTemplates:', this.getAuthHeaders());
      
      const response = await axios.get(`${API_BASE}/booking-forms/templates`, {
        headers: this.getAuthHeaders(),
        params
      });
      
      console.log('✅ Frontend Service: Templates fetched successfully');
      console.log('📊 Frontend Service: Response data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('💥 Frontend Service: Error fetching templates:');
      console.error('Status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Full error:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch templates'
      };
    }
  }

  async getTemplate(id: string): Promise<ApiResponse<BookingFormTemplate>> {
    try {
      const response = await axios.get(`${API_BASE}/booking-forms/templates/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching template:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch template'
      };
    }
  }

  async createTemplate(templateData: Partial<BookingFormTemplate>): Promise<ApiResponse<BookingFormTemplate>> {
    try {
      console.log('🚀 Frontend: Creating template with data:', JSON.stringify(templateData, null, 2));
      console.log('🔑 Frontend: Auth headers:', this.getAuthHeaders());
      
      const response = await axios.post(`${API_BASE}/booking-forms/templates`, templateData, {
        headers: this.getAuthHeaders()
      });
      
      console.log('✅ Frontend: Template created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('💥 Frontend: Detailed error creating template:');
      console.error('Status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Full error:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create template',
        message: error.response?.data?.message || error.message,
        debug: error.response?.data?.debug
      };
    }
  }

  async updateTemplate(id: string, templateData: Partial<BookingFormTemplate>): Promise<ApiResponse<BookingFormTemplate>> {
    try {
      const response = await axios.put(`${API_BASE}/booking-forms/templates/${id}`, templateData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating template:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update template'
      };
    }
  }

  async deleteTemplate(id: string): Promise<ApiResponse> {
    try {
      const response = await axios.delete(`${API_BASE}/booking-forms/templates/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting template:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete template'
      };
    }
  }

  async duplicateTemplate(id: string, data: { name: string }): Promise<ApiResponse<BookingFormTemplate>> {
    try {
      const response = await axios.post(`${API_BASE}/booking-forms/templates/${id}/duplicate`, data, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error duplicating template:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to duplicate template'
      };
    }
  }

  // Form Rendering and Submission
  async renderForm(id: string, preview = false): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get(`${API_BASE}/booking-forms/public/forms/${id}/render`, {
        params: { preview }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error rendering form:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to render form'
      };
    }
  }

  async submitForm(id: string, formData: Record<string, any>): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${API_BASE}/booking-forms/public/forms/${id}/submit`, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error submitting form:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to submit form'
      };
    }
  }

  async validateForm(id: string, formData: Record<string, any>): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${API_BASE}/booking-forms/public/forms/${id}/validate`, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error validating form:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to validate form'
      };
    }
  }

  // Analytics
  async getAnalytics(id: string, params?: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<ApiResponse<FormAnalytics>> {
    try {
      const response = await axios.get(`${API_BASE}/booking-forms/templates/${id}/analytics`, {
        headers: this.getAuthHeaders(),
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch analytics'
      };
    }
  }

  // Import/Export
  async exportTemplate(id: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<Blob> {
    try {
      const response = await axios.get(`${API_BASE}/booking-forms/templates/${id}/export`, {
        headers: this.getAuthHeaders(),
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error exporting template:', error);
      throw new Error(error.response?.data?.error || 'Failed to export template');
    }
  }

  async importTemplate(data: any, overwrite = false): Promise<ApiResponse<BookingFormTemplate>> {
    try {
      const response = await axios.post(`${API_BASE}/booking-forms/templates/import`, {
        data,
        overwrite
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error importing template:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to import template'
      };
    }
  }

  // A/B Testing
  async recordABTestEvent(id: string, variantId: string, action: 'view' | 'submit' | 'abandon'): Promise<ApiResponse> {
    try {
      const response = await axios.post(`${API_BASE}/booking-forms/templates/${id}/ab-test`, {
        variantId,
        action
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error recording A/B test event:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to record A/B test event'
      };
    }
  }
}

export const bookingFormService = new BookingFormService();
export default bookingFormService;