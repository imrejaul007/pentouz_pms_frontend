import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CreditCard, Banknote, Smartphone, Globe, Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/utils/dashboardUtils';

interface PaymentMethod {
  method: 'cash' | 'card' | 'upi' | 'online_portal' | 'corporate';
  amount: number;
  reference?: string;
  notes?: string;
}

interface PaymentCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentDetails: { paymentMethods: PaymentMethod[] }) => void;
  totalAmount: number;
  currency: string;
  bookingNumber: string;
}

const paymentMethodIcons = {
  cash: Banknote,
  card: CreditCard,
  upi: Smartphone,
  online_portal: Globe,
  corporate: Building2
};

const paymentMethodLabels = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  online_portal: 'Online Portal',
  corporate: 'Corporate'
};

export default function PaymentCollectionModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  currency,
  bookingNumber
}: PaymentCollectionModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { method: 'cash', amount: 0, reference: '', notes: '' }
  ]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);

  useEffect(() => {
    const total = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalPaid(total);
    setRemainingAmount(Math.max(0, totalAmount - total));
  }, [paymentMethods, totalAmount]);

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { method: 'cash', amount: 0, reference: '', notes: '' }]);
  };

  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    }
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: any) => {
    const updated = [...paymentMethods];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentMethods(updated);
  };

  const handleConfirm = () => {
    const validPayments = paymentMethods.filter(payment => payment.amount > 0);
    if (validPayments.length === 0) {
      alert('Please add at least one payment method with amount greater than 0');
      return;
    }
    onConfirm({ paymentMethods: validPayments });
  };

  const handleClose = () => {
    setPaymentMethods([{ method: 'cash', amount: 0, reference: '', notes: '' }]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Payment Collection - ${bookingNumber}`}>
      <div className="space-y-6">
        {/* Total Amount Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Total Amount:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Total Paid:</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(totalPaid, currency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Remaining:</span>
            <span className={`text-lg font-bold ${remainingAmount === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(remainingAmount, currency)}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Payment Methods</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPaymentMethod}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>
          </div>

          <div className="space-y-4">
            {paymentMethods.map((payment, index) => {
              const IconComponent = paymentMethodIcons[payment.method];
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">
                        {paymentMethodLabels[payment.method]}
                      </span>
                    </div>
                    {paymentMethods.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaymentMethod(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`method-${index}`}>Payment Method</Label>
                      <Select
                        value={payment.method}
                        onValueChange={(value) => updatePaymentMethod(index, 'method', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="online_portal">Online Portal</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`amount-${index}`}>Amount</Label>
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={payment.amount}
                        onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`reference-${index}`}>Reference/Transaction ID</Label>
                      <Input
                        id={`reference-${index}`}
                        value={payment.reference || ''}
                        onChange={(e) => updatePaymentMethod(index, 'reference', e.target.value)}
                        placeholder="Enter reference number"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`notes-${index}`}>Notes</Label>
                      <Textarea
                        id={`notes-${index}`}
                        value={payment.notes || ''}
                        onChange={(e) => updatePaymentMethod(index, 'notes', e.target.value)}
                        placeholder="Additional notes"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={totalPaid <= 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Process Payment & Check In
          </Button>
        </div>
      </div>
    </Modal>
  );
}
