import React from 'react';
import { useParams } from 'react-router-dom';

export default function GuestBookingDetail() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Booking Details</h1>
      <p>Booking ID: {id}</p>
      <div className="text-center py-12">
        <p className="text-gray-500">Booking detail page coming soon...</p>
      </div>
    </div>
  );
}