import React, { Fragment, useEffect, useState } from "react";
import {
	Dialog,
	DialogPanel,
	DialogTitle,
	Transition,
	TransitionChild,
} from "@headlessui/react";
import { History, X } from "lucide-react";
import { useScheduleStore } from "../../stores/scheduleStore";
import { useNurseStore } from "../../stores/nurseStore";
import { Schedule, ScheduleChangeLog } from "../../types";

interface ScheduleHistoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	schedule: Schedule;
}

const ACTION_LABELS: Record<string, string> = {
	RESCHEDULE: "Rescheduled",
	STATUS_CHANGED: "Status changed",
	SCHEDULE_REPLACED: "Draft replaced",
	SHIFT_CREATED: "Shift created",
	SHIFT_UPDATED: "Shift updated",
	SHIFT_DELETED: "Shift deleted",
	NURSE_MOVED: "Nurse moved",
	SWAP_APPROVED: "Swap approved",
};

export const ScheduleHistoryModal: React.FC<ScheduleHistoryModalProps> = ({
	isOpen,
	onClose,
	schedule,
}) => {
	const { fetchScheduleChanges } = useScheduleStore();
	const { nurses } = useNurseStore();
	const [entries, setEntries] = useState<ScheduleChangeLog[] | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		let cancelled = false;
		setEntries(null);
		setFailed(false);
		fetchScheduleChanges(schedule.id)
			.then((log) => !cancelled && setEntries(log))
			.catch(() => !cancelled && setFailed(true));
		return () => {
			cancelled = true;
		};
	}, [isOpen, schedule.id, fetchScheduleChanges]);

	const nurseName = (id?: string) => {
		const nurse = nurses.find((n) => n.id === id);
		return nurse ? `${nurse.firstName} ${nurse.lastName}` : undefined;
	};

	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog as="div" className="relative z-50" onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-200"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-150"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black bg-opacity-50" />
				</TransitionChild>
				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4">
						<DialogPanel className="w-full max-w-2xl rounded-2xl bg-white p-6 text-left shadow-xl">
							<div className="flex items-center justify-between mb-4">
								<DialogTitle as="h3" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
									<History className="h-5 w-5 text-blue-600" />
									History of {schedule.month}/{schedule.year}
								</DialogTitle>
								<button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
									<X className="h-5 w-5" />
								</button>
							</div>

							<p className="text-sm text-gray-600 mb-4">
								Reschedules, status changes and edits made once the schedule was published, newest first.
							</p>

							{failed && <p className="text-sm text-red-600">The history could not be loaded.</p>}
							{!failed && entries === null && <p className="text-sm text-gray-500">Loading...</p>}
							{entries !== null && entries.length === 0 && (
								<p className="text-sm text-gray-500">Nothing has been recorded yet.</p>
							)}
							{entries !== null && entries.length > 0 && (
								<ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
									{entries.map((entry) => (
										<li key={entry.id} className="py-3">
											<div className="flex items-center justify-between text-sm">
												<span className="font-medium text-gray-900">
													{ACTION_LABELS[entry.action] ?? entry.action}
													{nurseName(entry.nurseId) ? ` · ${nurseName(entry.nurseId)}` : ""}
												</span>
												<span className="text-gray-500">
													{new Date(entry.createdAt).toLocaleString()}
													{entry.actor ? ` · ${entry.actor}` : ""}
												</span>
											</div>
											{entry.details && <p className="text-sm text-gray-600 mt-1">{entry.details}</p>}
											{entry.reason && (
												<p className="text-sm text-gray-500 mt-1 italic">Reason: {entry.reason}</p>
											)}
										</li>
									))}
								</ul>
							)}
						</DialogPanel>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
};
