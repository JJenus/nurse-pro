import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  currentView: 'calendar' | 'table';
  selectedDate: Date;
  darkMode: boolean;
  
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setCurrentView: (view: 'calendar' | 'table') => void;
  setSelectedDate: (date: Date) => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  currentView: 'calendar',
  selectedDate: new Date(),
  darkMode: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebarCollapsed: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
}));