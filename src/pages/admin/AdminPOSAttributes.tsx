import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Edit, Trash2, Settings, TrendingUp, RefreshCw, Zap, Tag, Palette, Ruler
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

interface POSAttribute {
  _id: string;
  attributeId: string;
  name: string;
  displayName: string;
  description?: string;
  attributeType: string;
  attributeGroup: string;
  dataType: string;
  isActive: boolean;
  usageCount: number;
  lastUsed?: string;
  values: Array<{
    valueId: string;
    name: string;
    displayName: string;
    priceModifier: number;
    priceModifierType: string;
    isDefault: boolean;
    isActive: boolean;
  }>;
  formattedDisplay: string;
  activeValuesCount: number;
}

const AdminPOSAttributes: React.FC = () => {
  const [attributes, setAttributes] = useState<POSAttribute[]>([]);
  const [selectedAttribute, setSelectedAttribute] = useState<POSAttribute | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    attributeType: '',
    attributeGroup: 'PHYSICAL',
    dataType: 'SELECT',
    inputConfig: {
      isRequired: false,
      isMultiple: false,
      maxSelections: 1,
      allowCustomValues: false,
      sortOrder: 'ALPHABETICAL'
    },
    displayConfig: {
      showInMenu: true,
      showInCart: true,
      showInReceipt: true,
      displayOrder: 0
    },
    category: 'STANDARD',
    sortOrder: 0,
    posIntegration: {
      applicableCategories: [] as string[],
      inventoryTracking: false,
      affectsPricing: true,
      affectsAvailability: false
    },
    values: [] as any[]
  });

  const attributeTypes = [
    { value: 'SIZE', label: 'Size', icon: Ruler },
    { value: 'COLOR', label: 'Color', icon: Palette },
    { value: 'FLAVOR', label: 'Flavor', icon: Tag },
    { value: 'TEMPERATURE', label: 'Temperature', icon: Settings },
    { value: 'PREPARATION', label: 'Preparation', icon: Settings },
    { value: 'MATERIAL', label: 'Material', icon: Tag },
    { value: 'STYLE', label: 'Style', icon: Tag },
    { value: 'BRAND', label: 'Brand', icon: Tag },
    { value: 'CUSTOM', label: 'Custom', icon: Settings }
  ];

  const attributeGroups = [
    { value: 'PHYSICAL', label: 'Physical' },
    { value: 'FUNCTIONAL', label: 'Functional' },
    { value: 'BRANDING', label: 'Branding' },
    { value: 'CUSTOM', label: 'Custom' }
  ];

  const dataTypes = [
    { value: 'TEXT', label: 'Text' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'SELECT', label: 'Select' },
    { value: 'MULTI_SELECT', label: 'Multi Select' },
    { value: 'BOOLEAN', label: 'Boolean' },
    { value: 'DATE', label: 'Date' },
    { value: 'COLOR_PICKER', label: 'Color Picker' }
  ];

  const posCategories = [
    { value: 'FOOD', label: 'Food' },
    { value: 'BEVERAGE', label: 'Beverage' },
    { value: 'SERVICE', label: 'Service' },
    { value: 'PRODUCT', label: 'Product' },
    { value: 'ALCOHOL', label: 'Alcohol' },
    { value: 'TOBACCO', label: 'Tobacco' },
    { value: 'LUXURY', label: 'Luxury' },
    { value: 'GENERAL', label: 'General' }
  ];

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pos/attributes');
      if (response.data.status === 'success') {
        setAttributes(response.data.data.attributes);
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
      toast.error('Failed to fetch POS attributes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAttribute = async () => {
    try {
      const response = await api.post('/pos/attributes', formData);
      if (response.data.status === 'success') {
        toast.success('POS attribute created successfully');
        fetchAttributes();
        setIsCreateModalOpen(false);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating attribute:', error);
      toast.error(error.response?.data?.message || 'Failed to create attribute');
    }
  };

  const handleUpdateAttribute = async () => {
    if (!selectedAttribute) return;

    try {
      const response = await api.put(`/pos/attributes/${selectedAttribute._id}`, formData);
      if (response.data.status === 'success') {
        toast.success('POS attribute updated successfully');
        fetchAttributes();
        setIsEditModalOpen(false);
        setSelectedAttribute(null);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error updating attribute:', error);
      toast.error(error.response?.data?.message || 'Failed to update attribute');
    }
  };

  const handleDeleteAttribute = async (attribute: POSAttribute) => {
    if (!confirm(`Are you sure you want to ${attribute.usageCount > 0 ? 'deactivate' : 'delete'} this attribute?`)) {
      return;
    }

    try {
      const response = await api.delete(`/pos/attributes/${attribute._id}`);
      if (response.data.status === 'success') {
        toast.success(response.data.message);
        fetchAttributes();
      }
    } catch (error: any) {
      console.error('Error deleting attribute:', error);
      toast.error(error.response?.data?.message || 'Failed to delete attribute');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      attributeType: '',
      attributeGroup: 'PHYSICAL',
      dataType: 'SELECT',
      inputConfig: {
        isRequired: false,
        isMultiple: false,
        maxSelections: 1,
        allowCustomValues: false,
        sortOrder: 'ALPHABETICAL'
      },
      displayConfig: {
        showInMenu: true,
        showInCart: true,
        showInReceipt: true,
        displayOrder: 0
      },
      category: 'STANDARD',
      sortOrder: 0,
      posIntegration: {
        applicableCategories: [],
        inventoryTracking: false,
        affectsPricing: true,
        affectsAvailability: false
      },
      values: []
    });
  };

  const openEditModal = (attribute: POSAttribute) => {
    setSelectedAttribute(attribute);
    setFormData({
      name: attribute.name,
      displayName: attribute.displayName,
      description: attribute.description || '',
      attributeType: attribute.attributeType,
      attributeGroup: attribute.attributeGroup,
      dataType: attribute.dataType,
      inputConfig: {
        isRequired: false,
        isMultiple: false,
        maxSelections: 1,
        allowCustomValues: false,
        sortOrder: 'ALPHABETICAL'
      },
      displayConfig: {
        showInMenu: true,
        showInCart: true,
        showInReceipt: true,
        displayOrder: 0
      },
      category: 'STANDARD',
      sortOrder: 0,
      posIntegration: {
        applicableCategories: [],
        inventoryTracking: false,
        affectsPricing: true,
        affectsAvailability: false
      },
      values: attribute.values || []
    });
    setIsEditModalOpen(true);
  };

  const getAttributeTypeColor = (type: string) => {
    const colors = {
      SIZE: 'bg-blue-100 text-blue-800',
      COLOR: 'bg-pink-100 text-pink-800',
      FLAVOR: 'bg-orange-100 text-orange-800',
      TEMPERATURE: 'bg-red-100 text-red-800',
      PREPARATION: 'bg-green-100 text-green-800',
      MATERIAL: 'bg-purple-100 text-purple-800',
      STYLE: 'bg-yellow-100 text-yellow-800',
      BRAND: 'bg-indigo-100 text-indigo-800',
      CUSTOM: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAttributeGroupColor = (group: string) => {
    const colors = {
      PHYSICAL: 'bg-blue-100 text-blue-800',
      FUNCTIONAL: 'bg-green-100 text-green-800',
      BRANDING: 'bg-purple-100 text-purple-800',
      CUSTOM: 'bg-gray-100 text-gray-800'
    };
    return colors[group as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">POS Attributes & Variants</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Attribute
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New POS Attribute</DialogTitle>
            </DialogHeader>
            <AttributeForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateAttribute}
              onCancel={() => setIsCreateModalOpen(false)}
              attributeTypes={attributeTypes}
              attributeGroups={attributeGroups}
              dataTypes={dataTypes}
              posCategories={posCategories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Attribute Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Tag className="w-8 h-8 text-blue-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Attributes</p>
              <p className="text-2xl font-bold">{attributes.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Settings className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Attributes</p>
              <p className="text-2xl font-bold">{attributes.filter(a => a.isActive).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="w-8 h-8 text-purple-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold">{attributes.reduce((sum, a) => sum + a.usageCount, 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Zap className="w-8 h-8 text-orange-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Attribute Types</p>
              <p className="text-2xl font-bold">{new Set(attributes.map(a => a.attributeType)).size}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attributes Table */}
      <Card>
        <CardHeader>
          <CardTitle>POS Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attribute ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Data Type</TableHead>
                <TableHead>Values</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attribute) => (
                <TableRow key={attribute._id}>
                  <TableCell className="font-mono">{attribute.attributeId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{attribute.displayName}</p>
                      <p className="text-sm text-gray-600">{attribute.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getAttributeTypeColor(attribute.attributeType)}>
                      {attribute.attributeType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getAttributeGroupColor(attribute.attributeGroup)}>
                      {attribute.attributeGroup}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{attribute.dataType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{attribute.activeValuesCount}</span>
                      <span className="text-sm text-gray-600">values</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={attribute.isActive ? "default" : "secondary"}>
                      {attribute.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{attribute.usageCount}</p>
                      {attribute.lastUsed && (
                        <p className="text-sm text-gray-600">
                          {new Date(attribute.lastUsed).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(attribute)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAttribute(attribute)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit POS Attribute</DialogTitle>
          </DialogHeader>
          <AttributeForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateAttribute}
            onCancel={() => setIsEditModalOpen(false)}
            isEdit
            attributeTypes={attributeTypes}
            attributeGroups={attributeGroups}
            dataTypes={dataTypes}
            posCategories={posCategories}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Attribute Form Component
const AttributeForm: React.FC<{
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
  attributeTypes: Array<{ value: string; label: string; icon: any }>;
  attributeGroups: Array<{ value: string; label: string }>;
  dataTypes: Array<{ value: string; label: string }>;
  posCategories: Array<{ value: string; label: string }>;
}> = ({ formData, setFormData, onSubmit, onCancel, isEdit, attributeTypes, attributeGroups, dataTypes, posCategories }) => {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
        <TabsTrigger value="integration">POS Integration</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Attribute Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter attribute name"
            />
          </div>

          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Enter display name"
            />
          </div>

          <div>
            <Label htmlFor="attributeType">Attribute Type</Label>
            <Select value={formData.attributeType} onValueChange={(value) => setFormData({ ...formData, attributeType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select attribute type" />
              </SelectTrigger>
              <SelectContent>
                {attributeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="attributeGroup">Attribute Group</Label>
            <Select value={formData.attributeGroup} onValueChange={(value) => setFormData({ ...formData, attributeGroup: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select attribute group" />
              </SelectTrigger>
              <SelectContent>
                {attributeGroups.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dataType">Data Type</Label>
            <Select value={formData.dataType} onValueChange={(value) => setFormData({ ...formData, dataType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                {dataTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              min="0"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter attribute description"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="config" className="space-y-4">
        <div className="space-y-4">
          <h3 className="font-semibold">Input Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={formData.inputConfig.isRequired}
                onChange={(e) => setFormData({
                  ...formData,
                  inputConfig: { ...formData.inputConfig, isRequired: e.target.checked }
                })}
              />
              <Label htmlFor="isRequired">Is Required</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isMultiple"
                checked={formData.inputConfig.isMultiple}
                onChange={(e) => setFormData({
                  ...formData,
                  inputConfig: { ...formData.inputConfig, isMultiple: e.target.checked }
                })}
              />
              <Label htmlFor="isMultiple">Allow Multiple Values</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowCustomValues"
                checked={formData.inputConfig.allowCustomValues}
                onChange={(e) => setFormData({
                  ...formData,
                  inputConfig: { ...formData.inputConfig, allowCustomValues: e.target.checked }
                })}
              />
              <Label htmlFor="allowCustomValues">Allow Custom Values</Label>
            </div>
          </div>

          <h3 className="font-semibold">Display Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showInMenu"
                checked={formData.displayConfig.showInMenu}
                onChange={(e) => setFormData({
                  ...formData,
                  displayConfig: { ...formData.displayConfig, showInMenu: e.target.checked }
                })}
              />
              <Label htmlFor="showInMenu">Show in Menu</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showInCart"
                checked={formData.displayConfig.showInCart}
                onChange={(e) => setFormData({
                  ...formData,
                  displayConfig: { ...formData.displayConfig, showInCart: e.target.checked }
                })}
              />
              <Label htmlFor="showInCart">Show in Cart</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showInReceipt"
                checked={formData.displayConfig.showInReceipt}
                onChange={(e) => setFormData({
                  ...formData,
                  displayConfig: { ...formData.displayConfig, showInReceipt: e.target.checked }
                })}
              />
              <Label htmlFor="showInReceipt">Show in Receipt</Label>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="integration" className="space-y-4">
        <div className="space-y-4">
          <h3 className="font-semibold">POS Integration</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="affectsPricing"
              checked={formData.posIntegration.affectsPricing}
              onChange={(e) => setFormData({
                ...formData,
                posIntegration: { ...formData.posIntegration, affectsPricing: e.target.checked }
              })}
            />
            <Label htmlFor="affectsPricing">Affects Pricing</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="inventoryTracking"
              checked={formData.posIntegration.inventoryTracking}
              onChange={(e) => setFormData({
                ...formData,
                posIntegration: { ...formData.posIntegration, inventoryTracking: e.target.checked }
              })}
            />
            <Label htmlFor="inventoryTracking">Enable Inventory Tracking</Label>
          </div>

          <div>
            <Label>Applicable POS Categories</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {posCategories.map((category) => (
                <label key={category.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.posIntegration.applicableCategories.includes(category.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          posIntegration: {
                            ...formData.posIntegration,
                            applicableCategories: [...formData.posIntegration.applicableCategories, category.value]
                          }
                        });
                      } else {
                        setFormData({
                          ...formData,
                          posIntegration: {
                            ...formData.posIntegration,
                            applicableCategories: formData.posIntegration.applicableCategories.filter(c => c !== category.value)
                          }
                        });
                      }
                    }}
                  />
                  <span>{category.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-2 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? 'Update' : 'Create'} Attribute
        </Button>
      </div>
    </Tabs>
  );
};

export default AdminPOSAttributes;
