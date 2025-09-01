import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  currentView: 'calendar' | 'table';
  selectedDate: Date;
  darkMode: boolean;
  
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: 'calendar' | 'table') => void;
  setSelectedDate: (date: Date) => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  currentView: 'calendar',
  selectedDate: new Date(),
  darkMode: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
}));