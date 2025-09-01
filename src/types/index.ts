export interface Nurse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  specializations: string[];
  experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Expert';
  maxHoursPerWeek: number;
  preferredShifts: ('Day' | 'Evening' | 'Night')[];
  unavailableDates: Date[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'Day' | 'Evening' | 'Night';
  department: string;
  requiredStaff: number;
  assignedNurses: string[];
  requirements?: string[];
}

export interface Schedule {
  id: string;
  month: number;
  year: number;
  shifts: Shift[];
  generatedAt: Date;
  status: 'Draft' | 'Published' | 'Archived';
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  targetId: string;
  shiftId: string;
  targetShiftId?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  autoMatched?: boolean;
}

export interface WorkloadData {
  nurseId: string;
  totalHours: number;
  shiftsCount: number;
  overtimeHours: number;

  month: number;
	year: number;
	nightShifts: number;
	weekendShifts: number;
	consecutiveDays: number;
	updatedAt?: Date;
	createdSA?: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FilterOptions {
  search: string;
  department: string;
  experienceLevel: string;
  specialization: string;
}

export interface ScheduleRule {
  id: string;
  name: string;
  type: 'coverage' | 'workload' | 'preference' | 'constraint';
  priority: number;
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface ScheduleConflict {
  id: string;
  type: 'understaffed' | 'overstaffed' | 'qualification' | 'availability' | 'overtime';
  severity: 'low' | 'medium' | 'high' | 'critical';
  shiftId: string;
  nurseId?: string;
  message: string;
  suggestions?: string[];
}

export interface SwapRequestFilters {
  status: string;
  department: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  requester: string;
}

export interface ScheduleGenerationParams {
  month: number;
  year: number;
  rules: ScheduleRule[];
  constraints: {
    minStaffPerShift: Record<string, number>;
    maxConsecutiveShifts: number;
    minRestHours: number;
    maxOvertimeHours: number;
  };
}