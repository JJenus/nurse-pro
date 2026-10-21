import { create } from "zustand";
import {
	Schedule,
	Shift,
	ShiftInput,
	SwapRequest,
	WorkloadData,
	LoadingState,
	ApiError,
	ScheduleGenerationParams,
	ScheduleGenerationResult,
	ScheduleConflict,
	ScheduleFilters,
	RescheduleRequest,
	RescheduleResult,
	ScheduleChangeLog,
} from "../types";
import { apiClient } from "../utils/api";
import { toIsoDate } from "../utils/dates";
import { useNotificationStore } from "./notificationStore";

interface ScheduleStore {
	schedules: Schedule[];
	currentSchedule: Schedule | null;
	shifts: Shift[];
	swapRequests: SwapRequest[];
	workloadData: WorkloadData[];
	conflicts: ScheduleConflict[];
	loadingState: LoadingState;

	fetchSchedules: (filters?: ScheduleFilters) => Promise<void>;
	fetchSchedule: (id: string) => Promise<void>;
	generateSchedule: (
		month: number,
		year: number,
		params: ScheduleGenerationParams,
		idempotencyKey?: string
	) => Promise<void>;
	updateScheduleStatus: (
		scheduleId: string,
		status: Schedule["status"]
	) => Promise<void>;
	/** Previews (dryRun) or applies a reschedule of a date range; applying reloads the schedule. */
	rescheduleSchedule: (
		scheduleId: string,
		request: RescheduleRequest
	) => Promise<RescheduleResult>;
	/** Audit log of a schedule (read only, newest first). */
	fetchScheduleChanges: (scheduleId: string) => Promise<ScheduleChangeLog[]>;
	updateShift: (
		shiftId: string,
		updates: Partial<ShiftInput>
	) => Promise<void>;
	createShift: (shiftData: ShiftInput) => Promise<void>;
	/** Moves a nurse between shifts in one atomic request (drag and drop). */
	moveNurse: (
		nurseId: string,
		fromShiftId: string | null,
		toShiftId: string | null
	) => Promise<void>;
	deleteShift: (shiftId: string) => Promise<void>;
	previewShift: (
		shiftData: ShiftInput,
		shiftId?: string
	) => Promise<ScheduleConflict[]>;
	fetchSwapRequests: (status?: SwapRequest["status"]) => Promise<void>;
	createSwapRequest: (
		request: Omit<SwapRequest, "id" | "createdAt" | "updatedAt">
	) => Promise<void>;
	approveSwapRequest: (requestId: string) => Promise<void>;
	cancelSwapRequest: (requestId: string) => Promise<void>;
	rejectSwapRequest: (requestId: string) => Promise<void>;
	fetchWorkloadData: (
		nurseId: string,
		month: number,
		year: number
	) => Promise<void>;

	exportSchedules: (
		months: number[],
		year: number,
		format: "pdf" | "excel"
	) => Promise<void>;
	/** Loads the stored conflicts of a schedule (read only). */
	fetchConflicts: (scheduleId: string) => Promise<void>;
	/** Asks the server to recompute conflicts and workload for a schedule. */
	detectConflicts: (scheduleId: string) => Promise<void>;
	setCurrentSchedule: (schedule: Schedule | null) => void;
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;
}

const notifyError = (title: string, apiError: ApiError) => {
	useNotificationStore.getState().addNotification({
		type: "error",
		title,
		message: apiError.message,
	});
};

const notifySuccess = (title: string, message: string) => {
	useNotificationStore.getState().addNotification({
		type: "success",
		title,
		message,
	});
};

const upsertSchedule = (schedules: Schedule[], schedule: Schedule) =>
	schedules.some((s) => s.id === schedule.id)
		? schedules.map((s) => (s.id === schedule.id ? schedule : s))
		: [...schedules, schedule];

const allShifts = (schedules: Schedule[]) =>
	schedules.flatMap((schedule) => schedule.shifts ?? []);

/** Replaces (or appends) one shift inside every list that holds it. */
const withShift = (
	state: Pick<ScheduleStore, "shifts" | "schedules" | "currentSchedule">,
	shift: Shift
) => {
	const put = (list: Shift[]) =>
		list.some((s) => s.id === shift.id)
			? list.map((s) => (s.id === shift.id ? shift : s))
			: [...list, shift];
	const inSchedule = (schedule: Schedule) =>
		schedule.id === shift.scheduleId
			? { ...schedule, shifts: put(schedule.shifts ?? []) }
			: schedule;
	return {
		shifts: put(state.shifts),
		schedules: state.schedules.map(inSchedule),
		currentSchedule: state.currentSchedule
			? inSchedule(state.currentSchedule)
			: null,
	};
};

