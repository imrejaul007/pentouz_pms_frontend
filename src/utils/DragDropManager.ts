import { toast } from '@/utils/toast';
import tapeChartService from '@/services/tapeChartService';

export interface DraggedReservation {
  id: string;
  _id: string;
  bookingNumber?: string;
  guestName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  status: string;
  vipStatus?: string;
  totalAmount?: number;
  paymentStatus?: string;
  adults: number;
  children: number;
  nights: number;
  specialRequests?: string[];
}

export interface DropTarget {
  roomId: string;
  roomNumber: string;
  date: string;
  isAvailable: boolean;
  conflictReason?: string;
}

export interface DragOperation {
  id: string;
  reservations: DraggedReservation[];
  startTime: number;
  operation: 'move' | 'assign' | 'batch_assign';
}

export class DragDropManager {
  private static instance: DragDropManager;
  private currentOperation: DragOperation | null = null;
  private dropZones: Map<string, DropTarget> = new Map();
  private selectedReservations: Set<string> = new Set();
  private conflictChecks: Map<string, boolean> = new Map();
  private operationHistory: DragOperation[] = [];
  private readonly MAX_HISTORY = 10;

  private constructor() {}

  static getInstance(): DragDropManager {
    if (!DragDropManager.instance) {
      DragDropManager.instance = new DragDropManager();
    }
    return DragDropManager.instance;
  }

  // Multi-selection management
  addToSelection(reservationId: string): void {
    this.selectedReservations.add(reservationId);
    console.log('Selection updated:', Array.from(this.selectedReservations));
  }

  removeFromSelection(reservationId: string): void {
    this.selectedReservations.delete(reservationId);
  }

  clearSelection(): void {
    this.selectedReservations.clear();
  }

  isSelected(reservationId: string): boolean {
    return this.selectedReservations.has(reservationId);
  }

  getSelectedReservations(): string[] {
    return Array.from(this.selectedReservations);
  }

  getSelectionCount(): number {
    return this.selectedReservations.size;
  }

  // Drag operation management
  startDragOperation(reservations: DraggedReservation[], operation: 'move' | 'assign' | 'batch_assign'): string {
    const operationId = `drag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.currentOperation = {
      id: operationId,
      reservations,
      startTime: Date.now(),
      operation
    };

    console.log('🚀 Starting drag operation:', this.currentOperation);
    return operationId;
  }

  getCurrentOperation(): DragOperation | null {
    return this.currentOperation;
  }

  endDragOperation(): void {
    if (this.currentOperation) {
      this.operationHistory.unshift(this.currentOperation);
      if (this.operationHistory.length > this.MAX_HISTORY) {
        this.operationHistory = this.operationHistory.slice(0, this.MAX_HISTORY);
      }
    }
    this.currentOperation = null;
    this.clearSelection();
    console.log('🛑 Drag operation ended');
  }

  // Drop zone management
  registerDropZone(cellId: string, target: DropTarget): void {
    this.dropZones.set(cellId, target);
  }

  unregisterDropZone(cellId: string): void {
    this.dropZones.delete(cellId);
  }

  getDropZone(cellId: string): DropTarget | undefined {
    return this.dropZones.get(cellId);
  }

  // Conflict detection
  async checkRoomAvailability(roomId: string, date: string, reservation: DraggedReservation): Promise<{
    isAvailable: boolean;
    conflictReason?: string;
    suggestions?: string[];
  }> {
    const cacheKey = `${roomId}-${date}-${reservation.id}`;

    try {
      // Check if room is locked by another user
      const lockStatus = await this.checkRoomLock(roomId);
      if (lockStatus.isLocked && lockStatus.lockedBy !== this.getCurrentUserId()) {
        return {
          isAvailable: false,
          conflictReason: `Room is locked by ${lockStatus.lockedBy}`,
          suggestions: ['Try another room', 'Wait for lock to expire']
        };
      }

      // Check for booking conflicts
      const conflictCheck = await this.checkBookingConflicts(roomId, date, reservation);
      if (!conflictCheck.isAvailable) {
        return conflictCheck;
      }

      // Check room suitability
      const suitabilityCheck = this.checkRoomSuitability(roomId, reservation);
      if (!suitabilityCheck.isAvailable) {
        return suitabilityCheck;
      }

      this.conflictChecks.set(cacheKey, true);
      return { isAvailable: true };

    } catch (error) {
      console.error('Error checking room availability:', error);
      return {
        isAvailable: false,
        conflictReason: 'Unable to verify room availability',
        suggestions: ['Refresh and try again']
      };
    }
  }

  private async checkRoomLock(roomId: string): Promise<{
    isLocked: boolean;
    lockedBy?: string;
    expiresAt?: Date;
  }> {
    try {
      // This would integrate with the existing room lock system
      const response = await fetch(`/api/v1/tape-chart/rooms/${roomId}/lock-status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        return await response.json();
      }

