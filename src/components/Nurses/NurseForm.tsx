import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Plus, Save, ArrowLeft } from 'lucide-react';
import { Nurse } from '../../types';
import { useNurseStore } from '../../stores/nurseStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { LoadingSpinner } from '../Common/LoadingSpinner';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  department: yup.string().required('Department is required'),
  specializations: yup.array().of(yup.string()).min(1, 'At least one specialization is required'),
  experienceLevel: yup.string().oneOf(['Junior', 'Mid', 'Senior', 'Expert']).required('Experience level is required'),
  maxHoursPerWeek: yup.number().min(1).max(60).required('Max hours per week is required'),
  preferredShifts: yup.array().of(yup.string()).min(1, 'At least one preferred shift is required'),
});

type FormData = yup.InferType<typeof schema>;

interface NurseFormProps {
  nurse?: Nurse;
  onCancel: () => void;
  onSuccess: () => void;
}

const departments = ['ICU', 'Emergency', 'Surgery', 'Pediatrics', 'Cardiology', 'Neurology', 'Oncology'];
const availableSpecializations = [
  'Critical Care', 'Emergency', 'Trauma', 'Pediatric Care', 'Neonatal', 
  'Surgical Care', 'Anesthesia', 'Cardiology', 'Neurology', 'Oncology'
];

export const NurseForm: React.FC<NurseFormProps> = ({ nurse, onCancel, onSuccess }) => {
  const { createNurse, updateNurse, loadingState } = useNurseStore();
  const { addNotification } = useNotificationStore();
  const isEditing = !!nurse;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: nurse ? {
      firstName: nurse.firstName,
      lastName: nurse.lastName,
      email: nurse.email,
      phone: nurse.phone,
      department: nurse.department,
      specializations: nurse.specializations,
      experienceLevel: nurse.experienceLevel,
      maxHoursPerWeek: nurse.maxHoursPerWeek,
      preferredShifts: nurse.preferredShifts,
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      specializations: [],
      experienceLevel: 'Junior',
      maxHoursPerWeek: 40,
      preferredShifts: [],
    },
  });

  const { fields: specializationFields, append: addSpecialization, remove: removeSpecialization } = useFieldArray({
    control,
    name: 'specializations',
  });

  const watchedSpecializations = watch('specializations') || [];
  const watchedPreferredShifts = watch('preferredShifts') || [];

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && nurse) {
        await updateNurse(nurse.id, {
          ...data,
          unavailableDates: nurse.unavailableDates,
        });
        addNotification({
          type: 'success',
          title: 'Nurse updated successfully',
        });
      } else {
        await createNurse({
          ...data,
          unavailableDates: [],
        });
        addNotification({
          type: 'success',
          title: 'Nurse created successfully',
        });
      }
      onSuccess();
    } catch (error) {
      addNotification({
        type: 'error',
        title: `Failed to ${isEditing ? 'update' : 'create'} nurse`,
        message: 'Please try again',
      });
    }
  };

  const handleSpecializationToggle = (spec: string) => {
    const current = watchedSpecializations;
    if (current.includes(spec)) {
      const newSpecs = current.filter(s => s !== spec);
      setValue('specializations', newSpecs);
    } else {
      setValue('specializations', [...current, spec]);
    }
  };

  const handleShiftToggle = (shift: 'Day' | 'Evening' | 'Night') => {
    const current = watchedPreferredShifts;
    if (current.includes(shift)) {
      const newShifts = current.filter(s => s !== shift);
      setValue('preferredShifts', newShifts);
    } else {
      setValue('preferredShifts', [...current, shift]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Nurse' : 'Add New Nurse'}
            </h2>
            <p className="text-gray-600">
              {isEditing ? 'Update nurse information' : 'Create a new nurse profile'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  {...register('firstName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  {...register('lastName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
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
                  Experience Level *
                </label>
                <select
                  {...register('experienceLevel')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                  <option value="Expert">Expert</option>
                </select>
                {errors.experienceLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.experienceLevel.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Hours Per Week *
                </label>
                <input
                  {...register('maxHoursPerWeek', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="40"
                />
                {errors.maxHoursPerWeek && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxHoursPerWeek.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Specializations *</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableSpecializations.map(spec => (
                <label key={spec} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchedSpecializations.includes(spec)}
                    onChange={() => handleSpecializationToggle(spec)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{spec}</span>
                </label>
              ))}
            </div>
            {errors.specializations && (
              <p className="mt-1 text-sm text-red-600">{errors.specializations.message}</p>
            )}
          </div>

          {/* Preferred Shifts */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferred Shifts *</h3>
            <div className="flex flex-wrap gap-2">
              {['Day', 'Evening', 'Night'].map(shift => (
                <label key={shift} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchedPreferredShifts.includes(shift as any)}
                    onChange={() => handleShiftToggle(shift as any)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium">{shift} Shift</span>
                </label>
              ))}
            </div>
            {errors.preferredShifts && (
              <p className="mt-1 text-sm text-red-600">{errors.preferredShifts.message}</p>
            )}
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
              {isEditing ? 'Update Nurse' : 'Create Nurse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};