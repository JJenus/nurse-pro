import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import { X, Users, Clock, Calendar, Building, AlertTriangle, Edit } from 'lucide-react';
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title as="h2" className="text-xl font-semibold text-gray-900">
                    Shift Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {/* Shift Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium text-gray-900">{formatDate(shift.date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="font-medium text-gray-900">{shift.startTime} - {shift.endTime}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${shiftTypeColors[shift.type].split(' ')[0]}`} />
                        <div>
                          <p className="text-sm text-gray-500">Shift Type</p>
                          <p className="font-medium text-gray-900">{shift.type}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-medium text-gray-900">{shift.department}</p>
                        </div>
                      </div>
                    </div>

                    {/* Staffing Status */}
                    <div className={`p-4 rounded-lg border ${isUnderstaffed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          <span className="font-medium text-gray-900">Staffing</span>
                        </div>
                        <div className={`flex items-center gap-2 ${isUnderstaffed ? 'text-red-600' : 'text-green-600'}`}>
                          {isUnderstaffed && <AlertTriangle className="h-4 w-4" />}
                          <span className="font-medium">{shift.assignedNurses.length}/{shift.requiredStaff}</span>
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
                                <p className="font-medium text-gray-900">{nurse.firstName} {nurse.lastName}</p>
                                <p className="text-sm text-gray-500">{nurse.experienceLevel} • {nurse.department}</p>
                              </div>
                              <div className="text-sm text-gray-500 text-right">
                                <div className="text-xs text-gray-400">Specializations:</div>
                                <div>{nurse.specializations.slice(0, 2).join(', ')}</div>
                                {nurse.specializations.length > 2 && (
                                  <div className="text-xs text-gray-400">
                                    +{nurse.specializations.length - 2} more
                                  </div>
                                )}
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
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
                  >
                    Close
                  </button>
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Shift
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};