import React from 'react';
import { format } from 'date-fns';
import { X, Users, Clock, Calendar, Building, AlertTriangle } from 'lucide-react';
import { Shift, Nurse } from '../../types';

interface ShiftDetailsModalProps {
  shift: Shift;
  nurses: Nurse[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export const ShiftDetailsModal: React.FC<ShiftDetailsModalProps> = ({
  shift,
  nurses,
  isOpen,
  onClose,
  onEdit,
}) => {
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy');
  };

  if (!isOpen) return null;

  const assignedNurses = shift.assignedNurses
    .map(id => nurses.find(n => n.id === id))
    .filter(Boolean) as Nurse[];

  const isUnderstaffed = shift.assignedNurses.length < shift.requiredStaff;
  const shiftTypeColors = {
    Day: 'bg-yellow-100 text-yellow-800',
    Evening: 'bg-orange-100 text-orange-800',
    Night: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Shift Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Shift Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(shift.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{shift.startTime} - {shift.endTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${shiftTypeColors[shift.type].split(' ')[0]}`} />
              <div>
                <p className="text-sm text-gray-500">Shift Type</p>
                <p className="font-medium">{shift.type}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{shift.department}</p>
              </div>
            </div>
          </div>

          {/* Staffing Status */}
          <div className={`p-4 rounded-lg border ${isUnderstaffed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-medium">Staffing</span>
              </div>
              <div className={`flex items-center gap-2 ${isUnderstaffed ? 'text-red-600' : 'text-green-600'}`}>
                {isUnderstaffed && <AlertTriangle className="h-4 w-4" />}
                <span>{shift.assignedNurses.length}/{shift.requiredStaff}</span>
              </div>
            </div>
            {isUnderstaffed && (
              <p className="text-sm text-red-600 mt-2">
                This shift is understaffed by {shift.requiredStaff - shift.assignedNurses.length} nurses.
              </p>
            )}
          </div>

          {/* Assigned Nurses */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Nurses</h3>
            {assignedNurses.length > 0 ? (
              <div className="space-y-3">
                {assignedNurses.map(nurse => (
                  <div key={nurse.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{nurse.firstName} {nurse.lastName}</p>
                      <p className="text-sm text-gray-500">{nurse.experienceLevel} • {nurse.department}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {nurse.specializations.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No nurses assigned to this shift.</p>
            )}
          </div>

          {/* Requirements */}
          {shift.requirements && shift.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Special Requirements</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {shift.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Shift
          </button>
        </div>
      </div>
    </div>
  );
};