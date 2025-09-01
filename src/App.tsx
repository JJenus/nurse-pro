import React, { useState } from "react";
import { Layout } from "./components/Layout/Layout";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { NurseList } from "./components/Nurses/NurseList";
import { NurseForm } from "./components/Nurses/NurseForm";
import { BulkUpload } from "./components/Nurses/BulkUpload";
import { SchedulePage } from "./components/Schedule/SchedulePage";
import { SwapRequestList } from "./components/SwapRequests/SwapRequestList";
import { ShiftForm } from "./components/Schedule/ShiftForm";
import { Nurse } from "./types";
import { NurseProfile } from "./components/Nurses/NurseProfile";

function App() {
	const [currentPage, setCurrentPage] = useState("dashboard");
	const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
	const [showShiftForm, setShowShiftForm] = useState(false);
	const [shiftFormDate, setShiftFormDate] = useState<Date>(new Date());

	const getPageTitle = () => {
		switch (currentPage) {
			case "dashboard":
				return "Dashboard";
			case "nurses":
				return "Nurses";
			case "add-nurse":
				return "Add Nurse";
			case "edit-nurse":
				return "Edit Nurse";
			case "view-nurse":
				return "Nurse Profile";
			case "bulk-upload":
				return "Bulk Upload";
			case "schedule":
				return "Schedule";
			case "swap-requests":
				return "Swap Requests";
			case "workload":
				return "Workload Analysis";
			case "reports":
				return "Reports";
			default:
				return "Nurse Scheduler";
		}
	};

	const handleAddNurse = () => {
		setSelectedNurse(null);
		setCurrentPage("add-nurse");
	};

	const handleEditNurse = (nurse: Nurse) => {
		setSelectedNurse(nurse);
		setCurrentPage("edit-nurse");
	};

	const handleViewNurse = (nurse: Nurse) => {
		setSelectedNurse(nurse);
		setCurrentPage("view-nurse");
	};

	const handleFormSuccess = () => {
		setSelectedNurse(null);
		setCurrentPage("nurses");
	};

	const handleFormCancel = () => {
		setSelectedNurse(null);
		setCurrentPage("nurses");
	};

	const handleAddShift = (date: Date) => {
		setShiftFormDate(date);
		setShowShiftForm(true);
	};

	const handleShiftFormSuccess = () => {
		setShowShiftForm(false);
	};

	const handleShiftFormCancel = () => {
		setShowShiftForm(false);
	};

	const renderCurrentPage = () => {
		switch (currentPage) {
			case "dashboard":
				return <Dashboard />;

			case "nurses":
				return (
					<NurseList
						onAddNew={handleAddNurse}
						onEditNurse={handleEditNurse}
						onViewNurse={handleViewNurse}
					/>
				);

			case "add-nurse":
				return (
					<NurseForm
						onCancel={handleFormCancel}
						onSuccess={handleFormSuccess}
					/>
				);

			case "edit-nurse":
				return (
					<NurseForm
						nurse={selectedNurse || undefined}
						onCancel={handleFormCancel}
						onSuccess={handleFormSuccess}
					/>
				);

			case "bulk-upload":
				return (
					<BulkUpload
						onCancel={() => setCurrentPage("nurses")}
						onSuccess={() => setCurrentPage("nurses")}
					/>
				);

			case "schedule":
				return <SchedulePage onAddShift={handleAddShift} />;

			case "swap-requests":
				return <SwapRequestList />;

			case "view-nurse":
				return selectedNurse ? (
					<NurseProfile nurse={selectedNurse} />
				) : (
					<div className="text-center py-12">
						<p className="text-gray-600">Nurse not found</p>
					</div>
				);

			case "workload":
				return (
					<div className="text-center py-12">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">
							Workload Analysis
						</h2>
						<p className="text-gray-600">
							Coming soon - Workload fairness tracking and
							analytics
						</p>
					</div>
				);

			case "reports":
				return (
					<div className="text-center py-12">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">
							Reports & Export
						</h2>
						<p className="text-gray-600">
							Coming soon - Generate and export reports
						</p>
					</div>
				);

			default:
				return <Dashboard />;
		}
	};

	return (
		<Layout
			title={getPageTitle()}
			currentPage={currentPage}
			onPageChange={setCurrentPage}
		>
			{renderCurrentPage()}

			{/* Global Shift Form Modal */}
			{showShiftForm && (
				<ShiftForm
					date={shiftFormDate}
					onCancel={handleShiftFormCancel}
					onSuccess={handleShiftFormSuccess}
				/>
			)}
		</Layout>
	);
}

export default App;