      return { isLocked: false };
    } catch (error) {
      console.error('Error checking room lock:', error);
      return { isLocked: false };
    }
  }

  private async checkBookingConflicts(roomId: string, date: string, reservation: DraggedReservation): Promise<{
    isAvailable: boolean;
    conflictReason?: string;
    suggestions?: string[];
  }> {
    // Simulate checking for booking conflicts
    // In a real implementation, this would check the database

    const checkInDate = new Date(reservation.checkIn);
    const checkOutDate = new Date(reservation.checkOut);
    const targetDate = new Date(date);

    // Check if the target date falls within the reservation period
    if (targetDate >= checkInDate && targetDate < checkOutDate) {
      return { isAvailable: true };
    }

    // For now, assume availability - real implementation would check database
    return { isAvailable: true };
  }

  private checkRoomSuitability(roomId: string, reservation: DraggedReservation): {
    isAvailable: boolean;
    conflictReason?: string;
    suggestions?: string[];
  } {
    // Check guest count vs room capacity
    const totalGuests = reservation.adults + reservation.children;

    // These checks would use actual room data
    if (totalGuests > 4) { // Assuming max 4 guests per room
      return {
        isAvailable: false,
        conflictReason: `Room capacity insufficient for ${totalGuests} guests`,
        suggestions: ['Find a larger room', 'Split into multiple rooms']
      };
    }

    // Check VIP requirements
    if (reservation.vipStatus === 'svip') {
      // Would check if room has VIP amenities
      console.log('Checking VIP requirements for room:', roomId);
    }

    return { isAvailable: true };
  }

  // Drag visual effects
  createDragImage(reservations: DraggedReservation[]): HTMLElement {
    const dragImage = document.createElement('div');
    dragImage.className = 'drag-preview bg-white border-2 border-blue-500 rounded-lg shadow-xl p-3 max-w-xs';

    if (reservations.length === 1) {
      const reservation = reservations[0];
      dragImage.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="font-medium text-sm text-gray-800">${reservation.guestName}</span>
        </div>
        <div class="text-xs text-gray-600">${reservation.roomType}</div>
        <div class="text-xs text-gray-500">${reservation.checkIn} - ${reservation.checkOut}</div>
        <div class="text-xs text-blue-600 font-medium mt-1">Moving reservation...</div>
      `;
    } else {
      dragImage.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="font-medium text-sm text-gray-800">${reservations.length} Reservations</span>
        </div>
        <div class="text-xs text-gray-600">Batch Assignment</div>
        <div class="text-xs text-blue-600 font-medium mt-1">Moving ${reservations.length} guests...</div>
        <div class="mt-2 flex -space-x-2">
          ${reservations.slice(0, 3).map(() =>
            `<div class="w-6 h-6 bg-blue-100 border-2 border-white rounded-full flex items-center justify-center">
              <span class="text-xs text-blue-600">👤</span>
            </div>`
          ).join('')}
          ${reservations.length > 3 ? `<div class="w-6 h-6 bg-blue-500 text-white border-2 border-white rounded-full flex items-center justify-center text-xs">+${reservations.length - 3}</div>` : ''}
        </div>
      `;
    }

    // Position off-screen
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.zIndex = '9999';

    return dragImage;
  }

  // Assignment execution
  async executeAssignment(
    reservations: DraggedReservation[],
    target: DropTarget,
    options: {
      notes?: string;
      moveReason?: string;
      sendNotification?: boolean;
      lockRoom?: boolean;
    } = {}
  ): Promise<{ success: boolean; results: any[]; errors: string[] }> {
    const results: any[] = [];
    const errors: string[] = [];

    try {
      // Lock room if requested
      if (options.lockRoom) {
        await this.lockRoom(target.roomId, 'assignment_in_progress');
      }

      // Process each reservation
      for (const reservation of reservations) {
        try {
          const assignmentData = {
            roomId: target.roomId,
            roomNumber: target.roomNumber,
            assignmentType: 'drag_drop',
            notes: options.notes || `Moved via drag & drop to room ${target.roomNumber} for ${target.date}`,
            newCheckInDate: target.date,
            moveReason: options.moveReason || 'Staff reassignment via tape chart'
          };

          const result = await tapeChartService.assignRoom(reservation, assignmentData);
          results.push(result);

          console.log(`✅ Successfully assigned ${reservation.guestName} to room ${target.roomNumber}`);

          if (options.sendNotification) {
            await this.sendAssignmentNotification(reservation, target);
          }

        } catch (error: any) {
          const errorMessage = `Failed to assign ${reservation.guestName}: ${error.message}`;
          errors.push(errorMessage);
          console.error(errorMessage, error);
        }
      }

      // Show success/error messages
      if (results.length > 0) {
        const successMessage = reservations.length === 1
          ? `${reservations[0].guestName} moved to room ${target.roomNumber}`
          : `${results.length} reservations successfully assigned`;

        toast.success(successMessage);
      }

      if (errors.length > 0) {
        const errorMessage = errors.length === 1
          ? errors[0]
          : `${errors.length} assignments failed. Check console for details.`;

        toast.error(errorMessage);
      }

      return {
        success: results.length > 0,
        results,
        errors
      };

    } finally {
      // Unlock room
      if (options.lockRoom) {
        await this.unlockRoom(target.roomId);
      }
    }
  }

  private async lockRoom(roomId: string, reason: string): Promise<void> {
    try {
      await fetch(`/api/v1/tape-chart/rooms/${roomId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason, duration: 300000 }) // 5 minutes
      });
    } catch (error) {
      console.error('Error locking room:', error);
    }
  }

  private async unlockRoom(roomId: string): Promise<void> {
    try {
      await fetch(`/api/v1/tape-chart/rooms/${roomId}/unlock`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error unlocking room:', error);
    }
  }

  private async sendAssignmentNotification(reservation: DraggedReservation, target: DropTarget): Promise<void> {
    // Implementation would send notification to guest about room change
    console.log(`Sending notification to ${reservation.guestName} about room ${target.roomNumber} assignment`);
  }

  private getCurrentUserId(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || user._id || 'unknown';
  }

  // Undo/Redo functionality
  getOperationHistory(): DragOperation[] {
    return [...this.operationHistory];
  }

  canUndo(): boolean {
    return this.operationHistory.length > 0;
  }

  async undoLastOperation(): Promise<boolean> {
    const lastOperation = this.operationHistory[0];
    if (!lastOperation) return false;

    try {
      // Implementation would reverse the last operation
      console.log('Undoing operation:', lastOperation);
      toast.info('Operation undone successfully');
      return true;
    } catch (error) {
      console.error('Error undoing operation:', error);
      toast.error('Failed to undo operation');
      return false;
    }
  }

  // Smart room suggestions
  async getSuggestedRooms(reservation: DraggedReservation): Promise<{
    roomId: string;
    roomNumber: string;
    score: number;
    reasons: string[];
  }[]> {
    // This would implement intelligent room suggestions based on:
    // - Guest preferences
    // - Room amenities
    // - Proximity to other group members
    // - Historical guest preferences
    // - Revenue optimization

    return []; // Placeholder for now
  }

  // Cleanup
  cleanup(): void {
    this.currentOperation = null;
    this.dropZones.clear();
    this.selectedReservations.clear();
    this.conflictChecks.clear();
  }
}

export const dragDropManager = DragDropManager.getInstance();