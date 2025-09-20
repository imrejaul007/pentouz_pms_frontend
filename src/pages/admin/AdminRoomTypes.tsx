import React from 'react';
import RoomTypeManagement from '../../components/admin/RoomTypeManagement';
import { useAuth } from '../../context/AuthContext';

const AdminRoomTypes: React.FC = () => {
  const { user } = useAuth();

  if (!user?.hotelId) {
    // Use fallback hotelId for testing
    const fallbackHotelId = '68c7e6ebca8aed0ec8036a9c';
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Type Management</h1>
          <p className="text-gray-600">Manage room types, configurations, and OTA mappings</p>
        </div>

        <RoomTypeManagement hotelId={fallbackHotelId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Room Type Management</h1>
        <p className="text-gray-600">Manage room types, configurations, and OTA mappings</p>
      </div>

      <RoomTypeManagement hotelId={user.hotelId || '68c7e6ebca8aed0ec8036a9c'} />
    </div>
  );
};

export default AdminRoomTypes;