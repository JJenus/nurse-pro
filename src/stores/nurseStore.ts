import { create } from 'zustand';
import { Nurse, LoadingState, FilterOptions, ApiError } from '../types';
import { apiClient } from '../utils/api';

interface NurseStore {
  nurses: Nurse[];
  selectedNurse: Nurse | null;
  filters: FilterOptions;
  loadingState: LoadingState;
  
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

export const useNurseStore = create<NurseStore>((set, get) => ({
  nurses: [],
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
      const params = new URLSearchParams(get().filters as any).toString();
      const response = await apiClient.get<Nurse[]>(`/nurses?${params}`);
      set({ nurses: response.data, loadingState: { isLoading: false, error: null } });
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
    }
  },

  fetchNurse: async (id: string) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      const response = await apiClient.get<Nurse>(`/nurses/${id}`);
      set({ selectedNurse: response.data, loadingState: { isLoading: false, error: null } });
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
    }
  },

  createNurse: async (nurseData) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      const response = await apiClient.post<Nurse>('/nurses', nurseData);
      set(state => ({
        nurses: [...state.nurses, response.data],
        loadingState: { isLoading: false, error: null }
      }));
    } catch (error) {
      const apiError = error as ApiError;
      set({ loadingState: { isLoading: false, error: apiError.message } });
      throw error;
    }
  },

  updateNurse: async (id: string, nurseData) => {
    set({ loadingState: { isLoading: true, error: null } });
    try {
      const response = await apiClient.put<Nurse>(`/nurses/${id}`, nurseData);
      set(state => ({
        nurses: state.nurses.map(nurse =>
          nurse.id === id ? response.data : nurse
        ),
        selectedNurse: state.selectedNurse?.id === id ? response.data : state.selectedNurse,
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
      await apiClient.delete(`/nurses/${id}`);
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
      const response = await apiClient.post<Nurse[]>('/nurses/bulk', nursesData);
      set(state => ({
        nurses: [...state.nurses, ...response.data],
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