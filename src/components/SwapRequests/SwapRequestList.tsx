import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, Filter, RefreshCw, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useNurseStore } from '../../stores/nurseStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { SwapRequest, SwapRequestFilters } from '../../types';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface SwapRequestCardProps {
  request: SwapRequest;
  requester: any;
  target: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (request: SwapRequest) => void;
}

const SwapRequestCard: React.FC<SwapRequestCardProps> = ({
  request,
  requester,
  target,
  onApprove,
  onReject,
  onView,
}) => {
  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Approved: 'bg-green-100 text-green-800 border-green-300',
    Rejected: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusIcons = {
    Pending: Clock,
    Approved: CheckCircle,
    Rejected: XCircle,
  };

  const StatusIcon = statusIcons[request.status];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
            {requester?.firstName?.[0]}{requester?.lastName?.[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {requester?.firstName} {requester?.lastName}
            </h3>
            <p className="text-sm text-gray-600">{requester?.department}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${statusColors[request.status]}`}>
          <StatusIcon className="h-3 w-3" />
          <span className="text-xs font-medium">{request.status}</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Requesting to swap with:</span>
          <span className="font-medium text-gray-900">
            {target?.firstName} {target?.lastName}
          </span>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Reason:</span> {request.reason}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Requested: {format(request.createdAt, 'MMM d, yyyy')}</span>
          {request.autoMatched && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Auto-matched
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(request)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>
        
        {request.status === 'Pending' && (
          <>
            <button
              onClick={() => onReject(request.id)}
              className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={() => onApprove(request.id)}
              className="flex items-center justify-center gap-2 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const SwapRequestList: React.FC = () => {
  const { 
    swapRequests, 
    approveSwapRequest, 
    rejectSwapRequest, 
    loadingState 
  } = useScheduleStore();
  const { nurses } = useNurseStore();
  const { addNotification } = useNotificationStore();
  
  const [filters, setFilters] = useState<SwapRequestFilters>({
    status: '',
    department: '',
    dateRange: { start: null, end: null },
    requester: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);

  const handleApprove = async (requestId: string) => {
    try {
      await approveSwapRequest(requestId);
      addNotification({
        type: 'success',
        title: 'Swap request approved',
        message: 'The shift swap has been processed',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to approve request',
        message: 'Please try again',
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectSwapRequest(requestId);
      addNotification({
        type: 'success',
        title: 'Swap request rejected',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to reject request',
        message: 'Please try again',
      });
    }
  };

  // Filter requests
  const filteredRequests = swapRequests.filter(request => {
    const requester = nurses.find(n => n.id === request.requesterId);
    
    const matchesStatus = !filters.status || request.status === filters.status;
    const matchesDepartment = !filters.department || requester?.department === filters.department;
    const matchesRequester = !filters.requester || 
      `${requester?.firstName} ${requester?.lastName}`.toLowerCase().includes(filters.requester.toLowerCase());

    return matchesStatus && matchesDepartment && matchesRequester;
  });

  const departments = [...new Set(nurses.map(n => n.department))];

  if (loadingState.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="large" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading swap requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Swap Requests</h2>
          <p className="text-gray-600">
            {filteredRequests.length} of {swapRequests.length} requests
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by requester name..."
              value={filters.requester}
              onChange={(e) => setFilters(prev => ({ ...prev, requester: e.target.value }))}
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
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Swap Requests</h3>
          <p className="text-gray-600">
            {swapRequests.length === 0 
              ? 'No swap requests have been submitted yet'
              : 'No requests match your current filters'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRequests.map(request => {
            const requester = nurses.find(n => n.id === request.requesterId);
            const target = nurses.find(n => n.id === request.targetId);
            
            return (
              <SwapRequestCard
                key={request.id}
                request={request}
                requester={requester}
                target={target}
                onApprove={handleApprove}
                onReject={handleReject}
                onView={setSelectedRequest}
              />
            );
          })}
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <SwapRequestDetail
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

const SwapRequestDetail: React.FC<{
  request: SwapRequest;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ request, onClose, onApprove, onReject }) => {
  const { nurses } = useNurseStore();
  const { shifts } = useScheduleStore();
  
  const requester = nurses.find(n => n.id === request.requesterId);
  const target = nurses.find(n => n.id === request.targetId);
  const shift = shifts.find(s => s.id === request.shiftId);
  const targetShift = request.targetShiftId ? shifts.find(s => s.id === request.targetShiftId) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Swap Request Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Request Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Requester</h3>
              <div className="space-y-2">
                <p><span className="text-gray-600">Name:</span> {requester?.firstName} {requester?.lastName}</p>
                <p><span className="text-gray-600">Department:</span> {requester?.department}</p>
                <p><span className="text-gray-600">Email:</span> {requester?.email}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Target</h3>
              <div className="space-y-2">
                <p><span className="text-gray-600">Name:</span> {target?.firstName} {target?.lastName}</p>
                <p><span className="text-gray-600">Department:</span> {target?.department}</p>
                <p><span className="text-gray-600">Email:</span> {target?.email}</p>
              </div>
            </div>
          </div>

          {/* Shift Details */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Shift Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Original Shift</h4>
                {shift && (
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>{shift.department} - {shift.type}</p>
                    <p>{format(new Date(shift.date), 'MMM d, yyyy')}</p>
                    <p>{shift.startTime} - {shift.endTime}</p>
                  </div>
                )}
              </div>
              
              {targetShift && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Target Shift</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <p>{targetShift.department} - {targetShift.type}</p>
                    <p>{format(new Date(targetShift.date), 'MMM d, yyyy')}</p>
                    <p>{targetShift.startTime} - {targetShift.endTime}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Reason for Swap</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{request.reason}</p>
            </div>
          </div>

          {/* Review Notes */}
          {request.reviewNotes && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Review Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{request.reviewNotes}</p>
                {request.reviewedBy && (
                  <p className="text-sm text-gray-500 mt-2">
                    Reviewed by: {request.reviewedBy}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {request.status === 'Pending' && (
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => onReject(request.id)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Reject Request
              </button>
              <button
                onClick={() => onApprove(request.id)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};