const withoutShift = (
	state: Pick<ScheduleStore, "shifts" | "schedules" | "currentSchedule">,
	shiftId: string
) => {
	const drop = (schedule: Schedule) => ({
		...schedule,
		shifts: (schedule.shifts ?? []).filter((s) => s.id !== shiftId),
	});
	return {
		shifts: state.shifts.filter((s) => s.id !== shiftId),
		schedules: state.schedules.map(drop),
		currentSchedule: state.currentSchedule
			? drop(state.currentSchedule)
			: null,
	};
};

const toShiftBody = (input: ShiftInput) => ({
	...input,
	date: toIsoDate(input.date),
	requirements: (input.requirements ?? []).filter(
		(r): r is string => typeof r === "string"
	),
});

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
	schedules: [],
	currentSchedule: null,
	shifts: [],
	swapRequests: [],
	workloadData: [],
	conflicts: [],
	loadingState: {
		isLoading: false,
		error: null,
	},

	fetchSchedules: async (filters?: ScheduleFilters) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const query = new URLSearchParams();
			if (filters?.month) query.set("month", String(filters.month));
			if (filters?.year) query.set("year", String(filters.year));
			if (filters?.status) query.set("status", filters.status);
			const qs = query.toString();

			const response = await apiClient.get<Schedule[]>(
				qs ? `/schedules?${qs}` : "/schedules"
			);
			set({
				schedules: response.data,
				shifts: allShifts(response.data),
				loadingState: { isLoading: false, error: null },
			});

			// Conflicts are stored per schedule; load them for every schedule still being worked on.
			response.data
				.filter((schedule) => schedule.status !== "Archived")
				.forEach((schedule) => {
					void get().fetchConflicts(schedule.id);
				});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Loading Schedules", apiError);
		}
	},

	fetchSchedule: async (id: string) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.get<Schedule>(`/schedules/${id}`);
			set((state) => {
				const schedules = upsertSchedule(state.schedules, response.data);
				return {
					schedules,
					currentSchedule: response.data,
					shifts: allShifts(schedules),
					loadingState: { isLoading: false, error: null },
				};
			});
			void get().fetchConflicts(id);
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Loading Schedule", apiError);
		}
	},

	generateSchedule: async (
		month: number,
		year: number,
		params: ScheduleGenerationParams,
		idempotencyKey?: string
	) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.post<ScheduleGenerationResult>(
				"/schedules/generate",
				{ ...params, month, year },
				// A retry carrying the same key returns the first result instead of "already exists".
				idempotencyKey
					? { headers: { "Idempotency-Key": idempotencyKey } }
					: undefined
			);
			const { schedule, conflicts, stats } = response.data;
			set((state) => {
				const schedules = upsertSchedule(state.schedules, schedule);
				return {
					schedules,
					currentSchedule: schedule,
					shifts: allShifts(schedules),
					conflicts: [
						...state.conflicts.filter(
							(c) => c.scheduleId !== schedule.id
						),
						...conflicts,
					],
					workloadData: stats,
					loadingState: { isLoading: false, error: null },
				};
			});
			notifySuccess(
				"Schedule Generated",
				`Successfully generated schedule for ${month}/${year}`
			);
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Generating Schedule", apiError);
			throw error;
		}
	},

	updateScheduleStatus: async (scheduleId, status) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.put<Schedule>(
				`/schedules/${scheduleId}/status`,
				{ status }
			);
			set((state) => {
				const schedules = upsertSchedule(state.schedules, response.data);
				return {
					schedules,
					currentSchedule:
						state.currentSchedule?.id === scheduleId
							? response.data
							: state.currentSchedule,
					loadingState: { isLoading: false, error: null },
				};
			});
			notifySuccess("Schedule Updated", response.message);
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Updating Schedule", apiError);
			throw error;
		}
	},

	rescheduleSchedule: async (scheduleId, request) => {
		try {
			const response = await apiClient.post<RescheduleResult>(
				`/schedules/${scheduleId}/reschedule`,
				{
					...request,
					fromDate: toIsoDate(request.fromDate),
					toDate: request.toDate ? toIsoDate(request.toDate) : undefined,
				}
			);
			if (!request.dryRun) {
				await get().fetchSchedule(scheduleId);
				notifySuccess("Schedule Rescheduled", response.message);
			}
			return response.data;
		} catch (error) {
			notifyError("Error Rescheduling", error as ApiError);
			throw error;
		}
	},

	fetchScheduleChanges: async (scheduleId: string) => {
		const response = await apiClient.get<ScheduleChangeLog[]>(
			`/schedules/${scheduleId}/changes`
		);
		return response.data;
	},

	updateShift: async (shiftId: string, updates: Partial<ShiftInput>) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			// The API validates a full shift, so merge the changes into the stored shift first.
			const existing = get().shifts.find((shift) => shift.id === shiftId);
			if (!existing) {
				throw { message: "Shift not found. Reload the schedule and try again." } as ApiError;
			}
			const body = toShiftBody({
				scheduleId: existing.scheduleId,
				date: existing.date,
				startTime: existing.startTime,
				endTime: existing.endTime,
				type: existing.type,
				department: existing.department,
				requiredStaff: existing.requiredStaff,
				assignedNurses: existing.assignedNurses,
				requirements: existing.requirements,
				version: existing.version,
				...updates,
			});

			const response = await apiClient.put<Shift>(
				`/schedules/shifts/${shiftId}`,
				body
			);
			set((state) => ({
				...withShift(state, response.data),
				loadingState: { isLoading: false, error: null },
			}));
			if (response.data.scheduleId) {
				await get().fetchConflicts(response.data.scheduleId);
			}
			notifySuccess("Shift Updated", `Successfully updated shift ${shiftId}`);
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Updating Shift", apiError);
			throw error;
		}
	},

	createShift: async (shiftData: ShiftInput) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.post<Shift>(
				"/schedules/shifts",
				toShiftBody(shiftData)
			);
			set((state) => ({
				...withShift(state, response.data),
				loadingState: { isLoading: false, error: null },
			}));
			if (response.data.scheduleId) {
				await get().fetchConflicts(response.data.scheduleId);
			}
			notifySuccess("Shift Created", "Successfully created new shift");
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Creating Shift", apiError);
			throw error;
		}
	},

	deleteShift: async (shiftId: string) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const scheduleId = get().shifts.find(
				(shift) => shift.id === shiftId
			)?.scheduleId;
			await apiClient.delete(`/schedules/shifts/${shiftId}`);
			set((state) => ({
				...withoutShift(state, shiftId),
				conflicts: state.conflicts.filter((c) => c.shiftId !== shiftId),
				loadingState: { isLoading: false, error: null },
			}));
			if (scheduleId) {
				await get().fetchConflicts(scheduleId);
			}
			notifySuccess("Shift Deleted", `Successfully deleted shift ${shiftId}`);
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Deleting Shift", apiError);
			throw error;
		}
	},

	moveNurse: async (nurseId, fromShiftId, toShiftId) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.post<Shift[]>(
				"/schedules/shifts/move",
				{ nurseId, fromShiftId, toShiftId }
			);
			set((state) => ({
				...response.data.reduce(
					(acc, shift) => ({ ...acc, ...withShift(acc, shift) }),
					{
						shifts: state.shifts,
						schedules: state.schedules,
						currentSchedule: state.currentSchedule,
					}
				),
				loadingState: { isLoading: false, error: null },
			}));
			const scheduleIds = new Set(
				response.data
					.map((shift) => shift.scheduleId)
					.filter((id): id is string => !!id)
			);
			await Promise.all(
				[...scheduleIds].map((id) => get().fetchConflicts(id))
			);
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Updating Assignment", apiError);
			throw error;
		}
	},

	previewShift: async (shiftData: ShiftInput, shiftId?: string) => {
		const qs = shiftId ? `?shiftId=${encodeURIComponent(shiftId)}` : "";
		const response = await apiClient.post<ScheduleConflict[]>(
			`/schedules/shifts/validate${qs}`,
			toShiftBody(shiftData)
		);
		return response.data;
	},

	fetchSwapRequests: async (status?: SwapRequest["status"]) => {
		try {
			const response = await apiClient.get<SwapRequest[]>(
				status
					? `/schedules/swap-requests?status=${status}`
					: "/schedules/swap-requests"
			);
			set({ swapRequests: response.data });
		} catch (error) {
			notifyError("Error Loading Swap Requests", error as ApiError);
		}
	},

	createSwapRequest: async (
		request: Omit<SwapRequest, "id" | "createdAt" | "updatedAt">
	) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.post<SwapRequest>(
				"/schedules/swap-requests",
				request
			);
			set((state) => ({
				swapRequests: [...state.swapRequests, response.data],
				loadingState: { isLoading: false, error: null },
			}));
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Swap Request Created",
				message: "Successfully created swap request",
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Creating Swap Request",
				message: apiError.message,
			});
			throw error;
		}
	},

	approveSwapRequest: async (requestId: string) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.put<SwapRequest>(
				`/schedules/swap-requests/${requestId}/approve`,
				{}
			);
			set((state) => ({
				swapRequests: state.swapRequests.map((request) =>
					request.id === requestId ? response.data : request
				),
				loadingState: { isLoading: false, error: null },
			}));
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Swap Request Approved",
				message: `Successfully approved swap request ${requestId}`,
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Approving Swap Request",
				message: apiError.message,
			});
			throw error;
		}
	},

	cancelSwapRequest: async (requestId: string) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.put<SwapRequest>(
				`/schedules/swap-requests/${requestId}/cancel`,
				{}
			);
			set((state) => ({
				swapRequests: state.swapRequests.map((request) =>
					request.id === requestId ? response.data : request
				),
				loadingState: { isLoading: false, error: null },
			}));
			notifySuccess("Swap Request Cancelled", response.message);
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Cancelling Swap Request", apiError);
			throw error;
		}
	},

	rejectSwapRequest: async (requestId: string) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.put<SwapRequest>(
				`/schedules/swap-requests/${requestId}/reject`,
				{}
			);
			set((state) => ({
				swapRequests: state.swapRequests.map((request) =>
					request.id === requestId ? response.data : request
				),
				loadingState: { isLoading: false, error: null },
			}));
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Swap Request Rejected",
				message: `Successfully rejected swap request ${requestId}`,
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Rejecting Swap Request",
				message: apiError.message,
			});
			throw error;
		}
	},

	fetchWorkloadData: async (nurseId: string, month: number, year: number) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.get<WorkloadData[]>(
				`/schedules/workload?nurseId=${nurseId}&month=${month}&year=${year}`
			);
			set({
				workloadData: response.data,
				loadingState: { isLoading: false, error: null },
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Loading Workload Data",
				message: apiError.message,
			});
		}
	},

	exportSchedules: async (
		months: number[],
		year: number,
		format: "pdf" | "excel"
	) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.getBlobWithHeaders(
				`/schedules/export?months=${months.join(
					","
				)}&year=${year}&format=${format}`,
				{
					headers: {
						Accept:
							format === "pdf"
								? "application/pdf"
								: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					},
				}
			);

			// Extract filename from content-disposition header
			const contentDisposition = response.headers["content-disposition"];
			let fileName = `schedules-${year}-${months.join("_")}.${format === "pdf" ? "pdf" : "xlsx"}`; // fallback

			if (contentDisposition) {
				const filenameMatch =
					contentDisposition.match(/filename="(.+)"/);
				if (filenameMatch && filenameMatch[1]) {
					fileName = filenameMatch[1];
				}
			}

			// Convert ArrayBuffer to Blob
			const blob = new Blob([response.data], {
				type:
					response.headers["content-type"] ||
					(format === "pdf"
						? "application/pdf"
						: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
			});

			// Create download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;

			// Set filename based on the format
			link.setAttribute("download", fileName);

			// Trigger download
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			set({ loadingState: { isLoading: false, error: null } });
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Schedules Exported",
				message: `Successfully exported schedules for ${months.join(
					", "
				)}/${year} as ${format}`,
			});
		} catch (error) {
			const apiError = error as ApiError;

			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Exporting Schedules",
				message: apiError.message,
			});
		}
	},

	fetchConflicts: async (scheduleId: string) => {
		try {
			const response = await apiClient.get<ScheduleConflict[]>(
				`/schedules/${scheduleId}/conflicts`
			);
			set((state) => ({
				conflicts: [
					...state.conflicts.filter((c) => c.scheduleId !== scheduleId),
					...response.data,
				],
			}));
		} catch (error) {
			// Conflicts are supplementary; do not interrupt the screen if they fail to load.
			console.error("Failed to load conflicts", error);
		}
	},

	detectConflicts: async (scheduleId: string) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.post<ScheduleConflict[]>(
				`/schedules/${scheduleId}/validate`,
				{}
			);
			set((state) => ({
				conflicts: [
					...state.conflicts.filter((c) => c.scheduleId !== scheduleId),
					...response.data,
				],
				loadingState: { isLoading: false, error: null },
			}));
			notifySuccess("Schedule Checked", response.message);
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			notifyError("Error Detecting Conflicts", apiError);
		}
	},

	setCurrentSchedule: (schedule) => {
		set({ currentSchedule: schedule });
	},

	setLoading: (isLoading) => {
		set((state) => ({
			loadingState: { ...state.loadingState, isLoading },
		}));
	},

	setError: (error) => {
		set((state) => ({
			loadingState: { ...state.loadingState, error },
		}));
	},
}));
