import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { Wand2, Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { ScheduleRule, ScheduleGenerationParams } from '../../types';
import { LoadingSpinner } from '../Common/LoadingSpinner';

const schema = yup.object({
  month: yup.number().min(1).max(12).required('Month is required'),
  year: yup.number().min(2024).max(2030).required('Year is required'),
  minStaffPerShift: yup.number().min(1).max(20).required('Minimum staff per shift is required'),
  maxConsecutiveShifts: yup.number().min(1).max(7).required('Maximum consecutive shifts is required'),
  minRestHours: yup.number().min(8).max(48).required('Minimum rest hours is required'),
  maxOvertimeHours: yup.number().min(0).max(20).required('Maximum overtime hours is required'),
});

type FormData = yup.InferType<typeof schema>;

interface ScheduleGeneratorProps {
  onClose: () => void;
}

const defaultRules: ScheduleRule[] = [
  {
    id: '1',
    name: 'Ensure Minimum Coverage',
    type: 'coverage',
    priority: 1,
    enabled: true,
    parameters: { minStaff: 2 },
  },
  {
    id: '2',
    name: 'Balance Workload',
    type: 'workload',
    priority: 2,
    enabled: true,
    parameters: { maxVariance: 10 },
  },
  {
    id: '3',
    name: 'Respect Preferences',
    type: 'preference',
    priority: 3,
    enabled: true,
    parameters: { weight: 0.7 },
  },
  {
    id: '4',
    name: 'Avoid Consecutive Night Shifts',
    type: 'constraint',
    priority: 4,
    enabled: true,
    parameters: { maxConsecutive: 2 },
  },
];

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({ onClose }) => {
  const { generateSchedule, loadingState } = useScheduleStore();
  const { addNotification } = useNotificationStore();
  const [rules, setRules] = useState<ScheduleRule[]>(defaultRules);
  const [step, setStep] = useState<'config' | 'rules' | 'generating'>('config');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      minStaffPerShift: 2,
      maxConsecutiveShifts: 3,
      minRestHours: 12,
      maxOvertimeHours: 8,
    },
  });

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const updateRulePriority = (ruleId: string, priority: number) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, priority } : rule
    ));
  };

  const onSubmit = async (data: FormData) => {
    setStep('generating');
    
    const params: ScheduleGenerationParams = {
      month: data.month,
      year: data.year,
      rules: rules.filter(rule => rule.enabled),
      constraints: {
        minStaffPerShift: { default: data.minStaffPerShift },
        maxConsecutiveShifts: data.maxConsecutiveShifts,
        minRestHours: data.minRestHours,
        maxOvertimeHours: data.maxOvertimeHours,
      },
    };

    try {
      await generateSchedule(data.month, data.year, params);
      addNotification({
        type: 'success',
        title: 'Schedule generated successfully',
        message: `Generated schedule for ${format(new Date(data.year, data.month - 1), 'MMMM yyyy')}`,
      });
      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to generate schedule',
        message: 'Please check your configuration and try again',
      });
      setStep('config');
    }
  };

  if (step === 'generating') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <LoadingSpinner size="large" className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generating Schedule
            </h3>
            <p className="text-gray-600 mb-4">
              This may take a few moments while we optimize assignments...
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Processing {rules.filter(r => r.enabled).length} scheduling rules
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Generate Schedule</h2>
                <p className="text-gray-600">Configure automatic schedule generation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {step === 'config' && (
            <div className="space-y-6">
              {/* Basic Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month *
                    </label>
                    <select
                      {...register('month', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {format(new Date(2024, i), 'MMMM')}
                        </option>
                      ))}
                    </select>
                    {errors.month && (
                      <p className="mt-1 text-sm text-red-600">{errors.month.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year *
                    </label>
                    <input
                      {...register('year', { valueAsNumber: true })}
                      type="number"
                      min="2024"
                      max="2030"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.year && (
                      <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Constraints */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Constraints</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Staff Per Shift *
                    </label>
                    <input
                      {...register('minStaffPerShift', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.minStaffPerShift && (
                      <p className="mt-1 text-sm text-red-600">{errors.minStaffPerShift.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Consecutive Shifts *
                    </label>
                    <input
                      {...register('maxConsecutiveShifts', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="7"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.maxConsecutiveShifts && (
                      <p className="mt-1 text-sm text-red-600">{errors.maxConsecutiveShifts.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Rest Hours *
                    </label>
                    <input
                      {...register('minRestHours', { valueAsNumber: true })}
                      type="number"
                      min="8"
                      max="48"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.minRestHours && (
                      <p className="mt-1 text-sm text-red-600">{errors.minRestHours.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Overtime Hours *
                    </label>
                    <input
                      {...register('maxOvertimeHours', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.maxOvertimeHours && (
                      <p className="mt-1 text-sm text-red-600">{errors.maxOvertimeHours.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep('rules')}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Configure Rules
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate Schedule
                </button>
              </div>
            </div>
          )}

          {step === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Scheduling Rules</h3>
                <p className="text-sm text-gray-600">
                  {rules.filter(r => r.enabled).length} of {rules.length} rules enabled
                </p>
              </div>

              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className={`
                      p-4 border rounded-lg transition-all
                      ${rule.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => toggleRule(rule.id)}
                          className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{rule.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {rule.type === 'coverage' && 'Ensures adequate staffing levels for all shifts'}
                            {rule.type === 'workload' && 'Distributes shifts fairly among nurses'}
                            {rule.type === 'preference' && 'Considers nurse shift preferences when possible'}
                            {rule.type === 'constraint' && 'Enforces scheduling constraints and regulations'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Priority:</span>
                        <select
                          value={rule.priority}
                          onChange={(e) => updateRulePriority(rule.id, parseInt(e.target.value))}
                          disabled={!rule.enabled}
                          className="text-xs border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
                        >
                          {[1, 2, 3, 4, 5].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Generation Tips</h4>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1">
                      <li>• Higher priority rules are applied first</li>
                      <li>• Generation may take 30-60 seconds for large schedules</li>
                      <li>• Conflicts will be highlighted for manual resolution</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep('config')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={rules.filter(r => r.enabled).length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate Schedule
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};