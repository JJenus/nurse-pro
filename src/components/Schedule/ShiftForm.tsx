import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { Save, X, Clock, Users, Building } from 'lucide-react';
import { Shift } from '../../types';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { LoadingSpinner } from '../Common/LoadingSpinner';

const schema = yup.object({
  department: yup.string().required('Department is required'),
  type: yup.string().oneOf(['Day', 'Evening', 'Night']).required('Shift type is required'),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  requiredStaff: yup.number().min(1, 'At least 1 staff member required').max(20, 'Maximum 20 staff members').required('Required staff is required'),
  requirements: yup.array().of(yup.string()).optional(),
});

type FormData = yup.InferType<typeof schema>;

interface ShiftFormProps {
  shift?: Shift;
  date: Date;
  onCancel: () => void;
  onSuccess: () => void;
}

const departments = ['ICU', 'Emergency', 'Surgery', 'Pediatrics', 'Cardiology', 'Neurology', 'Oncology'];
const availableRequirements = [
  'Critical Care', 'Emergency', 'Trauma', 'Pediatric Care', 'Neonatal', 
  'Surgical Care', 'Anesthesia', 'Cardiology', 'Neurology', 'Oncology'
];

const defaultShiftTimes = {
  Day: { start: '07:00', end: '19:00' },
  Evening: { start: '15:00', end: '23:00' },
  Night: { start: '23:00', end: '07:00' },
};

export const ShiftForm: React.FC<ShiftFormProps> = ({ shift, date, onCancel, onSuccess }) => {
  const { createShift, updateShift, loadingState } = useScheduleStore();
  const { addNotification } = useNotificationStore();
  const isEditing = !!shift;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: shift ? {
      department: shift.department,
      type: shift.type,
      startTime: shift.startTime,
      endTime: shift.endTime,
      requiredStaff: shift.requiredStaff,
      requirements: shift.requirements || [],
    } : {
      department: '',
      type: 'Day',
      startTime: '07:00',
      endTime: '19:00',
      requiredStaff: 2,
      requirements: [],
    },
  });

  const watchedType = watch('type');
  const watchedRequirements = watch('requirements') || [];

  // Auto-update times when shift type changes
  React.useEffect(() => {
    if (watchedType && !isEditing) {
      const times = defaultShiftTimes[watchedType as keyof typeof defaultShiftTimes];
      setValue('startTime', times.start);
      setValue('endTime', times.end);
    }
  }, [watchedType, setValue, isEditing]);

  const handleRequirementToggle = (requirement: string) => {
    const current = watchedRequirements;
    if (current.includes(requirement)) {
      setValue('requirements', current.filter(r => r !== requirement));
    } else {
      setValue('requirements', [...current, requirement]);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const shiftData = {
        ...data,
        date,
        assignedNurses: shift?.assignedNurses || [],
      };

      if (isEditing && shift) {
        await updateShift(shift.id, shiftData);
        addNotification({
          type: 'success',
          title: 'Shift updated successfully',
        });
      } else {
        await createShift(shiftData);
        addNotification({
          type: 'success',
          title: 'Shift created successfully',
        });
      }
      onSuccess();
    } catch (error) {
      addNotification({
        type: 'error',
        title: `Failed to ${isEditing ? 'update' : 'create'} shift`,
        message: 'Please try again',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Shift' : 'Add New Shift'}
              </h2>
              <p className="text-gray-600">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shift Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  {...register('department')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Type *
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Day">Day Shift</option>
                  <option value="Evening">Evening Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  {...register('startTime')}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  {...register('endTime')}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Staff *
                </label>
                <input
                  {...register('requiredStaff', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Number of nurses required"
                />
                {errors.requiredStaff && (
                  <p className="mt-1 text-sm text-red-600">{errors.requiredStaff.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shift Requirements (Optional)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableRequirements.map(requirement => (
                <label 
                  key={requirement} 
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={watchedRequirements.includes(requirement)}
                    onChange={() => handleRequirementToggle(requirement)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{requirement}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Actions */}
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
                <Save className="h-4 w-4" />
              )}
              {isEditing ? 'Update Shift' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};