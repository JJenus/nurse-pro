import { create } from 'zustand';
import { Nurse, LoadingState, FilterOptions, ApiError } from '../types';
import { apiClient } from '../utils/api';

interface NurseStore {
  nurses: Nurse[];
  selectedNurse: Nurse | null;
  filters: FilterOptions;
  loadingState: LoadingState;
  
  // Actions
  fetchNurses: () => Promise<void>;
  fetchNurse: (id: string) => Promise<void>;
  createNurse: (nurse: Omit<Nurse, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNurse: (id: string, nurse: Partial<Nurse>) => Promise<void>;
  deleteNurse: (id: string) => Promise<void>;
  bulkUploadNurses: (nurses: Omit<Nurse, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  setFilters: (filters: Partial<FilterOptions>) => void;
  clearSelectedNurse: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Mock data for demonstration
const mockNurses: Nurse[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@hospital.com',
    phone: '555-0101',
    department: 'ICU',
    specializations: ['Critical Care', 'Emergency'],
    experienceLevel: 'Senior',
    maxHoursPerWeek: 40,
    preferredShifts: ['Day', 'Evening'],
    unavailableDates: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@hospital.com',
    phone: '555-0102',
    department: 'Emergency',
    specializations: ['Emergency', 'Trauma'],
    experienceLevel: 'Expert',
    maxHoursPerWeek: 45,
    preferredShifts: ['Night'],
    unavailableDates: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@hospital.com',
    phone: '555-0103',
    department: 'Pediatrics',
    specializations: ['Pediatric Care', 'Neonatal'],
    experienceLevel: 'Mid',
    maxHoursPerWeek: 38,
    preferredShifts: ['Day'],
    unavailableDates: [],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@hospital.com',
    phone: '555-0104',
    department: 'Surgery',
    specializations: ['Surgical Care', 'Anesthesia'],
    experienceLevel: 'Senior',
    maxHoursPerWeek: 42,
    preferredShifts: ['Day', 'Evening'],
    unavailableDates: [],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '5',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jennifer.martinez@hospital.com',
    phone: '555-0105',
    department: 'ICU',
    specializations: ['Critical Care'],
    experienceLevel: 'Junior',
    maxHoursPerWeek: 36,
    preferredShifts: ['Evening', 'Night'],
    unavailableDates: [],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

export const useNurseStore = create<NurseStore>((set, get) => ({
  nurses: mockNurses,
  selectedNurse: null,
  filters: {
    search: '',
    department: '',
    experienceLevel: '',
    specialization: '',
  },
  loadingState: {
    isLoading: false,
    error: null,
  },

  fetchNurses: async () => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      // Mock API call - replace with real API
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await apiClient.get<Nurse[]>('/nurses');
      set({ nurses: response.data, loadingState: { isLoading: false, error: null } });
    } catch (error) {
      const apiError = error as ApiError;
      set({ 
        loadingState: { isLoading: false, error: apiError.message },
        nurses: mockNurses // Use mock data on error
      });
    } finally {
      set({ 
        loadingState: { isLoading: false, error: null },
      });
    }
  },

  fetchNurse: async (id: string) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const nurse = mockNurses.find(n => n.id === id);
      if (nurse) {
        set({ selectedNurse: nurse, loadingState: { isLoading: false, error: null } });
      } else {
        set({ loadingState: { isLoading: false, error: 'Nurse not found' } });
      }
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
    } finally {
      set({ 
        loadingState: { isLoading: false, error: null },
      });
    }
  },

  createNurse: async (nurseData) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));
      const newNurse: Nurse = {
        ...nurseData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set(state => ({
        nurses: [...state.nurses, newNurse],
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
    finally {
      set({ 
        loadingState: { isLoading: false, error: null },
      });
    }
  },

  updateNurse: async (id: string, nurseData) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      set(state => ({
        nurses: state.nurses.map(nurse =>
          nurse.id === id
            ? { ...nurse, ...nurseData, updatedAt: new Date() }
            : nurse
        ),
        selectedNurse: state.selectedNurse?.id === id
          ? { ...state.selectedNurse, ...nurseData, updatedAt: new Date() }
          : state.selectedNurse,
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  deleteNurse: async (id: string) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        nurses: state.nurses.filter(nurse => nurse.id !== id),
        selectedNurse: state.selectedNurse?.id === id ? null : state.selectedNurse,
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  bulkUploadNurses: async (nursesData) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newNurses: Nurse[] = nursesData.map(nurseData => ({
        ...nurseData,
        id: Date.now().toString() + Math.random().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      set(state => ({
        nurses: [...state.nurses, ...newNurses],
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  clearSelectedNurse: () => {
    set({ selectedNurse: null });
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