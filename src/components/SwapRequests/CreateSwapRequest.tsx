import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format, isSameDay } from 'date-fns';
import { RefreshCw, Send, ArrowLeft, Users, Calendar, Clock } from 'lucide-react';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useNurseStore } from '../../stores/nurseStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Nurse, Shift } from '../../types';
import { LoadingSpinner } from '../Common/LoadingSpinner';

const schema = yup.object({
  targetNurseId: yup.string().required('Please select a nurse to swap with'),
  reason: yup.string().min(10, 'Please provide a detailed reason (minimum 10 characters)').required('Reason is required'),
  targetShiftId: yup.string().optional(),
});

type FormData = yup.InferType<typeof schema>;

interface CreateSwapRequestProps {
  nurseId: string;
  shiftId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

interface SwapSuggestion {
  nurse: Nurse;
  shift?: Shift;
  compatibility: number;
  reasons: string[];
}

export const CreateSwapRequest: React.FC<CreateSwapRequestProps> = ({
  nurseId,
  shiftId,
  onCancel,
  onSuccess,
}) => {
  const { shifts, createSwapRequest, loadingState } = useScheduleStore();
  const { nurses } = useNurseStore();
  const { addNotification } = useNotificationStore();
  
  const [suggestions, setSuggestions] = useState<SwapSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SwapSuggestion | null>(null);

  const currentShift = shifts.find(s => s.id === shiftId);
  const currentNurse = nurses.find(n => n.id === nurseId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      targetNurseId: '',
      reason: '',
      targetShiftId: '',
    },
  });

  const watchedTargetNurseId = watch('targetNurseId');

  useEffect(() => {
    if (!currentShift || !currentNurse) return;

    // Generate swap suggestions based on compatibility
    const generateSuggestions = () => {
      const eligibleNurses = nurses.filter(nurse => 
        nurse.id !== nurseId && 
        nurse.department === currentNurse.department &&
        nurse.preferredShifts.includes(currentShift.type)
      );

      const suggestions: SwapSuggestion[] = eligibleNurses.map(nurse => {
        // Find shifts this nurse is assigned to that the current nurse could take
        const nurseShifts = shifts.filter(shift => 
          shift.assignedNurses.includes(nurse.id) &&
          !isSameDay(new Date(shift.date), new Date(currentShift.date)) &&
          currentNurse.preferredShifts.includes(shift.type)
        );

        const compatibility = calculateCompatibility(currentNurse, nurse, currentShift);
        const reasons = getCompatibilityReasons(currentNurse, nurse, currentShift);

        return {
          nurse,
          shift: nurseShifts[0], // Take the first available shift
          compatibility,
          reasons,
        };
      });

      // Sort by compatibility score
      suggestions.sort((a, b) => b.compatibility - a.compatibility);
      setSuggestions(suggestions.slice(0, 5)); // Top 5 suggestions
    };

    generateSuggestions();
  }, [currentShift, currentNurse, nurses, shifts, nurseId]);

  const calculateCompatibility = (nurse1: Nurse, nurse2: Nurse, shift: Shift): number => {
    let score = 0;
    
    // Same department
    if (nurse1.department === nurse2.department) score += 30;
    
    // Preferred shift types
    if (nurse2.preferredShifts.includes(shift.type)) score += 25;
    
    // Experience level compatibility
    const experienceLevels = ['Junior', 'Mid', 'Senior', 'Expert'];
    const exp1 = experienceLevels.indexOf(nurse1.experienceLevel);
    const exp2 = experienceLevels.indexOf(nurse2.experienceLevel);
    score += Math.max(0, 20 - Math.abs(exp1 - exp2) * 5);
    
    // Specialization overlap
    const commonSpecs = nurse1.specializations.filter(spec => 
      nurse2.specializations.includes(spec)
    );
    score += commonSpecs.length * 5;

    return Math.min(100, score);
  };

  const getCompatibilityReasons = (nurse1: Nurse, nurse2: Nurse, shift: Shift): string[] => {
    const reasons: string[] = [];
    
    if (nurse1.department === nurse2.department) {
      reasons.push('Same department');
    }
    
    if (nurse2.preferredShifts.includes(shift.type)) {
      reasons.push('Prefers this shift type');
    }
    
    const commonSpecs = nurse1.specializations.filter(spec => 
      nurse2.specializations.includes(spec)
    );
    if (commonSpecs.length > 0) {
      reasons.push(`Shared specializations: ${commonSpecs.join(', ')}`);
    }

    return reasons;
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createSwapRequest({
        requesterId: nurseId,
        targetId: data.targetNurseId,
        shiftId: shiftId,
        targetShiftId: data.targetShiftId || undefined,
        reason: data.reason,
        status: 'Pending',
        autoMatched: !!selectedSuggestion,
      });
      
      addNotification({
        type: 'success',
        title: 'Swap request submitted',
        message: 'Your request has been sent for approval',
      });
      
      onSuccess();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to submit request',
        message: 'Please try again',
      });
    }
  };

  const selectSuggestion = (suggestion: SwapSuggestion) => {
    setSelectedSuggestion(suggestion);
    setValue('targetNurseId', suggestion.nurse.id);
    if (suggestion.shift) {
      setValue('targetShiftId', suggestion.shift.id);
    }
  };

  if (!currentShift || !currentNurse) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Invalid shift or nurse data</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Swap Request</h2>
                <p className="text-gray-600">Request to swap your shift with another nurse</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Shift Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Your Current Shift</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {format(new Date(currentShift.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">
                    {currentShift.startTime} - {currentShift.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">
                    {currentShift.department} - {currentShift.type} Shift
                  </span>
                </div>
              </div>

              {/* Suggested Matches */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Suggested Matches</h3>
                <div className="space-y-3">
                  {suggestions.map(suggestion => (
                    <div
                      key={suggestion.nurse.id}
                      onClick={() => selectSuggestion(suggestion)}
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all
                        ${selectedSuggestion?.nurse.id === suggestion.nurse.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {suggestion.nurse.firstName[0]}{suggestion.nurse.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {suggestion.nurse.firstName} {suggestion.nurse.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{suggestion.nurse.department}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${suggestion.compatibility >= 80 ? 'bg-green-100 text-green-800' :
                              suggestion.compatibility >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          `}>
                            {suggestion.compatibility}% match
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        {suggestion.reasons.join(' • ')}
                      </div>
                    </div>
                  ))}
                  
                  {suggestions.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No compatible matches found
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Nurse to Swap With *
                  </label>
                  <select
                    {...register('targetNurseId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a nurse...</option>
                    {nurses
                      .filter(nurse => nurse.id !== nurseId)
                      .map(nurse => (
                        <option key={nurse.id} value={nurse.id}>
                          {nurse.firstName} {nurse.lastName} - {nurse.department}
                        </option>
                      ))}
                  </select>
                  {errors.targetNurseId && (
                    <p className="mt-1 text-sm text-red-600">{errors.targetNurseId.message}</p>
                  )}
                </div>

                {watchedTargetNurseId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Shift (Optional)
                    </label>
                    <select
                      {...register('targetShiftId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No specific shift (general swap)</option>
                      {shifts
                        .filter(shift => 
                          shift.assignedNurses.includes(watchedTargetNurseId) &&
                          !isSameDay(new Date(shift.date), new Date(currentShift.date))
                        )
                        .map(shift => (
                          <option key={shift.id} value={shift.id}>
                            {format(new Date(shift.date), 'MMM d')} - {shift.type} ({shift.startTime}-{shift.endTime})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Swap Request *
                  </label>
                  <textarea
                    {...register('reason')}
                    rows={4}
                    placeholder="Please provide a detailed reason for the swap request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Important Notes</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Swap requests require manager approval</li>
                    <li>• Both nurses must meet shift requirements</li>
                    <li>• Requests are processed within 24 hours</li>
                    <li>• You'll be notified of the decision via email</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={loadingState.isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingState.isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {loadingState.isLoading ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};