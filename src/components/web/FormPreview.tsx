import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card, CardContent } from '../ui/card';
import { BookingFormTemplate, FormField } from '../../services/bookingFormService';

interface FormPreviewProps {
  template: Partial<BookingFormTemplate>;
  deviceMode?: 'desktop' | 'tablet' | 'mobile';
  interactive?: boolean;
  showDeviceToggle?: boolean;
}

const FormPreview: React.FC<FormPreviewProps> = ({ 
  template, 
  deviceMode: initialDeviceMode = 'desktop',
  interactive = true,
  showDeviceToggle = true 
}) => {
  const [deviceMode, setDeviceMode] = useState(initialDeviceMode);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());

  const fields = template.fields || [];
  const styling = template.styling || {};
  const settings = template.settings || {};

  useEffect(() => {
    // Initialize visible fields and evaluate conditions
    const visible = new Set<string>();
    
    fields.forEach(field => {
      if (isFieldVisible(field, formData)) {
        visible.add(field.id);
      }
    });

    setVisibleFields(visible);
  }, [fields, formData]);

  const isFieldVisible = (field: FormField, data: Record<string, any>): boolean => {
    if (!field.conditional) return true;

    const { fieldId, operator, value } = field.conditional;
    const fieldValue = data[fieldId];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue || '').includes(value);
      case 'not_contains':
        return !String(fieldValue || '').includes(value);
      case 'greater_than':
        return Number(fieldValue || 0) > Number(value);
      case 'less_than':
        return Number(fieldValue || 0) < Number(value);
      default:
        return true;
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    if (!interactive) return;

    setFormData(prev => {
      const updated = { ...prev, [fieldId]: value };
      
      // Clear any existing errors for this field
      if (errors[fieldId]) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[fieldId];
          return newErrors;
        });
      }

      return updated;
    });
  };

  const validateField = (field: FormField, value: any): string | null => {
    // Check required
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`;
    }

    if (!value) return null;

    // Check validation rules
    for (const rule of field.validation || []) {
      let isValid = true;
      
      switch (rule.type) {
        case 'min_length':
          isValid = String(value).length >= (rule.value || 0);
          break;
        case 'max_length':
          isValid = String(value).length <= (rule.value || 100);
          break;
        case 'min_value':
          isValid = Number(value) >= Number(rule.value || 0);
          break;
        case 'max_value':
          isValid = Number(value) <= Number(rule.value || 100);
          break;
        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          break;
        case 'phone':
          isValid = /^\+?[\d\s\-\(\)]+$/.test(value);
          break;
        case 'url':
          isValid = /^https?:\/\/.+/.test(value);
          break;
        case 'regex':
          isValid = new RegExp(rule.value).test(value);
          break;
      }

      if (!isValid) {
        return rule.message || `${field.label} is invalid`;
      }
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactive) return;

    const newErrors: Record<string, string> = {};

    // Validate all visible fields
    fields.forEach(field => {
      if (visibleFields.has(field.id)) {
        const error = validateField(field, formData[field.id]);
        if (error) {
          newErrors[field.id] = error;
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Form is valid, would submit here
      console.log('Form submitted:', formData);
    }
  };

  const renderField = (field: FormField) => {
    if (!visibleFields.has(field.id)) return null;

    const fieldError = errors[field.id];
    const fieldValue = formData[field.id];

    const fieldStyle = {
      width: `${field.width || 100}%`,
      ...(field.styling?.style || {})
    };

    const commonProps = {
      id: field.id,
      className: field.styling?.className || '',
      style: fieldStyle
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <div key={field.id} className="space-y-2" style={fieldStyle}>
            <Label htmlFor={field.id} className={field.required ? 'required' : ''}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type={field.type}
              placeholder={field.placeholder}
              value={fieldValue || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? 'border-red-500' : ''}
            />
            {field.helpText && (
              <p className="text-sm text-gray-600">{field.helpText}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'date':
      case 'time':
      case 'datetime':
        return (
          <div key={field.id} className="space-y-2" style={fieldStyle}>
            <Label htmlFor={field.id} className={field.required ? 'required' : ''}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type={field.type === 'datetime' ? 'datetime-local' : field.type}
              value={fieldValue || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? 'border-red-500' : ''}
            />
            {field.helpText && (
              <p className="text-sm text-gray-600">{field.helpText}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2" style={fieldStyle}>
            <Label htmlFor={field.id} className={field.required ? 'required' : ''}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              placeholder={field.placeholder}
              value={fieldValue || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              rows={4}
              className={fieldError ? 'border-red-500' : ''}
            />
            {field.helpText && (
              <p className="text-sm text-gray-600">{field.helpText}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2" style={fieldStyle}>
            <Label htmlFor={field.id} className={field.required ? 'required' : ''}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={fieldValue || ''} onValueChange={(value) => handleInputChange(field.id, value)}>
              <SelectTrigger className={fieldError ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-sm text-gray-600">{field.helpText}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2" style={fieldStyle}>
            <Label className={field.required ? 'required' : ''}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={fieldValue || ''}
              onValueChange={(value) => handleInputChange(field.id, value)}
              className={fieldError ? 'border border-red-500 p-2 rounded' : ''}
            >
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {field.helpText && (
              <p className="text-sm text-gray-600">{field.helpText}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'checkbox':
        if (field.options && field.options.length > 1) {
          // Multiple checkboxes
          return (
            <div key={field.id} className="space-y-2" style={fieldStyle}>
              <Label className={field.required ? 'required' : ''}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="space-y-2">
                {field.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.id}-${option.value}`}
                      checked={(fieldValue || []).includes(option.value)}
                      onCheckedChange={(checked) => {
                        const currentValues = fieldValue || [];
                        let newValues;
                        if (checked) {
                          newValues = [...currentValues, option.value];
                        } else {
                          newValues = currentValues.filter((v: any) => v !== option.value);
                        }
                        handleInputChange(field.id, newValues);
                      }}
                    />
                    <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
              {field.helpText && (
                <p className="text-sm text-gray-600">{field.helpText}</p>
              )}
              {fieldError && (
                <p className="text-sm text-red-600">{fieldError}</p>
              )}
            </div>
          );
        } else {
          // Single checkbox
          return (
            <div key={field.id} className="space-y-2" style={fieldStyle}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={fieldValue || false}
                  onCheckedChange={(checked) => handleInputChange(field.id, checked)}
                />
                <Label htmlFor={field.id} className={field.required ? 'required' : ''}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
              {field.helpText && (
                <p className="text-sm text-gray-600">{field.helpText}</p>
              )}
              {fieldError && (
                <p className="text-sm text-red-600">{fieldError}</p>
              )}
            </div>
          );
        }

      case 'file':
        return (
          <div key={field.id} className="space-y-2" style={fieldStyle}>
            <Label htmlFor={field.id} className={field.required ? 'required' : ''}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="file"
              onChange={(e) => handleInputChange(field.id, e.target.files?.[0])}
              className={fieldError ? 'border-red-500' : ''}
              accept={settings.allowedFileTypes?.join(',')}
            />
            {field.helpText && (
              <p className="text-sm text-gray-600">{field.helpText}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'divider':
        return (
          <div key={field.id} className="border-t border-gray-300 my-6" style={fieldStyle} />
        );

      case 'html':
        return (
          <div
            key={field.id}
            className="prose prose-sm max-w-none"
            style={fieldStyle}
            dangerouslySetInnerHTML={{ __html: field.placeholder || '' }}
          />
        );

      default:
        return (
          <div key={field.id} className="p-4 bg-gray-100 rounded border" style={fieldStyle}>
            <p className="text-sm text-gray-600">Unsupported field type: {field.type}</p>
          </div>
        );
    }
  };

  const getDeviceContainerClass = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
      default:
        return 'max-w-4xl mx-auto';
    }
  };

  const getFormContainerStyle = () => {
    const colors = styling.theme?.colors;
    const layout = styling.layout;

    return {
      maxWidth: layout?.maxWidth || '600px',
      padding: layout?.padding || '2rem',
      borderRadius: layout?.borderRadius || '0.5rem',
      boxShadow: layout?.boxShadow || '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      backgroundColor: colors?.background || '#ffffff',
      color: colors?.text || '#1f2937',
      margin: '0 auto'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {showDeviceToggle && (
        <div className="mb-6">
          <div className="flex justify-center gap-2">
            <Button
              variant={deviceMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceMode('desktop')}
            >
              <Monitor className="w-4 h-4 mr-1" />
              Desktop
            </Button>
            <Button
              variant={deviceMode === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceMode('tablet')}
            >
              <Tablet className="w-4 h-4 mr-1" />
              Tablet
            </Button>
            <Button
              variant={deviceMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeviceMode('mobile')}
            >
              <Smartphone className="w-4 h-4 mr-1" />
              Mobile
            </Button>
          </div>
        </div>
      )}

      <div className={getDeviceContainerClass()}>
        <Card style={getFormContainerStyle()}>
          <CardContent className="p-0">
            {template.name && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold">{template.name}</h1>
                {template.description && (
                  <p className="text-gray-600 mt-2">{template.description}</p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {settings.enableProgressBar && fields.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round((Object.keys(formData).length / fields.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(Object.keys(formData).length / fields.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-6">
                {fields
                  .sort((a, b) => a.order - b.order)
                  .map(renderField)}
              </div>

              {interactive && fields.length > 0 && (
                <div className="pt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    style={{
                      backgroundColor: styling.theme?.colors?.primary || '#3b82f6',
                      height: styling.buttons?.height || '2.5rem',
                      borderRadius: styling.buttons?.borderRadius || '0.375rem',
                      fontSize: styling.buttons?.fontSize || '0.875rem',
                      fontWeight: styling.buttons?.fontWeight || '500'
                    }}
                  >
                    Submit
                  </Button>
                </div>
              )}

              {!interactive && (
                <div className="pt-6">
                  <div className="w-full h-10 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500">Submit Button (Preview Mode)</span>
                  </div>
                </div>
              )}
            </form>

            {!interactive && fields.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No fields added yet</p>
                <p className="text-sm">Add fields to see the form preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormPreview;