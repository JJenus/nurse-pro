import React from 'react';
import { Mail, Phone, Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { format, isToday, isFuture, isPast, parseISO } from 'date-fns';
import { Nurse, WorkloadData as Workload } from '../../types';
import { useScheduleStore } from '../../stores/scheduleStore';

interface NurseProfileProps {
  nurse: Nurse;
}

export const NurseProfile: React.FC<NurseProfileProps> = ({ nurse }) => {
  const { shifts, workloadData: workloads } = useScheduleStore();
  
  // Filter shifts for this nurse and ensure date is Date object
  const nurseShifts = shifts.filter(shift => 
    shift.assignedNurses.includes(nurse.id)
  ).map(shift => ({
    ...shift,
    date: new Date(shift.date) // Convert string to Date object
  }));
  
  // Sort shifts: upcoming first (future dates), then past dates
  const sortedShifts = [...nurseShifts].sort((a, b) => {
    // Future dates first (most recent future first)
    if (isFuture(a.date) && isFuture(b.date)) {
      return a.date.getTime() - b.date.getTime(); // Ascending order for future dates
    }
    if (isFuture(a.date)) return -1;
    if (isFuture(b.date)) return 1;
    
    // Past dates last (most recent past first)
    return b.date.getTime() - a.date.getTime(); // Descending order for past dates
  });

  // Get workload data for this nurse
  const nurseWorkload = workloads.find(w => 
    w.nurseId === nurse.id && 
    w.month === new Date().getMonth() + 1 && // Months are 1-12 in your backend
    w.year === new Date().getFullYear()
  );

  const experienceColors = {
    Junior: 'bg-blue-100 text-blue-800',
    Mid: 'bg-green-100 text-green-800',
    Senior: 'bg-orange-100 text-orange-800',
    Expert: 'bg-purple-100 text-purple-800',
  };

  const getShiftStats = () => {
    const totalHours = nurseShifts.reduce((total, shift) => {
      const [startHour] = shift.startTime.split(':').map(Number);
      const [endHour] = shift.endTime.split(':').map(Number);
      const duration = endHour > startHour ? endHour - startHour : (24 - startHour + endHour);
      return total + duration;
    }, 0);

    const nightShifts = nurseShifts.filter(shift => shift.type === 'Night').length;
    const weekendShifts = nurseShifts.filter(shift => {
      const dayOfWeek = shift.date.getDay(); // Now this will work
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
    }).length;

    return { totalHours, nightShifts, weekendShifts };
  };

  const shiftStats = getShiftStats();

  // Get shift status color
  const getShiftStatusColor = (date: Date) => {
    if (isToday(date)) {
      return 'bg-green-50 border-green-200'; // Today - green
    } else if (isFuture(date)) {
      return 'bg-yellow-50 border-yellow-200'; // Future - yellow
    } else {
      return 'bg-red-50 border-red-200'; // Past - red
    }
  };

  // Get shift status text
  const getShiftStatusText = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isFuture(date)) {
      return 'Upcoming';
    } else {
      return 'Past';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {nurse.firstName[0]}{nurse.lastName[0]}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {nurse.firstName} {nurse.lastName}
                </h1>
                <p className="text-gray-600">{nurse.department}</p>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${experienceColors[nurse.experienceLevel]}`}>
                {nurse.experienceLevel}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                {nurse.email}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                {nurse.phone}
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Specializations:</p>
              <div className="flex flex-wrap gap-2">
                {nurse.specializations.map((spec, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Max Hours: {nurse.maxHoursPerWeek}h/week</span>
              <span>•</span>
              <span>Preferred Shift: {nurse.preferredShifts.join(', ') || 'Any'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Shifts</p>
              <p className="text-2xl font-bold text-gray-900">{nurseShifts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{shiftStats.totalHours}h</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Night Shifts</p>
              <p className="text-2xl font-bold text-gray-900">{shiftStats.nightShifts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Weekend Shifts</p>
              <p className="text-2xl font-bold text-gray-900">{shiftStats.weekendShifts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workload Analysis */}
      {nurseWorkload && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workload Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {nurseWorkload.consecutiveDays}
              </div>
              <p className="text-sm text-gray-600">Max Consecutive Days</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {nurseWorkload.nightShifts}
              </div>
              <p className="text-sm text-gray-600">Night Shifts</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {nurseWorkload.weekendShifts}
              </div>
              <p className="text-sm text-gray-600">Weekend Shifts</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Weekly Hours</span>
              <span className="text-sm text-gray-600">{nurseWorkload.totalHours}h / {nurse.maxHoursPerWeek}h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  nurseWorkload.totalHours > nurse.maxHoursPerWeek 
                    ? 'bg-red-500' 
                    : nurseWorkload.totalHours > nurse.maxHoursPerWeek * 0.8
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (nurseWorkload.totalHours / nurse.maxHoursPerWeek) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Shifts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shifts</h3>
        
        {sortedShifts.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No shifts scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedShifts.slice(0, 10).map(shift => {
              const statusColor = getShiftStatusColor(shift.date);
              const statusText = getShiftStatusText(shift.date);
              
              return (
                <div 
                  key={shift.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${statusColor}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-gray-900">
                        {format(shift.date, 'dd/MM/yyyy')} • {shift.type} Shift
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isToday(shift.date) 
                          ? 'bg-green-100 text-green-800' 
                          : isFuture(shift.date)
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {statusText}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {shift.startTime} - {shift.endTime} • {shift.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {shift.assignedNurses.length}/{shift.requiredStaff} staffed
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};