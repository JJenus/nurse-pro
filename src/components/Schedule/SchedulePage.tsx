import React, { useState, useEffect, Fragment } from "react";
import { Calendar, Table, Wand2, Download, RefreshCw, X } from "lucide-react";
import { useScheduleStore } from "../../stores/scheduleStore";
import { useUIStore } from "../../stores/uiStore";
import { useNurseStore } from "../../stores/nurseStore";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { ScheduleEditor } from "./ScheduleEditor";
import { ScheduleGenerator } from "./ScheduleGenerator";
import { ScheduleTable } from "./ScheduleTable";
import { ShiftDetailsModal } from "./ShiftDetailsModal";
import { Shift } from "../../types";
import { Transition, Dialog, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";

interface SchedulePageProps {
	onAddShift?: (date: Date) => void;
}

interface ExportModalProps {
	isOpen: boolean;
	onClose: () => void;
	onExport: (months: number[], year: number, format: "pdf" | "excel") => void;
	loading: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({
	isOpen,
	onClose,
	onExport,
	loading,
}) => {
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
	const [selectedMonths, setSelectedMonths] = useState<number[]>([
		new Date().getMonth() + 1,
	]);

	const months = [
		{ value: 1, label: "January" },
		{ value: 2, label: "February" },
		{ value: 3, label: "March" },
		{ value: 4, label: "April" },
		{ value: 5, label: "May" },
		{ value: 6, label: "June" },
		{ value: 7, label: "July" },
		{ value: 8, label: "August" },
		{ value: 9, label: "September" },
		{ value: 10, label: "October" },
		{ value: 11, label: "November" },
		{ value: 12, label: "December" },
	];

	const years = Array.from(
		{ length: 7 },
		(_, i) => new Date().getFullYear() - 3 + i
	);

	const toggleMonth = (month: number) => {
		setSelectedMonths((prev) =>
			prev.includes(month)
				? prev.filter((m) => m !== month)
				: [...prev, month]
		);
	};

	const selectAllMonths = () => {
		setSelectedMonths(months.map((m) => m.value));
	};

	const clearSelection = () => {
		setSelectedMonths([]);
	};

	const handleExport = (format: "pdf" | "excel") => {
		if (selectedMonths.length === 0) return;
		onExport(selectedMonths, selectedYear, format);
	};

	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog as="div" className="relative z-50" onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black bg-opacity-50" />
				</TransitionChild>

				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4 text-center">
						<TransitionChild
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95"
						>
							<DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
								{/* Header */}
								<div className="flex items-center justify-between mb-4">
									<DialogTitle
										as="h3"
										className="text-lg font-semibold text-gray-900"
									>
										Export Schedules
									</DialogTitle>
									<button
										onClick={onClose}
										className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
										disabled={loading}
									>
										<X className="h-5 w-5" />
									</button>
								</div>

								<div className="space-y-4">
									{/* Year Selection */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Year
										</label>
										<select
											value={selectedYear}
											onChange={(e) =>
												setSelectedYear(
													parseInt(e.target.value)
												)
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
											disabled={loading}
										>
											{years.map((year) => (
												<option key={year} value={year}>
													{year}
												</option>
											))}
										</select>
									</div>

									{/* Month Selection */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<label className="block text-sm font-medium text-gray-700">
												Months ({selectedMonths.length}{" "}
												selected)
											</label>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={selectAllMonths}
													className="text-xs text-blue-600 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
													disabled={loading}
												>
													Select All
												</button>
												<button
													type="button"
													onClick={clearSelection}
													className="text-xs text-gray-600 hover:text-gray-800 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 rounded"
													disabled={loading}
												>
													Clear
												</button>
											</div>
										</div>

										<div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
											{months.map((month) => (
												<button
													key={month.value}
													type="button"
													onClick={() =>
														toggleMonth(month.value)
													}
													disabled={loading}
													className={`
                            p-2 text-sm rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                            ${
								selectedMonths.includes(month.value)
									? "bg-blue-100 border-blue-300 text-blue-800"
									: "border-gray-200 text-gray-700 hover:bg-gray-50"
							}
                            ${loading ? "opacity-50 cursor-not-allowed" : ""}
                          `}
												>
													{month.label.slice(0, 3)}
												</button>
											))}
										</div>
									</div>

									{/* Export Actions */}
									<div className="flex gap-3 pt-4 border-t border-gray-200">
										<button
											type="button"
											onClick={onClose}
											disabled={loading}
											className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={() => handleExport("pdf")}
											disabled={
												selectedMonths.length === 0 ||
												loading
											}
											className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
										>
											{loading
												? "Exporting..."
												: "Export PDF"}
										</button>
										<button
											type="button"
											onClick={() =>
												handleExport("excel")
											}
											disabled={
												selectedMonths.length === 0 ||
												loading
											}
											className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
										>
											{loading
												? "Exporting..."
												: "Export Excel"}
										</button>
									</div>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
};

export const SchedulePage: React.FC<SchedulePageProps> = ({ onAddShift }) => {
	const { currentView, selectedDate, setCurrentView, setSelectedDate } =
		useUIStore();
	const { fetchSchedules, exportSchedules, loadingState } =
		useScheduleStore();
	const { nurses } = useNurseStore();

	const [showGenerator, setShowGenerator] = useState(false);
	const [showExportModal, setShowExportModal] = useState(false);
	const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
	const [showShiftEditor, setShowShiftEditor] = useState(false);
	const [showShiftDetails, setShowShiftDetails] = useState(false);

	useEffect(() => {
		fetchSchedules();
	}, [fetchSchedules]);

	const handleShiftClick = (shift: Shift) => {
		setSelectedShift(shift);
		setShowShiftDetails(true);
	};

	const handleEditShift = () => {
		setShowShiftDetails(false);
		setShowShiftEditor(true);
	};

	const handleAddShift = (date: Date) => {
		setSelectedDate(date);
		setSelectedShift(null);
		if (onAddShift) {
			onAddShift(date);
		} else {
			setShowShiftEditor(true);
		}
	};

	const handleExportClick = () => {
		setShowExportModal(true);
	};

	const handleExport = async (
		months: number[],
		year: number,
		format: "pdf" | "excel"
	) => {
		try {
			await exportSchedules(months, year, format);
			setShowExportModal(false);
		} catch (error) {
			console.log("Export error:", error);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						Schedule Management
					</h1>
					<p className="text-gray-600">
						Manage shifts and assignments with drag-and-drop
						functionality
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => setShowGenerator(true)}
						className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
					>
						<Wand2 className="h-4 w-4" />
						Generate Schedule
					</button>

					<div className="flex items-center bg-gray-100 rounded-lg p-1">
						<button
							onClick={handleExportClick}
							disabled={loadingState.isLoading}
							className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors disabled:opacity-50"
						>
							<Download className="h-3 w-3" />
							Export
						</button>
					</div>
				</div>
			</div>

			{/* View Toggle */}
			<div className="flex items-center gap-2">
				<div className="flex items-center bg-gray-100 rounded-lg p-1">
					<button
						onClick={() => setCurrentView("calendar")}
						className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
              ${
					currentView === "calendar"
						? "bg-white text-blue-600 shadow-sm"
						: "text-gray-600 hover:text-gray-900"
				}
            `}
					>
						<Calendar className="h-4 w-4" />
						Calendar
					</button>
					<button
						onClick={() => setCurrentView("table")}
						className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
              ${
					currentView === "table"
						? "bg-white text-blue-600 shadow-sm"
						: "text-gray-600 hover:text-gray-900"
				}
            `}
					>
						<Table className="h-4 w-4" />
						Table
					</button>
				</div>

				<button
					onClick={() => fetchSchedules()}
					disabled={loadingState.isLoading}
					className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
				>
					<RefreshCw
						className={`h-4 w-4 ${
							loadingState.isLoading ? "animate-spin" : ""
						}`}
					/>
					Refresh
				</button>
			</div>

			{/* Main Content */}
			{currentView === "calendar" ? (
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					<div className="xl:col-span-2">
						<ScheduleCalendar
							selectedDate={selectedDate}
							onDateSelect={setSelectedDate}
							onShiftClick={handleShiftClick}
							onAddShift={handleAddShift}
						/>
					</div>

					<div className="xl:col-span-1">
						<ScheduleEditor
							selectedDate={selectedDate}
							onShiftEdit={handleShiftClick}
							onShiftAdd={handleAddShift}
						/>
					</div>
				</div>
			) : (
				<ScheduleTable
					onShiftClick={handleShiftClick}
					onAddShift={handleAddShift}
				/>
			)}

			{/* Schedule Generator Modal */}
			{showGenerator && (
				<ScheduleGenerator onClose={() => setShowGenerator(false)} />
			)}

			{/* Export Modal */}
			<ExportModal
				isOpen={showExportModal}
				onClose={() => setShowExportModal(false)}
				onExport={handleExport}
				loading={loadingState.isLoading}
			/>

			{/* Shift Details Modal */}
			{selectedShift && (
				<ShiftDetailsModal
					shift={selectedShift}
					nurses={nurses}
					isOpen={showShiftDetails}
					onClose={() => setShowShiftDetails(false)}
					onEdit={handleEditShift}
				/>
			)}

			{/* Shift Editor Modal (existing functionality) */}
			{showShiftEditor && (
				// Your existing shift editor component here
				// This would be your current modal for editing shifts
				<div>Shift Editor Component</div>
			)}
		</div>
	);
};
