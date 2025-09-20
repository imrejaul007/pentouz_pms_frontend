import React from 'react';
import { cn } from '../../../utils/cn';
import { getStatusColor } from '../../../utils/dashboardUtils';

interface HeatmapData {
  floor: number;
  rooms: {
    roomNumber: string;
    status: string;
    color?: string;
    data?: any;
  }[];
}

interface HeatmapChartProps {
  data: HeatmapData[];
  onRoomClick?: (room: any) => void;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export function HeatmapChart({
  data,
  onRoomClick,
  height = 400,
  showLegend = true,
  className,
}: HeatmapChartProps) {
  const statusTypes = [
    { status: 'occupied', label: 'Occupied', color: '#ef4444' },
    { status: 'vacant_clean', label: 'Vacant Clean', color: '#10b981' },
    { status: 'vacant_dirty', label: 'Vacant Dirty', color: '#f59e0b' },
    { status: 'out_of_order', label: 'Out of Order', color: '#6b7280' },
    { status: 'maintenance', label: 'Maintenance', color: '#f97316' },
  ];

  const maxRoomsPerFloor = Math.max(...data.map(floor => floor.rooms.length));
  const roomWidth = Math.min(60, Math.max(30, (100 / maxRoomsPerFloor) * 4));

  return (
    <div className={cn('w-full', className)}>
      <div 
        className="flex flex-col space-y-4 overflow-auto p-4"
        style={{ height: `${height}px` }}
      >
        {data.map((floorData) => (
          <div key={floorData.floor} className="flex items-center space-x-4">
            {/* Floor label */}
            <div className="flex-shrink-0 w-16 text-center">
              <span className="text-sm font-medium text-gray-700">
                Floor {floorData.floor}
              </span>
            </div>

            {/* Rooms grid */}
            <div className="flex flex-wrap gap-1">
              {floorData.rooms.map((room) => {
                const color = room.color || getStatusColor(room.status);
                return (
                  <div
                    key={room.roomNumber}
                    className={cn(
                      'flex items-center justify-center text-xs font-medium rounded cursor-pointer transition-all duration-200',
                      'hover:scale-105 hover:shadow-md',
                      onRoomClick && 'cursor-pointer'
                    )}
                    style={{
                      width: `${roomWidth}px`,
                      height: '32px',
                      backgroundColor: color,
                      color: room.status === 'vacant_clean' ? '#065f46' : '#ffffff',
                    }}
                    onClick={() => onRoomClick && onRoomClick(room)}
                    title={`Room ${room.roomNumber} - ${room.status.replace('_', ' ')}`}
                  >
                    {room.roomNumber}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showLegend && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center">
            {statusTypes.map((statusType) => (
              <div key={statusType.status} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: statusType.color }}
                />
                <span className="text-sm text-gray-700">{statusType.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RoomStatusGridProps {
  rooms: {
    roomNumber: string;
    status: string;
    floor: number;
    type?: string;
    currentBooking?: any;
    nextBooking?: any;
  }[];
  onRoomClick?: (room: any) => void;
  groupByFloor?: boolean;
  className?: string;
}

export function RoomStatusGrid({
  rooms,
  onRoomClick,
  groupByFloor = true,
  className,
}: RoomStatusGridProps) {
  const groupedRooms = groupByFloor
    ? rooms.reduce((acc, room) => {
        if (!acc[room.floor]) {
          acc[room.floor] = [];
        }
        acc[room.floor].push(room);
        return acc;
      }, {} as Record<number, typeof rooms>)
    : { 0: rooms };

  const sortedFloors = Object.keys(groupedRooms)
    .map(Number)
    .sort((a, b) => b - a); // Sort floors in descending order

  const heatmapData: HeatmapData[] = sortedFloors.map(floor => ({
    floor: groupByFloor ? floor : 0,
    rooms: groupedRooms[floor].map(room => ({
      roomNumber: room.roomNumber,
      status: room.status,
      data: room,
    })),
  }));

  return (
    <HeatmapChart
      data={heatmapData}
      onRoomClick={onRoomClick}
      className={className}
      showLegend={true}
    />
  );
}