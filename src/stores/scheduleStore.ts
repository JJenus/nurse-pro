import { create } from "zustand";
import {
	Schedule,
	Shift,
	SwapRequest,
	WorkloadData,
	LoadingState,
	ApiError,
	ScheduleGenerationParams,
	ScheduleConflict,
} from "../types";
import { apiClient } from "../utils/api";
import { useNotificationStore } from "./notificationStore";

interface ScheduleStore {
	schedules: Schedule[];
	currentSchedule: Schedule | null;
	shifts: Shift[];
	swapRequests: SwapRequest[];
	workloadData: WorkloadData[];
	conflicts: ScheduleConflict[];
	loadingState: LoadingState;

	fetchSchedules: () => Promise<void>;
	fetchSchedule: (id: string) => Promise<void>;
	generateSchedule: (
		month: number,
		year: number,
		params: ScheduleGenerationParams
	) => Promise<void>;
	updateShift: (shiftId: string, updates: Partial<Shift>) => Promise<void>;
	createShift: (shiftData: Omit<Shift, "id">) => Promise<void>;
	deleteShift: (shiftId: string) => Promise<void>;
	createSwapRequest: (
		request: Omit<SwapRequest, "id" | "createdAt" | "updatedAt">
	) => Promise<void>;
	approveSwapRequest: (requestId: string) => Promise<void>;
	rejectSwapRequest: (requestId: string) => Promise<void>;
	fetchWorkloadData: (
		nurseId: string,
		month: number,
		year: number
	) => Promise<void>;
	exportSchedule: (
		scheduleId: string,
		format: "pdf" | "excel"
	) => Promise<void>;
	exportSchedules: (
		months: number[],
		year: number,
		format: "pdf" | "excel"
	)=> Promise<void>;
	detectConflicts: (scheduleId: string) => Promise<void>;
	setCurrentSchedule: (schedule: Schedule | null) => void;
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;
}

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

	fetchSchedules: async () => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.get<Schedule[]>("/schedules");
			const flattenedShifts = response.data.flatMap(
				(schedule) => schedule.shifts
			);
			set({
				schedules: response.data,
				shifts: flattenedShifts,
				loadingState: { isLoading: false, error: null },
			});
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Schedules Loaded",
				message: "Successfully fetched all schedules",
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Loading Schedules",
				message: apiError.message,
			});
		}
	},

	fetchSchedule: async (id: string) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.get<Schedule>(`/schedules/${id}`);
			set({
				currentSchedule: response.data,
				shifts: response.data.shifts,
				loadingState: { isLoading: false, error: null },
			});
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Schedule Loaded",
				message: `Successfully fetched schedule ${id}`,
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Loading Schedule",
				message: apiError.message,
			});
		}
	},

	generateSchedule: async (
		month: number,
		year: number,
		params: ScheduleGenerationParams
	) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.post<Schedule>(
				"/schedules/generate",
				{ ...params, month, year }
			);
			set((state) => ({
				schedules: [...state.schedules, response.data],
				currentSchedule: response.data,
				shifts: response.data.shifts,
				loadingState: { isLoading: false, error: null },
			}));
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Schedule Generated",
				message: `Successfully generated schedule for ${month}/${year}`,
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Generating Schedule",
				message: apiError.message,
			});
			throw error;
		}
	},

	updateShift: async (shiftId: string, updates: Partial<Shift>) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.put<Shift>(
				`/schedules/shifts/${shiftId}`,
				updates
			);
			set((state) => ({
				shifts: state.shifts.map((shift) =>
					shift.id === shiftId ? response.data : shift
				),
				currentSchedule: state.currentSchedule
					? {
							...state.currentSchedule,
							shifts: state.currentSchedule.shifts.map((shift) =>
								shift.id === shiftId ? response.data : shift
							),
					  }
					: null,
				loadingState: { isLoading: false, error: null },
			}));
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Shift Updated",
				message: `Successfully updated shift ${shiftId}`,
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Updating Shift",
				message: apiError.message,
			});
			throw error;
		}
	},

	createShift: async (shiftData: Omit<Shift, "id">) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.post<Shift>(
				"/schedules/shifts",
				shiftData
			);
			set((state) => ({
				shifts: [...state.shifts, response.data],
				currentSchedule: state.currentSchedule
					? {
							...state.currentSchedule,
							shifts: [
								...state.currentSchedule.shifts,
								response.data,
							],
					  }
					: null,
				loadingState: { isLoading: false, error: null },
			}));
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Shift Created",
				message: "Successfully created new shift",
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Creating Shift",
				message: apiError.message,
			});
			throw error;
		}
	},

	deleteShift: async (shiftId: string) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			await apiClient.delete(`/schedules/shifts/${shiftId}`);
			set((state) => ({
				shifts: state.shifts.filter((shift) => shift.id !== shiftId),
				currentSchedule: state.currentSchedule
					? {
							...state.currentSchedule,
							shifts: state.currentSchedule.shifts.filter(
								(shift) => shift.id !== shiftId
							),
					  }
					: null,
				loadingState: { isLoading: false, error: null },
			}));
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Shift Deleted",
				message: `Successfully deleted shift ${shiftId}`,
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Deleting Shift",
				message: apiError.message,
			});
			throw error;
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
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Workload Data Loaded",
				message: `Successfully fetched workload data for ${month}/${year}`,
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
		  const response = await apiClient.get<any>(
			`/schedules/export?months=${months.join(",")}&year=${year}&format=${format}`,
			{
			  responseType: "blob",
			}
		  );
		  
		  // Handle different response structures
		  let blobData;
		  if (response.data instanceof Blob) {
			blobData = response.data;
		  } else if (response.data?.data instanceof Blob) {
			// If the blob is nested in a data property
			blobData = response.data.data;
		  } else if (response.data instanceof ArrayBuffer) {
			// Convert ArrayBuffer to Blob
			blobData = new Blob([response.data], { 
			  type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
			});
		  } else {
			// Try to create blob from whatever data we received
			const data = response.data || response;
			blobData = new Blob([JSON.stringify(data)], { type: 'application/octet-stream' });
		  }
	  
		  if (!(blobData instanceof Blob)) {
			throw new Error("Failed to create blob from response data");
		  }
	  
		  const url = window.URL.createObjectURL(blobData);
		  const link = document.createElement("a");
		  link.href = url;
		  link.setAttribute(
			"download",
			`schedules-${year}-${months.join("_")}.${format}`
		  );
		  document.body.appendChild(link);
		  link.click();
		  document.body.removeChild(link);
		  window.URL.revokeObjectURL(url);
		  
		  set({ loadingState: { isLoading: false, error: null } });
		  useNotificationStore.getState().addNotification({
			type: "success",
			title: "Schedules Exported",
			message: `Successfully exported schedules for ${months.join(", ")}/${year} as ${format}`,
		  });
		} catch (error) {
		  const errorMessage =
			error instanceof Error
			  ? error.message
			  : "Unknown error occurred";
		  set({ loadingState: { isLoading: false, error: errorMessage } });
		  useNotificationStore.getState().addNotification({
			type: "error",
			title: "Error Exporting Schedules",
			message: errorMessage,
		  });
		  throw error;
		}
	  },

	exportSchedule: async (scheduleId: string, format: "pdf" | "excel") => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.get(
				`/schedules/${scheduleId}/export?format=${format}`,
				{
					responseType: "blob",
				}
			);
			if (!(response.data instanceof Blob)) {
				throw new Error("Response data is not a Blob");
			}
			const url = window.URL.createObjectURL(response.data);
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `schedule-${scheduleId}.${format}`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			set({ loadingState: { isLoading: false, error: null } });
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Schedule Exported",
				message: `Successfully exported schedule ${scheduleId} as ${format}`,
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error occurred";
			set({ loadingState: { isLoading: false, error: errorMessage } });
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Exporting Schedule",
				message: errorMessage,
			});
			throw error;
		}
	},

	detectConflicts: async (scheduleId: string) => {
		set({ loadingState: { isLoading: true, error: null } });
		try {
			const response = await apiClient.get<ScheduleConflict[]>(
				`/schedules/${scheduleId}/conflicts`
			);
			set({
				conflicts: response.data,
				loadingState: { isLoading: false, error: null },
			});
			useNotificationStore.getState().addNotification({
				type: "success",
				title: "Conflicts Detected",
				message: `Successfully checked conflicts for schedule ${scheduleId}`,
			});
		} catch (error) {
			const apiError = error as ApiError;
			set({
				loadingState: { isLoading: false, error: apiError.message },
			});
			useNotificationStore.getState().addNotification({
				type: "error",
				title: "Error Detecting Conflicts",
				message: apiError.message,
			});
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
