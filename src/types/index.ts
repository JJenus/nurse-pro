export interface Nurse {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	department: string;
	specializations: string[];
	experienceLevel: "Junior" | "Mid" | "Senior" | "Expert";
	maxHoursPerWeek: number;
	preferredShifts: ("Day" | "Evening" | "Night")[];
	/** ISO calendar dates (yyyy-MM-dd) the nurse cannot work. */
	unavailableDates: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Shift {
	id: string;
	scheduleId?: string;
	/** Optimistic-locking version; send it back on update so stale edits are rejected (409). */
	version?: number;
	/** ISO calendar date (yyyy-MM-dd) as returned by the API. */
	date: string;
	startTime: string;
	endTime: string;
	type: "Day" | "Evening" | "Night";
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
	generatedAt: string;
	version?: number;
	status: "Draft" | "Published" | "Archived";
}

/** Body of POST /schedules/shifts and PUT /schedules/shifts/{id}. */
export interface ShiftInput {
	scheduleId?: string;
	date: string | Date;
	startTime: string;
	endTime: string;
	type: "Day" | "Evening" | "Night";
	department: string;
	requiredStaff: number;
	assignedNurses: string[];
	requirements?: (string | undefined)[];
	version?: number;
}

export interface ScheduleFilters {
	month?: number;
	year?: number;
	status?: Schedule["status"];
}

export interface ScheduleGenerationResult {
	schedule: Schedule;
	conflicts: ScheduleConflict[];
	stats: WorkloadData[];
	/** Pass back as `seed` in the generation params to reproduce this exact schedule (null on a replayed request). */
	seed?: number | null;
}

export interface SwapRequest {
	id: string;
	requesterId: string;
	targetId: string;
	shiftId: string;
	targetShiftId?: string;
	reason: string;
	status: "Pending" | "Approved" | "Rejected" | "Cancelled";
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
	type: "coverage" | "workload" | "preference" | "constraint";
	priority: number;
	enabled: boolean;
	parameters: Record<string, any>;
}

export interface ScheduleConflict {
	id: string;
	type:
		| "understaffed"
		| "overstaffed"
		| "qualification"
		| "availability"
		| "overtime"
		| "overlap"
		| "rest"
		| "consecutive";
	severity: "low" | "medium" | "high" | "critical";
	scheduleId?: string;
	date?: string;
	resolved?: boolean;
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
		minNursesPerShift: number;
		maxNursesPerShift: number;
		maxConsecutiveShifts: number;
		maxConsecutiveDay: number;
		maxConsecutiveNight: number;
		minRestHours?: number;
		maxOvertimeHours?: number;
	};
	seed?: number;
	/** Replace the Draft schedule of that month if one already exists. */
	replaceDraft?: boolean;
}

export type RescheduleMode = "fill_gaps" | "rebuild_range";

export interface RescheduleRequest {
	fromDate: string | Date;
	toDate?: string | Date;
	mode: RescheduleMode;
	excludeNurseIds: string[];
	lockedShiftIds?: string[];
	reason?: string;
	/** Preview by default; set to false (with revision and seed from the preview) to apply. */
	dryRun: boolean;
	revision?: string;
	seed?: number;
}

export interface RescheduleShiftChange {
	/** Null for a shift that does not exist yet. */
	shiftId: string | null;
	date: string;
	type: "Day" | "Evening" | "Night";
	newShift: boolean;
	added: string[];
	removed: string[];
}

export interface RescheduleResult {
	applied: boolean;
	revision: string | null;
	seed: number;
	from: string;
	to: string;
	shiftsChanged: number;
	shiftsCreated: number;
	nursesAdded: number;
	nursesRemoved: number;
	unfilledPositions: number;
	changes: RescheduleShiftChange[];
	conflicts: ScheduleConflict[];
}

export interface ScheduleChangeLog {
	id: string;
	scheduleId: string;
	shiftId?: string;
	nurseId?: string;
	action: string;
	actor?: string;
	reason?: string;
	details?: string;
	createdAt: string;
}
