import { create } from 'zustand';
import { Schedule, Shift, SwapRequest, WorkloadData, LoadingState, ApiError, ScheduleGenerationParams, ScheduleConflict } from '../types';
import { apiClient } from '../utils/api';

interface ScheduleStore {
  schedules: Schedule[];
  currentSchedule: Schedule | null;
  shifts: Shift[];
  swapRequests: SwapRequest[];
  workloadData: WorkloadData[];
  conflicts: ScheduleConflict[];
  loadingState: LoadingState;
  
  // Actions
  fetchSchedules: () => Promise<void>;
  fetchSchedule: (id: string) => Promise<void>;
  generateSchedule: (month: number, year: number, params: ScheduleGenerationParams) => Promise<void>;
  updateShift: (shiftId: string, updates: Partial<Shift>) => Promise<void>;
  createShift: (shiftData: Omit<Shift, 'id'>) => Promise<void>;
  deleteShift: (shiftId: string) => Promise<void>;
  createSwapRequest: (request: Omit<SwapRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  approveSwapRequest: (requestId: string) => Promise<void>;
  rejectSwapRequest: (requestId: string) => Promise<void>;
  fetchWorkloadData: (month: number, year: number) => Promise<void>;
  exportSchedule: (scheduleId: string, format: 'pdf' | 'excel') => Promise<void>;
  detectConflicts: () => Promise<void>;
  setCurrentSchedule: (schedule: Schedule | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Mock data
const mockShifts: Shift[] = [
  {
    id: '1',
    date: new Date('2024-02-01'),
    startTime: '07:00',
    endTime: '19:00',
    type: 'Day',
    department: 'ICU',
    requiredStaff: 3,
    assignedNurses: ['1', '3'],
    requirements: ['Critical Care'],
  },
  {
    id: '2',
    date: new Date('2024-02-01'),
    startTime: '19:00',
    endTime: '07:00',
    type: 'Night',
    department: 'ICU',
    requiredStaff: 2,
    assignedNurses: ['2'],
  },
  {
    id: '3',
    date: new Date('2024-02-01'),
    startTime: '07:00',
    endTime: '19:00',
    type: 'Day',
    department: 'Emergency',
    requiredStaff: 4,
    assignedNurses: ['2', '4'],
  },
];

const mockSchedule: Schedule = {
  id: '1',
  month: 2,
  year: 2024,
  shifts: mockShifts,
  generatedAt: new Date(),
  status: 'Draft',
};

const mockSwapRequests: SwapRequest[] = [
  {
    id: '1',
    requesterId: '1',
    targetId: '2',
    shiftId: '1',
    targetShiftId: '2',
    reason: 'Family emergency',
    status: 'Pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    autoMatched: false,
  },
];

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  schedules: [mockSchedule],
  currentSchedule: mockSchedule,
  shifts: mockShifts,
  swapRequests: mockSwapRequests,
  workloadData: [],
  conflicts: [],
  loadingState: {
    isLoading: false,
    error: null,
  },

  fetchSchedules: async () => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock API call
      set({ 
        schedules: [mockSchedule],
        loadingState: { isLoading: false, error: null }
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
    }
  },

  fetchSchedule: async (id: string) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      set({ 
        currentSchedule: mockSchedule,
        shifts: mockShifts,
        loadingState: { isLoading: false, error: null }
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
    }
  },

  generateSchedule: async (month: number, year: number, params: ScheduleGenerationParams) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Longer for generation
      
      // Mock schedule generation
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        month,
        year,
        shifts: mockShifts.map(shift => ({
          ...shift,
          id: Date.now().toString() + Math.random().toString(),
          date: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
        })),
        generatedAt: new Date(),
        status: 'Draft',
      };
      
      set(state => ({
        schedules: [...state.schedules, newSchedule],
        currentSchedule: newSchedule,
        shifts: newSchedule.shifts,
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  updateShift: async (shiftId: string, updates: Partial<Shift>) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        shifts: state.shifts.map(shift =>
          shift.id === shiftId ? { ...shift, ...updates } : shift
        ),
        currentSchedule: state.currentSchedule ? {
          ...state.currentSchedule,
          shifts: state.currentSchedule.shifts.map(shift =>
            shift.id === shiftId ? { ...shift, ...updates } : shift
          )
        } : null,
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  createShift: async (shiftData) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newShift: Shift = {
        ...shiftData,
        id: Date.now().toString(),
      };
      
      set(state => ({
        shifts: [...state.shifts, newShift],
        currentSchedule: state.currentSchedule ? {
          ...state.currentSchedule,
          shifts: [...state.currentSchedule.shifts, newShift]
        } : null,
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  deleteShift: async (shiftId: string) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        shifts: state.shifts.filter(shift => shift.id !== shiftId),
        currentSchedule: state.currentSchedule ? {
          ...state.currentSchedule,
          shifts: state.currentSchedule.shifts.filter(shift => shift.id !== shiftId)
        } : null,
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  createSwapRequest: async (request) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newRequest: SwapRequest = {
        ...request,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set(state => ({
        swapRequests: [...state.swapRequests, newRequest],
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  approveSwapRequest: async (requestId: string) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        swapRequests: state.swapRequests.map(request =>
          request.id === requestId ? { 
            ...request, 
            status: 'Approved' as const,
            updatedAt: new Date(),
            reviewedBy: 'Admin'
          } : request
        ),
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  rejectSwapRequest: async (requestId: string) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        swapRequests: state.swapRequests.map(request =>
          request.id === requestId ? { 
            ...request, 
            status: 'Rejected' as const,
            updatedAt: new Date(),
            reviewedBy: 'Admin'
          } : request
        ),
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  fetchWorkloadData: async (month: number, year: number) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock workload data
      const workloadData: WorkloadData[] = [
        { nurseId: '1', totalHours: 168, shiftsCount: 14, overtimeHours: 8 },
        { nurseId: '2', totalHours: 180, shiftsCount: 15, overtimeHours: 20 },
        { nurseId: '3', totalHours: 152, shiftsCount: 13, overtimeHours: 0 },
        { nurseId: '4', totalHours: 160, shiftsCount: 12, overtimeHours: 0 },
        { nurseId: '5', totalHours: 144, shiftsCount: 12, overtimeHours: 0 },
      ];
      
      set({ 
        workloadData,
        loadingState: { isLoading: false, error: null }
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
    }
  },

  exportSchedule: async (scheduleId: string, format: 'pdf' | 'excel') => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Mock export - in real app, this would download a file
      console.log(`Exporting schedule ${scheduleId} as ${format}`);
      set({ loadingState: { isLoading: false, error: null } });
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  detectConflicts: async () => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock conflict detection
      const conflicts: ScheduleConflict[] = get().shifts
        .filter(shift => shift.assignedNurses.length < shift.requiredStaff)
        .map(shift => ({
          id: `conflict-${shift.id}`,
          type: 'understaffed',
          severity: shift.assignedNurses.length === 0 ? 'critical' : 'high',
          shiftId: shift.id,
          message: `${shift.department} ${shift.type} shift needs ${shift.requiredStaff - shift.assignedNurses.length} more nurse(s)`,
          suggestions: [
            'Check for available nurses with matching qualifications',
            'Consider overtime assignments',
            'Review shift requirements',
          ],
        }));
      
      set({ 
        conflicts,
        loadingState: { isLoading: false, error: null }
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
    }
  },

  setCurrentSchedule: (schedule) => {
    set({ currentSchedule: schedule });
  },

  setLoading: (isLoading) => {
    set(state => ({
      loadingState: { ...state.loadingState, isLoading }
    }));
  },

  setError: (error) => {
    set(state => ({
      loadingState: { ...state.loadingState, error }
    }));
  },
}));