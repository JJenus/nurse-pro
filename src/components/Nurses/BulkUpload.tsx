import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Download, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import { Nurse } from '../../types';
import { useNurseStore } from '../../stores/nurseStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface BulkUploadProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface ParsedNurse extends Omit<Nurse, 'id' | 'createdAt' | 'updatedAt' | 'specializations' | 'preferredShifts' | 'unavailableDates'> {
  specializations: string;
  preferredShifts: string;
  error?: string;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ onCancel, onSuccess }) => {
  const { bulkUploadNurses, loadingState } = useNurseStore();
  const { addNotification } = useNotificationStore();
  
  const [parsedData, setParsedData] = useState<ParsedNurse[]>([]);
  const [validData, setValidData] = useState<Omit<Nurse, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'processing'>('upload');

  const validateNurse = (nurse: ParsedNurse): { isValid: boolean; error?: string } => {
    if (!nurse.firstName || !nurse.lastName) {
      return { isValid: false, error: 'Name is required' };
    }
    if (!nurse.email || !/\S+@\S+\.\S+/.test(nurse.email)) {
      return { isValid: false, error: 'Valid email is required' };
    }
    if (!nurse.department) {
      return { isValid: false, error: 'Department is required' };
    }
    if (!['Junior', 'Mid', 'Senior', 'Expert'].includes(nurse.experienceLevel)) {
      return { isValid: false, error: 'Invalid experience level' };
    }
    if (!nurse.maxHoursPerWeek || nurse.maxHoursPerWeek < 1 || nurse.maxHoursPerWeek > 60) {
      return { isValid: false, error: 'Valid max hours per week required (1-60)' };
    }
    return { isValid: true };
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const parsed = results.data as ParsedNurse[];
        const processedData = parsed.map(nurse => {
          const validation = validateNurse(nurse);
          return {
            ...nurse,
            error: validation.error,
          };
        }).filter(nurse => nurse.firstName); // Filter out empty rows

        setParsedData(processedData);
        
        // Convert valid data
        const valid = processedData
          .filter(nurse => !nurse.error)
          .map(nurse => ({
            firstName: nurse.firstName,
            lastName: nurse.lastName,
            email: nurse.email,
            phone: nurse.phone || '',
            department: nurse.department,
            specializations: nurse.specializations ? nurse.specializations.split(',').map(s => s.trim()) : [],
            experienceLevel: nurse.experienceLevel as 'Junior' | 'Mid' | 'Senior' | 'Expert',
            maxHoursPerWeek: Number(nurse.maxHoursPerWeek),
            preferredShifts: nurse.preferredShifts ? nurse.preferredShifts.split(',').map(s => s.trim()) as ('Day' | 'Evening' | 'Night')[] : ['Day'],
            unavailableDates: [],
          }));
        
        setValidData(valid);
        setStep('preview');
      },
      error: (error) => {
        addNotification({
          type: 'error',
          title: 'Failed to parse CSV file',
          message: error.message,
        });
      },
    });
  }, [addNotification]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (validData.length === 0) return;
    
    setStep('processing');
    try {
      await bulkUploadNurses(validData);
      addNotification({
        type: 'success',
        title: `Successfully uploaded ${validData.length} nurses`,
      });
      onSuccess();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to upload nurses',
        message: 'Please try again',
      });
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@hospital.com',
        phone: '555-0101',
        department: 'ICU',
        specializations: 'Critical Care, Emergency',
        experienceLevel: 'Senior',
        maxHoursPerWeek: 40,
        preferredShifts: 'Day, Evening',
      }
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nurse_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (step === 'processing') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="large" className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploading Nurses</h3>
          <p className="text-gray-600">Processing {validData.length} nurses...</p>
        </div>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Nurses</h2>
            <p className="text-gray-600">Upload multiple nurses from a CSV or Excel file</p>
          </div>
        </div>

        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      {step === 'upload' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragActive ? 'Drop the file here' : 'Upload CSV or Excel file'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your file here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: CSV, XLS, XLSX (Max size: 10MB)
            </p>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Required Columns:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <span className="bg-gray-100 px-2 py-1 rounded">firstName</span>
              <span className="bg-gray-100 px-2 py-1 rounded">lastName</span>
              <span className="bg-gray-100 px-2 py-1 rounded">email</span>
              <span className="bg-gray-100 px-2 py-1 rounded">phone</span>
              <span className="bg-gray-100 px-2 py-1 rounded">department</span>
              <span className="bg-gray-100 px-2 py-1 rounded">experienceLevel</span>
              <span className="bg-gray-100 px-2 py-1 rounded">maxHoursPerWeek</span>
              <span className="bg-gray-100 px-2 py-1 rounded">specializations</span>
              <span className="bg-gray-100 px-2 py-1 rounded">preferredShifts</span>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Valid Records</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">{validData.length}</p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900">Invalid Records</span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-2">
                  {parsedData.filter(n => n.error).length}
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Total Records</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">{parsedData.length}</p>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedData.slice(0, 10).map((nurse, index) => (
                    <tr key={index} className={nurse.error ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {nurse.error ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {nurse.firstName} {nurse.lastName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {nurse.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {nurse.department}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {nurse.experienceLevel}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">
                        {nurse.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {parsedData.length > 10 && (
                <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
                  Showing first 10 of {parsedData.length} records
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Upload Different File
            </button>
            <button
              onClick={handleUpload}
              disabled={validData.length === 0 || loadingState.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
            >
              {loadingState.isLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload {validData.length} Nurses
            </button>
          </div>
        </div>
      )}
    </div>
  );
};