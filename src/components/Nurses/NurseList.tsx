import React, { useEffect, useState } from 'react';
import { Search, Filter, UserPlus, Edit, Trash2, Eye, Phone, Mail } from 'lucide-react';
import { useNurseStore } from '../../stores/nurseStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Nurse, FilterOptions } from '../../types';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface NurseCardProps {
  nurse: Nurse;
  onEdit: (nurse: Nurse) => void;
  onView: (nurse: Nurse) => void;
  onDelete: (id: string) => void;
}

const NurseCard: React.FC<NurseCardProps> = ({ nurse, onEdit, onView, onDelete }) => {
  const experienceColors = {
    Junior: 'bg-blue-100 text-blue-800',
    Mid: 'bg-green-100 text-green-800',
    Senior: 'bg-orange-100 text-orange-800',
    Expert: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
            {nurse.firstName[0]}{nurse.lastName[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {nurse.firstName} {nurse.lastName}
            </h3>
            <p className="text-sm text-gray-600">{nurse.department}</p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${experienceColors[nurse.experienceLevel]}`}>
          {nurse.experienceLevel}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          {nurse.email}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-4 w-4" />
          {nurse.phone}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Specializations:</p>
        <div className="flex flex-wrap gap-1">
          {nurse.specializations.map((spec, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Max: {nurse.maxHoursPerWeek}h/week
        </p>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(nurse)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(nurse)}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(nurse.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface NurseListProps {
  onAddNew: () => void;
  onEditNurse: (nurse: Nurse) => void;
  onViewNurse: (nurse: Nurse) => void;
}

export const NurseList: React.FC<NurseListProps> = ({ 
  onAddNew, 
  onEditNurse, 
  onViewNurse 
}) => {
  const {
    nurses,
    filters,
    loadingState,
    fetchNurses,
    deleteNurse,
    setFilters,
  } = useNurseStore();
  const { addNotification } = useNotificationStore();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNurses();
  }, [fetchNurses]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this nurse?')) {
      try {
        await deleteNurse(id);
        addNotification({
          type: 'success',
          title: 'Nurse deleted successfully',
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Failed to delete nurse',
          message: 'Please try again',
        });
      }
    }
  };

  // Filter nurses based on current filters
  const filteredNurses = nurses.filter(nurse => {
    const matchesSearch = !filters.search || 
      `${nurse.firstName} ${nurse.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
      nurse.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      nurse.department.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesDepartment = !filters.department || nurse.department === filters.department;
    const matchesExperience = !filters.experienceLevel || nurse.experienceLevel === filters.experienceLevel;
    const matchesSpecialization = !filters.specialization || 
      nurse.specializations.some(spec => spec.includes(filters.specialization));

    return matchesSearch && matchesDepartment && matchesExperience && matchesSpecialization;
  });

  const departments = [...new Set(nurses.map(n => n.department))];
  const specializations = [...new Set(nurses.flatMap(n => n.specializations))];

  if (loadingState.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="large" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading nurses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nurses</h2>
          <p className="text-gray-600">{filteredNurses.length} of {nurses.length} nurses</p>
        </div>
        
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add New Nurse
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search nurses by name, email, or department..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.department}
              onChange={(e) => setFilters({ department: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filters.experienceLevel}
              onChange={(e) => setFilters({ experienceLevel: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Experience Levels</option>
              <option value="Junior">Junior</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
              <option value="Expert">Expert</option>
            </select>

            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ specialization: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results */}
      {loadingState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{loadingState.error}</p>
        </div>
      )}

      {filteredNurses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No nurses found matching your criteria</p>
          <button
            onClick={() => setFilters({ search: '', department: '', experienceLevel: '', specialization: '' })}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNurses.map(nurse => (
            <NurseCard
              key={nurse.id}
              nurse={nurse}
              onEdit={onEditNurse}
              onView={onViewNurse}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};