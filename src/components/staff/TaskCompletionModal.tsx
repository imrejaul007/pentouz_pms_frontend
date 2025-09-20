import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { CheckCircle, Square, CheckSquare } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TaskStep {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  completed: boolean;
}

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (completedSteps: string[]) => void;
  title: string;
  taskName: string;
  steps: TaskStep[];
  loading?: boolean;
}

export function TaskCompletionModal({
  isOpen,
  onClose,
  onComplete,
  title,
  taskName,
  steps,
  loading = false
}: TaskCompletionModalProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [localSteps, setLocalSteps] = useState<TaskStep[]>([]);

  useEffect(() => {
    if (isOpen && steps) {
      setLocalSteps(steps);
      const alreadyCompleted = steps.filter(step => step.completed).map(step => step.id);
      setCompletedSteps(new Set(alreadyCompleted));
    }
  }, [isOpen, steps]);

  const toggleStep = (stepId: string) => {
    const newCompletedSteps = new Set(completedSteps);
    if (newCompletedSteps.has(stepId)) {
      newCompletedSteps.delete(stepId);
    } else {
      newCompletedSteps.add(stepId);
    }
    setCompletedSteps(newCompletedSteps);
  };

  const requiredSteps = localSteps.filter(step => step.required);
  const requiredCompleted = requiredSteps.filter(step => completedSteps.has(step.id));
  const canComplete = requiredCompleted.length === requiredSteps.length;
  const allStepsCompleted = localSteps.every(step => completedSteps.has(step.id));

  const handleComplete = () => {
    onComplete(Array.from(completedSteps));
  };

  const handleReset = () => {
    setCompletedSteps(new Set());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {/* Task Header */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">{taskName}</h3>
          <p className="text-sm text-blue-700">
            Complete the checklist below to mark this task as finished
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Progress: {completedSteps.size} of {localSteps.length} completed
            </span>
            <span className={cn(
              "font-medium",
              canComplete ? "text-green-600" : "text-orange-600"
            )}>
              {canComplete ? "Ready to complete" : `${requiredCompleted.length}/${requiredSteps.length} required`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                allStepsCompleted ? "bg-green-500" : canComplete ? "bg-blue-500" : "bg-orange-400"
              )}
              style={{
                width: `${(completedSteps.size / localSteps.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Steps Checklist */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {localSteps.map((step) => {
            const isCompleted = completedSteps.has(step.id);
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  isCompleted 
                    ? "bg-green-50 border-green-200 text-green-900" 
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                )}
                onClick={() => toggleStep(step.id)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckSquare className="h-5 w-5 text-green-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className={cn(
                      "font-medium",
                      isCompleted ? "line-through text-green-700" : "text-gray-900"
                    )}>
                      {step.label}
                    </p>
                    {step.required && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className={cn(
                      "text-sm mt-1",
                      isCompleted ? "text-green-600" : "text-gray-600"
                    )}>
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={loading || completedSteps.size === 0}
            >
              Reset All
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!canComplete || loading}
              className={cn(
                "flex items-center space-x-2",
                allStepsCompleted && "bg-green-600 hover:bg-green-700"
              )}
            >
              <CheckCircle className="h-4 w-4" />
              <span>{loading ? "Completing..." : "Complete Task"}</span>
            </Button>
          </div>
        </div>

        {/* Completion Status */}
        {!canComplete && requiredSteps.length > 0 && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> Please complete all required steps before marking this task as finished.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Helper function to generate default steps for different task types
export const getDefaultSteps = (taskType: 'housekeeping' | 'maintenance' | 'guest_service', specificType?: string) => {
  switch (taskType) {
    case 'housekeeping':
      return getHousekeepingSteps(specificType);
    case 'maintenance':
      return getMaintenanceSteps(specificType);
    case 'guest_service':
      return getGuestServiceSteps(specificType);
    default:
      return [];
  }
};

// Helper function to generate steps based on actual service variations
export const getServiceVariationSteps = (serviceVariations: string[], completedServiceVariations?: string[]) => {
  const steps: TaskStep[] = [];
  
  // Base steps
  steps.push({
    id: 'understand_request',
    label: 'Understand Request',
    description: 'Clearly understand what the guest is requesting',
    required: true,
    completed: false
  });

  // Add each service variation as a step
  serviceVariations.forEach((variation, index) => {
    steps.push({
      id: `service_${index}`,
      label: variation,
      description: `Complete: ${variation}`,
      required: true,
      completed: completedServiceVariations?.includes(variation) || false
    });
  });

  // Final steps
  steps.push({
    id: 'follow_up',
    label: 'Follow Up',
    description: 'Check with guest to ensure satisfaction',
    required: true,
    completed: false
  });

  return steps;
};

const getHousekeepingSteps = (type?: string): TaskStep[] => {
  const baseSteps: TaskStep[] = [
    {
      id: 'safety_check',
      label: 'Safety Check',
      description: 'Ensure room is safe to enter and work in',
      required: true,
      completed: false
    },
    {
      id: 'supplies_ready',
      label: 'Supplies Ready',
      description: 'Gather all necessary cleaning supplies and equipment',
      required: true,
      completed: false
    }
  ];

  if (type === 'cleaning' || type === 'checkout_clean') {
    return [
      ...baseSteps,
      {
        id: 'bed_linens',
        label: 'Change Bed Linens',
        description: 'Remove used linens and replace with fresh ones',
        required: true,
        completed: false
      },
      {
        id: 'bathroom_clean',
        label: 'Clean Bathroom',
        description: 'Clean toilet, shower, sink, and mirror',
        required: true,
        completed: false
      },
      {
        id: 'vacuum_floors',
        label: 'Vacuum/Clean Floors',
        description: 'Vacuum carpets or mop hard floors',
        required: true,
        completed: false
      },
      {
        id: 'dust_surfaces',
        label: 'Dust Surfaces',
        description: 'Dust all furniture, lamps, and surfaces',
        required: true,
        completed: false
      },
      {
        id: 'amenities_restock',
        label: 'Restock Amenities',
        description: 'Replace toiletries, towels, and other amenities',
        required: true,
        completed: false
      },
      {
        id: 'final_inspection',
        label: 'Final Inspection',
        description: 'Check room thoroughly for cleanliness and completeness',
        required: true,
        completed: false
      }
    ];
  }

  if (type === 'deep_clean') {
    return [
      ...baseSteps,
      {
        id: 'move_furniture',
        label: 'Move Furniture',
        description: 'Move furniture to clean underneath',
        required: false,
        completed: false
      },
      {
        id: 'deep_bathroom',
        label: 'Deep Clean Bathroom',
        description: 'Scrub tiles, grout, and deep clean all fixtures',
        required: true,
        completed: false
      },
      {
        id: 'carpet_shampoo',
        label: 'Carpet Shampooing',
        description: 'Shampoo carpets and upholstery if needed',
        required: false,
        completed: false
      },
      {
        id: 'window_cleaning',
        label: 'Clean Windows',
        description: 'Clean all windows inside and outside if accessible',
        required: true,
        completed: false
      }
    ];
  }

  return baseSteps;
};

const getMaintenanceSteps = (type?: string): TaskStep[] => {
  const baseSteps: TaskStep[] = [
    {
      id: 'safety_assessment',
      label: 'Safety Assessment',
      description: 'Assess work area for safety hazards',
      required: true,
      completed: false
    },
    {
      id: 'tools_equipment',
      label: 'Gather Tools & Equipment',
      description: 'Collect all necessary tools and equipment',
      required: true,
      completed: false
    }
  ];

  if (type === 'plumbing') {
    return [
      ...baseSteps,
      {
        id: 'water_shutoff',
        label: 'Turn Off Water',
        description: 'Shut off water supply if necessary',
        required: true,
        completed: false
      },
      {
        id: 'repair_work',
        label: 'Complete Repair Work',
        description: 'Perform the necessary plumbing repairs',
        required: true,
        completed: false
      },
      {
        id: 'test_functionality',
        label: 'Test Functionality',
        description: 'Test the repair to ensure it works properly',
        required: true,
        completed: false
      },
      {
        id: 'cleanup',
        label: 'Clean Up Area',
        description: 'Clean work area and dispose of debris',
        required: true,
        completed: false
      }
    ];
  }

  if (type === 'electrical') {
    return [
      ...baseSteps,
      {
        id: 'power_shutoff',
        label: 'Turn Off Power',
        description: 'Shut off electrical power at circuit breaker',
        required: true,
        completed: false
      },
      {
        id: 'electrical_work',
        label: 'Complete Electrical Work',
        description: 'Perform the necessary electrical repairs',
        required: true,
        completed: false
      },
      {
        id: 'test_electrical',
        label: 'Test Electrical Systems',
        description: 'Test to ensure electrical work is functioning safely',
        required: true,
        completed: false
      }
    ];
  }

  return [
    ...baseSteps,
    {
      id: 'complete_work',
      label: 'Complete Work',
      description: 'Finish the maintenance task',
      required: true,
      completed: false
    },
    {
      id: 'test_result',
      label: 'Test Result',
      description: 'Verify the work was completed successfully',
      required: true,
      completed: false
    }
  ];
};

const getGuestServiceSteps = (type?: string): TaskStep[] => {
  const baseSteps: TaskStep[] = [
    {
      id: 'understand_request',
      label: 'Understand Request',
      description: 'Clearly understand what the guest is requesting',
      required: true,
      completed: false
    },
    {
      id: 'gather_resources',
      label: 'Gather Resources',
      description: 'Collect everything needed to fulfill the request',
      required: true,
      completed: false
    }
  ];

  if (type === 'room_service') {
    return [
      ...baseSteps,
      {
        id: 'prepare_order',
        label: 'Prepare Order',
        description: 'Prepare or coordinate the room service order',
        required: true,
        completed: false
      },
      {
        id: 'deliver_service',
        label: 'Deliver Service',
        description: 'Deliver the service to the guest room',
        required: true,
        completed: false
      },
      {
        id: 'guest_satisfaction',
        label: 'Confirm Guest Satisfaction',
        description: 'Ensure the guest is satisfied with the service',
        required: true,
        completed: false
      }
    ];
  }

  return [
    ...baseSteps,
    {
      id: 'fulfill_request',
      label: 'Fulfill Request',
      description: 'Complete the guest service request',
      required: true,
      completed: false
    },
    {
      id: 'follow_up',
      label: 'Follow Up',
      description: 'Check with guest to ensure satisfaction',
      required: true,
      completed: false
    }
  ];
};