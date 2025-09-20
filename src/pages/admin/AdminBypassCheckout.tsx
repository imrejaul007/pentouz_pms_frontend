import React from 'react';
import AdminBypassCheckout from '../../components/admin/AdminBypassCheckout';

export default function AdminBypassCheckoutPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Bypass Checkout</h1>
        <p className="text-gray-600 mt-1">
          Emergency checkout option for special cases and urgent situations
        </p>
      </div>
      
      <AdminBypassCheckout />
    </div>
  );
}