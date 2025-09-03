import React from 'react';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  FileDown, 
  RefreshCw,
  Home,
  UserPlus,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'nurses', label: 'Nurses', icon: Users },
  { id: 'add-nurse', label: 'Add Nurse', icon: UserPlus },
  { id: 'bulk-upload', label: 'Bulk Upload', icon: FileDown },
  { id: 'swap-requests', label: 'Swap Requests', icon: RefreshCw },
  { id: 'workload', label: 'Workload', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileDown },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-screen bg-white shadow-lg transform transition-all duration-300 ease-in-out z-50
        md:sticky md:top-0 md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}>
        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'px-3' : 'px-6'}`}>
          <div className="flex items-center justify-center">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">NurseScheduler</h2>
                  <p className="text-xs text-gray-500">Pro Edition</p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center rounded-lg text-left transition-colors group
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${sidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-3 py-2.5'}
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse/Expand button at bottom */}
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden md:flex items-center justify-center w-full p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
            {!sidebarCollapsed && (
              <span className="ml-2 text-sm text-gray-600">Collapse</span>
            )}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="absolute bottom-16 left-4 right-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
              <h3 className="font-semibold text-sm text-blue-900">Need Help?</h3>
              <p className="text-xs text-blue-700 mt-1">Contact support for assistance</p>
              <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                Get Support
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};