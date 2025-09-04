import React, { useState, useEffect } from 'react';
import { Calendar, Table, Wand2, Download, RefreshCw } from 'lucide-react';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useUIStore } from '../../stores/uiStore';
import { useNurseStore } from '../../stores/nurseStore';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleEditor } from './ScheduleEditor';
import { ScheduleGenerator } from './ScheduleGenerator';
import { ScheduleTable } from './ScheduleTable';
import { ShiftDetailsModal } from './ShiftDetailsModal';
import { Shift } from '../../types';

interface SchedulePageProps {
  onAddShift?: (date: Date) => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({ onAddShift }) => {
  const { currentView, selectedDate, setCurrentView, setSelectedDate } = useUIStore();
  const { fetchSchedules, exportSchedules, loadingState } = useScheduleStore();
  const { nurses } = useNurseStore();
  
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [showShiftDetails, setShowShiftDetails] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setShowShiftDetails(true);
  };

  const handleEditShift = () => {
    setShowShiftDetails(false);
    setShowShiftEditor(true);
  };

  const handleAddShift = (date: Date) => {
    setSelectedDate(date);
    setSelectedShift(null);
    if (onAddShift) {
      onAddShift(date);
    } else {
      setShowShiftEditor(true);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = currentDate.getFullYear();
      
      await exportSchedules([currentMonth], currentYear, format);
    } catch (error) {
      console.log(error)
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600">Manage shifts and assignments with drag-and-drop functionality</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            <Wand2 className="h-4 w-4" />
            Generate Schedule
          </button>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleExport('pdf')}
              disabled={loadingState.isLoading}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={loadingState.isLoading}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCurrentView('calendar')}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
              ${currentView === 'calendar' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={() => setCurrentView('table')}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
              ${currentView === 'table' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Table className="h-4 w-4" />
            Table
          </button>
        </div>

        <button
          onClick={() => fetchSchedules()}
          disabled={loadingState.isLoading}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loadingState.isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Main Content */}
      {currentView === 'calendar' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ScheduleCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onShiftClick={handleShiftClick}
              onAddShift={handleAddShift}
            />
          </div>
          
          <div className="xl:col-span-1">
            <ScheduleEditor
              selectedDate={selectedDate}
              onShiftEdit={handleShiftClick}
              onShiftAdd={handleAddShift}
            />
          </div>
        </div>
      ) : (
        <ScheduleTable
          onShiftClick={handleShiftClick}
          onAddShift={handleAddShift}
        />
      )}

      {/* Schedule Generator Modal */}
      {showGenerator && (
        <ScheduleGenerator onClose={() => setShowGenerator(false)} />
      )}

      {/* Shift Details Modal */}
      {selectedShift && (
        <ShiftDetailsModal
          shift={selectedShift}
          nurses={nurses}
          isOpen={showShiftDetails}
          onClose={() => setShowShiftDetails(false)}
          onEdit={handleEditShift}
        />
      )}

      {/* Shift Editor Modal (existing functionality) */}
      {showShiftEditor && (
        // Your existing shift editor component here
        // This would be your current modal for editing shifts
        <div>Shift Editor Component</div>
      )}
    </div>
  );
};