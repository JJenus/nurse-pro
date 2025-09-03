import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { format, isSameDay } from 'date-fns';
import { Users, Clock, AlertTriangle, Edit, Trash2, Plus } from 'lucide-react';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useNurseStore } from '../../stores/nurseStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Shift, Nurse, ScheduleConflict } from '../../types';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface ScheduleEditorProps {
  selectedDate: Date;
  onShiftEdit: (shift: Shift) => void;
  onShiftAdd: (date: Date) => void;
}

const ShiftItem: React.FC<{
  shift: Shift;
  nurses: Nurse[];
  conflicts: ScheduleConflict[];
  onEdit: () => void;
  onDelete: () => void;
}> = ({ shift, nurses, conflicts, onEdit, onDelete }) => {
  const assignedNurses = shift.assignedNurses
    .map(id => nurses.find(n => n.id === id))
    .filter(Boolean) as Nurse[];

  const shiftConflicts = conflicts.filter(c => c.shiftId === shift.id);
  const hasConflicts = shiftConflicts.length > 0;
  const isUnderstaffed = shift.assignedNurses.length < shift.requiredStaff;

  const shiftTypeColors = {
    Day: 'border-l-yellow-500 bg-yellow-50',
    Evening: 'border-l-orange-500 bg-orange-50',
    Night: 'border-l-indigo-500 bg-indigo-50',
  };

  return (
    <div className={`
      p-4 border-l-4 bg-white rounded-lg shadow-sm border border-gray-200
      ${shiftTypeColors[shift.type]}
      ${hasConflicts ? 'ring-2 ring-red-300' : ''}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            {shift.department} - {shift.type} Shift
          </h4>
          <p className="text-sm text-gray-600">
            {shift.startTime} - {shift.endTime}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Staffing Status */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-gray-500" />
        <span className={`text-sm font-medium ${isUnderstaffed ? 'text-red-600' : 'text-green-600'}`}>
          {shift.assignedNurses.length}/{shift.requiredStaff} staffed
        </span>
        {isUnderstaffed && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
            Understaffed
          </span>
        )}
      </div>

      {/* Assigned Nurses */}
      <Droppable droppableId={`shift-${shift.id}`} direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex flex-wrap gap-2 min-h-[40px] p-2 border-2 border-dashed rounded-lg transition-colors
              ${snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
            `}
          >
            {assignedNurses.map((nurse, index) => (
              <Draggable key={nurse.id} draggableId={nurse.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
                      flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm
                      ${snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'}
                      transition-all cursor-move
                    `}
                    style={provided.draggableProps.style}
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {nurse.firstName[0]}{nurse.lastName[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {nurse.firstName} {nurse.lastName}
                    </span>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {assignedNurses.length === 0 && (
              <div className="flex items-center justify-center w-full text-gray-400 text-sm">
                Drop nurses here to assign
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Conflicts */}
      {hasConflicts && (
        <div className="mt-3 space-y-2">
          {shiftConflicts.map(conflict => (
            <div key={conflict.id} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">{conflict.message}</p>
                {conflict.suggestions && conflict.suggestions.length > 0 && (
                  <ul className="text-xs text-red-700 mt-1 space-y-1">
                    {conflict.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  selectedDate,
  onShiftEdit,
  onShiftAdd,
}) => {
  const { shifts, updateShift, loadingState } = useScheduleStore();
  const { nurses, loadingState: nursesLoading } = useNurseStore();
  const { addNotification } = useNotificationStore();
  
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [availableNurses, setAvailableNurses] = useState<Nurse[]>([]);

  // Memoize the day shifts to prevent unnecessary recalculations
  const dayShifts = useMemo(() => {
    return shifts.filter(shift => isSameDay(new Date(shift.date), selectedDate));
  }, [shifts, selectedDate]);

  // Calculate conflicts and available nurses
  useEffect(() => {
    // Mock conflict detection
    const mockConflicts: ScheduleConflict[] = dayShifts
      .filter(shift => shift.assignedNurses.length < shift.requiredStaff)
      .map(shift => ({
        id: `conflict-${shift.id}`,
        type: 'understaffed',
        severity: 'high',
        shiftId: shift.id,
        message: `${shift.department} ${shift.type} shift is understaffed`,
        suggestions: [
          'Consider moving nurses from overstaffed shifts',
          'Check for available nurses with matching qualifications',
          'Review overtime policies for additional coverage',
        ],
      }));

    setConflicts(mockConflicts);

    // Set available nurses (those not assigned to any shift on this date)
    const assignedNurseIds = new Set(dayShifts.flatMap(shift => shift.assignedNurses));
    const available = nurses.filter(nurse => !assignedNurseIds.has(nurse.id));
    setAvailableNurses(available);
  }, [dayShifts, nurses]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    const nurseId = draggableId;
    const sourceShiftId = source.droppableId.replace('shift-', '');
    const destShiftId = destination.droppableId.replace('shift-', '');

    if (sourceShiftId === destShiftId) return;

    try {
      // Remove from source shift (if not coming from available pool)
      if (sourceShiftId !== 'available') {
        const sourceShift = shifts.find(s => s.id === sourceShiftId);
        if (sourceShift) {
          await updateShift(sourceShiftId, {
            assignedNurses: sourceShift.assignedNurses.filter(id => id !== nurseId),
          });
        }
      }

      // Add to destination shift (if not going back to available pool)
      if (destShiftId !== 'available') {
        const destShift = shifts.find(s => s.id === destShiftId);
        if (destShift) {
          await updateShift(destShiftId, {
            assignedNurses: [...destShift.assignedNurses, nurseId],
          });
        }
      }

      addNotification({
        type: 'success',
        title: 'Nurse assignment updated',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to update assignment',
        message: 'Please try again',
      });
    }
  }, [shifts, updateShift, addNotification]);

  // Show loading if nurses or shifts are still loading
  if (loadingState.isLoading || nursesLoading.isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Schedule for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-gray-600">
              {dayShifts.length} shifts • {conflicts.length} conflicts
            </p>
          </div>
          
          <button
            onClick={() => onShiftAdd(selectedDate)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Shift
          </button>
        </div>

        {/* Conflicts Summary */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Schedule Conflicts Detected</h3>
                <p className="text-sm text-red-700 mt-1">
                  {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} attention
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Available Nurses */}
          <div className="">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Available Nurses</h3>
              
              <Droppable droppableId="available" direction="vertical">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      space-y-2 min-h-[200px] p-2 border-2 border-dashed rounded-lg transition-colors
                      ${snapshot.isDraggingOver ? 'border-green-400 bg-green-50' : 'border-gray-200'}
                    `}
                  >
                    {availableNurses.map((nurse, index) => (
                      <Draggable key={nurse.id} draggableId={nurse.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-3 shadow-sm
                              ${snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'}
                              transition-all cursor-move
                            `}
                            style={provided.draggableProps.style}
                          >
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {nurse.firstName[0]}{nurse.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {nurse.firstName} {nurse.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{nurse.department}</p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {availableNurses.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        All nurses assigned
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* Shifts */}
          <div className="">
            <div className="space-y-4">
              {dayShifts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shifts Scheduled</h3>
                  <p className="text-gray-600 mb-4">
                    No shifts are scheduled for {format(selectedDate, 'MMMM d, yyyy')}
                  </p>
                  <button
                    onClick={() => onShiftAdd(selectedDate)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Shift
                  </button>
                </div>
              ) : (
                dayShifts.map(shift => (
                  <ShiftItem
                    key={shift.id}
                    shift={shift}
                    nurses={nurses}
                    conflicts={conflicts}
                    onEdit={() => onShiftEdit(shift)}
                    onDelete={() => {
                      // Handle shift deletion
                      if (window.confirm('Are you sure you want to delete this shift?')) {
                        addNotification({
                          type: 'success',
                          title: 'Shift deleted successfully',
                        });
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};