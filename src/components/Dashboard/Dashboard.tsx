import React, { useEffect } from 'react';
import { Users, Calendar, Clock, AlertTriangle, TrendingUp, CheckCircle, Info } from 'lucide-react';
import { useNurseStore } from '../../stores/nurseStore';
import { useScheduleStore } from '../../stores/scheduleStore';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { isToday, format } from 'date-fns';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  change?: string;
}> = ({ title, value, icon: Icon, color, change }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {change && (
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            {change}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { nurses, fetchNurses, loadingState: nursesLoading } = useNurseStore();
  const { 
    currentSchedule, 
    shifts, 
    swapRequests, 
    fetchSchedules,
    loadingState: scheduleLoading 
  } = useScheduleStore();

  useEffect(() => {
    fetchNurses();
    fetchSchedules();
  }, [fetchNurses, fetchSchedules]);

  const isLoading = nursesLoading.isLoading || scheduleLoading.isLoading;

  // Filter shifts for today only and ensure date is Date object
  const todaysShifts = shifts
    .filter(shift => {
      const shiftDate = new Date(shift.date);
      return isToday(shiftDate);
    })
    .map(shift => ({
      ...shift,
      date: new Date(shift.date) // Convert string to Date object
    }));

  const stats = [
    {
      title: 'Total Nurses',
      value: nurses.length,
      icon: Users,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: '+2 this month',
    },
    {
      title: "Today's Shifts",
      value: todaysShifts.length,
      icon: Calendar,
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    },
    {
      title: 'Pending Swaps',
      value: swapRequests.filter(req => req.status === 'Pending').length,
      icon: Clock,
      color: 'bg-gradient-to-r from-amber-500 to-amber-600',
    },
    {
      title: 'Coverage Rate',
      value: `${Math.round((todaysShifts.filter(shift => shift.assignedNurses.length >= shift.requiredStaff).length / Math.max(1, todaysShifts.length)) * 100)}%`,
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="large" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            change={stat.change}
          />
        ))}
      </div>

      {/* Recent Activity & Schedule Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {swapRequests.slice(0, 3).map((request) => {
              const requester = nurses.find(n => n.id === request.requesterId);
              const target = nurses.find(n => n.id === request.targetId);
              
              return (
                <div key={request.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">
                        {requester?.firstName} {requester?.lastName}
                      </span> requested to swap with{' '}
                      <span className="font-medium">
                        {target?.firstName} {target?.lastName}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()} • {request.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
            <span className="text-sm text-gray-500">
              {format(new Date(), 'EEEE, MMMM d')}
            </span>
          </div>
          
          {todaysShifts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No shifts scheduled for today</p>
              <p className="text-sm text-gray-500 mt-1">
                All nurses are off duty or no shifts are planned
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysShifts.map((shift) => {
                const assignedNurses = shift.assignedNurses.map(nurseId => 
                  nurses.find(n => n.id === nurseId)
                ).filter(Boolean);
                
                return (
                  <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {shift.department} - {shift.type} Shift
                      </p>
                      <p className="text-sm text-gray-600">
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {shift.assignedNurses.length}/{shift.requiredStaff} staffed
                      </p>
                      {shift.assignedNurses.length < shift.requiredStaff && (
                        <p className="text-xs text-red-600 flex items-center gap-1 justify-end">
                          <AlertTriangle className="h-3 w-3" />
                          Understaffed
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};