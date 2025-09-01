import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, Clock, Edit, Trash2, Plus } from 'lucide-react';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useNurseStore } from '../../stores/nurseStore';
import { useUIStore } from '../../stores/uiStore';
import { Shift } from '../../types';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface ScheduleTableProps {
  onShiftClick: (shift: Shift) => void;
  onAddShift: (date: Date) => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  onShiftClick,
  onAddShift,
}) => {
  const { shifts, loadingState } = useScheduleStore();
  const { nurses } = useNurseStore();
  const { selectedDate, setSelectedDate } = useUIStore();
  
  const [currentWeek, setCurrentWeek] = useState(selectedDate);

  const weekStart = startOfWeek(currentWeek);
  const weekEnd = endOfWeek(currentWeek);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.date), date));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -7 : 7;
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + days);
    setCurrentWeek(newWeek);
  };

  const getShiftTypeOrder = (type: string) => {
    const order = { Day: 1, Evening: 2, Night: 3 };
    return order[type as keyof typeof order] || 4;
  };

  if (loadingState.isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Table Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Shift Type
              </th>
              {weekDays.map(day => (
                <th key={day.toISOString()} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>
                    <div>{format(day, 'EEE')}</div>
                    <div className="font-bold text-gray-900">{format(day, 'd')}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {['Day', 'Evening', 'Night'].map(shiftType => (
              <tr key={shiftType} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-3 h-3 rounded-full
                      ${shiftType === 'Day' ? 'bg-yellow-500' : ''}
                      ${shiftType === 'Evening' ? 'bg-orange-500' : ''}
                      ${shiftType === 'Night' ? 'bg-indigo-500' : ''}
                    `} />
                    <span className="font-medium text-gray-900">{shiftType}</span>
                  </div>
                </td>
                
                {weekDays.map(day => {
                  const dayShifts = getShiftsForDate(day)
                    .filter(shift => shift.type === shiftType)
                    .sort((a, b) => getShiftTypeOrder(a.type) - getShiftTypeOrder(b.type));

                  return (
                    <td key={`${day.toISOString()}-${shiftType}`} className="px-4 py-4 text-center">
                      {dayShifts.length > 0 ? (
                        <div className="space-y-2">
                          {dayShifts.map(shift => {
                            const assignedNurses = shift.assignedNurses
                              .map(id => nurses.find(n => n.id === id))
                              .filter(Boolean);
                            const isUnderstaffed = shift.assignedNurses.length < shift.requiredStaff;

                            return (
                              <div
                                key={shift.id}
                                onClick={() => onShiftClick(shift)}
                                className={`
                                  p-2 border rounded-lg cursor-pointer transition-all hover:shadow-md
                                  ${isUnderstaffed 
                                    ? 'border-red-300 bg-red-50' 
                                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                  }
                                `}
                              >
                                <div className="text-xs font-medium text-gray-900 mb-1">
                                  {shift.department}
                                </div>
                                <div className="text-xs text-gray-600 mb-1">
                                  {shift.startTime}-{shift.endTime}
                                </div>
                                <div className="flex items-center justify-center gap-1 text-xs">
                                  <Users className="h-3 w-3" />
                                  <span className={isUnderstaffed ? 'text-red-600 font-medium' : ''}>
                                    {shift.assignedNurses.length}/{shift.requiredStaff}
                                  </span>
                                </div>
                                
                                {assignedNurses.length > 0 && (
                                  <div className="mt-1 text-xs text-gray-700">
                                    {assignedNurses.slice(0, 2).map(nurse => nurse?.firstName).join(', ')}
                                    {assignedNurses.length > 2 && ` +${assignedNurses.length - 2}`}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddShift(day)}
                          className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4 text-gray-400" />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};