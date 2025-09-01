import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Users, Clock, AlertTriangle } from 'lucide-react';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useNurseStore } from '../../stores/nurseStore';
import { Shift, Nurse } from '../../types';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface ScheduleCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onShiftClick: (shift: Shift) => void;
  onAddShift: (date: Date) => void;
}

const ShiftCard: React.FC<{
  shift: Shift;
  nurses: Nurse[];
  onClick: () => void;
}> = ({ shift, nurses, onClick }) => {
  const assignedNurses = shift.assignedNurses
    .map(id => nurses.find(n => n.id === id))
    .filter(Boolean) as Nurse[];

  const isUnderstaffed = shift.assignedNurses.length < shift.requiredStaff;
  const shiftTypeColors = {
    Day: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    Evening: 'bg-orange-100 border-orange-300 text-orange-800',
    Night: 'bg-indigo-100 border-indigo-300 text-indigo-800',
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-2 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
        ${shiftTypeColors[shift.type]}
        ${isUnderstaffed ? 'ring-2 ring-red-300' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold">
          {shift.type}
        </span>
        {isUnderstaffed && (
          <AlertTriangle className="h-3 w-3 text-red-500" />
        )}
      </div>
      
      <div className="text-xs text-gray-600 mb-1">
        {shift.startTime} - {shift.endTime}
      </div>
      
      <div className="flex items-center gap-1 text-xs">
        <Users className="h-3 w-3" />
        <span className={isUnderstaffed ? 'text-red-600 font-medium' : ''}>
          {shift.assignedNurses.length}/{shift.requiredStaff}
        </span>
      </div>
      
      {assignedNurses.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {assignedNurses.slice(0, 2).map(nurse => (
            <span
              key={nurse.id}
              className="text-xs bg-white bg-opacity-70 px-1 py-0.5 rounded"
            >
              {nurse.firstName[0]}{nurse.lastName[0]}
            </span>
          ))}
          {assignedNurses.length > 2 && (
            <span className="text-xs bg-white bg-opacity-70 px-1 py-0.5 rounded">
              +{assignedNurses.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  selectedDate,
  onDateSelect,
  onShiftClick,
  onAddShift,
}) => {
  const { shifts, loadingState } = useScheduleStore();
  const { nurses } = useNurseStore();
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = subDays(monthStart, monthStart.getDay());
  const calendarEnd = addDays(monthEnd, 6 - monthEnd.getDay());
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.date), date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' 
      ? subDays(monthStart, 1)
      : addDays(monthEnd, 1);
    setCurrentMonth(newMonth);
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
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(day => {
            const dayShifts = getShiftsForDate(day);
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all
                  ${isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                  ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''}
                  ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                  hover:shadow-sm
                `}
                onClick={() => onDateSelect(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`
                    text-sm font-medium
                    ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${isToday ? 'text-blue-600 font-bold' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {isCurrentMonth && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddShift(day);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Plus className="h-3 w-3 text-gray-500" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {dayShifts.slice(0, 3).map(shift => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      nurses={nurses}
                      onClick={() => onShiftClick(shift)}
                    />
                  ))}
                  
                  {dayShifts.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{dayShifts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};