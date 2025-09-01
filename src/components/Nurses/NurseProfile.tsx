import React from 'react';
import { Mail, Phone, Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Nurse, WorkloadData as Workload } from '../../types';
import { useScheduleStore } from '../../stores/scheduleStore';

interface NurseProfileProps {
  nurse: Nurse;
}

export const NurseProfile: React.FC<NurseProfileProps> = ({ nurse }) => {
  const { shifts, workloadData: workloads } = useScheduleStore();
  
  // Filter shifts for this nurse
  const nurseShifts = shifts.filter(shift => 
    shift.assignedNurses.includes(nurse.id)
  );
  
  // Get workload data for this nurse
  const nurseWorkload = workloads.find(w => 
    w.nurseId === nurse.id && 
    w.month === new Date().getMonth() && 
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
    const weekendShifts = nurseShifts.filter(shift => 
      shift.date.getDay() === 0 || shift.date.getDay() === 6
    ).length;

    return { totalHours, nightShifts, weekendShifts };
  };

  const shiftStats = getShiftStats();

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
              <span>Preferred Shift: {nurse.preferredShifts || 'Any'}</span>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Shifts</h3>
        
        {nurseShifts.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming shifts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nurseShifts.slice(0, 5).map(shift => (
              <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {shift.date.toLocaleDateString()} • {shift.type} Shift
                  </p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};