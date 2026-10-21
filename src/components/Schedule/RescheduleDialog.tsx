import React, { Fragment, useMemo, useState } from "react";
import {
	Dialog,
	DialogPanel,
	DialogTitle,
	Transition,
	TransitionChild,
} from "@headlessui/react";
import { X, AlertTriangle, CalendarClock } from "lucide-react";
import { useScheduleStore } from "../../stores/scheduleStore";
import { useNurseStore } from "../../stores/nurseStore";
import { Schedule, RescheduleMode, RescheduleResult } from "../../types";
import { toIsoDate } from "../../utils/dates";

interface RescheduleDialogProps {
	isOpen: boolean;
	onClose: () => void;
	schedule: Schedule;
}

const pad = (n: number) => String(n).padStart(2, "0");

export const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
	isOpen,
	onClose,
	schedule,
}) => {
	const { rescheduleSchedule } = useScheduleStore();
	const { nurses } = useNurseStore();

	const monthStart = `${schedule.year}-${pad(schedule.month)}-01`;
	const lastDay = new Date(schedule.year, schedule.month, 0).getDate();
	const monthEnd = `${schedule.year}-${pad(schedule.month)}-${pad(lastDay)}`;
	const today = toIsoDate(new Date());
	const defaultFrom = today > monthStart && today <= monthEnd ? today : monthStart;

	const [fromDate, setFromDate] = useState(defaultFrom);
	const [toDate, setToDate] = useState(monthEnd);
	const [mode, setMode] = useState<RescheduleMode>("fill_gaps");
	const [excluded, setExcluded] = useState<string[]>([]);
	const [reason, setReason] = useState("");
	const [preview, setPreview] = useState<RescheduleResult | null>(null);
	const [busy, setBusy] = useState(false);

	const nameOf = useMemo(() => {
		const byId = new Map(nurses.map((n) => [n.id, `${n.firstName} ${n.lastName}`]));
		return (id: string) => byId.get(id) ?? id;
	}, [nurses]);

	// Any change to the form invalidates the preview: the user must look at the new diff before applying.
	const edit = <T,>(setter: (value: T) => void) => (value: T) => {
		setter(value);
		setPreview(null);
	};

	const toggleNurse = (id: string) => {
		setExcluded((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
		setPreview(null);
	};

	const request = (dryRun: boolean) => ({
		fromDate,
		toDate,
		mode,
		excludeNurseIds: excluded,
		reason: reason.trim() || undefined,
		dryRun,
		revision: dryRun ? undefined : preview?.revision ?? undefined,
		seed: dryRun ? undefined : preview?.seed,
	});

	const runPreview = async () => {
		setBusy(true);
		try {
			setPreview(await rescheduleSchedule(schedule.id, request(true)));
		} catch {
			setPreview(null);
		} finally {
			setBusy(false);
		}
	};

	const apply = async () => {
		if (!preview) return;
		setBusy(true);
		try {
			await rescheduleSchedule(schedule.id, request(false));
			onClose();
		} catch {
			// the store already showed the error (e.g. the schedule changed since the preview)
			setPreview(null);
		} finally {
			setBusy(false);
		}
	};

	const formatDate = (iso: string) =>
		new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog as="div" className="relative z-50" onClose={busy ? () => undefined : onClose}>
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
									<CalendarClock className="h-5 w-5 text-blue-600" />
									Reschedule {schedule.month}/{schedule.year}
								</DialogTitle>
								<button
									onClick={onClose}
									disabled={busy}
									className="p-2 hover:bg-gray-100 rounded-lg"
									aria-label="Close"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							<p className="text-sm text-gray-600 mb-4">
								Past dates are never changed. Preview the proposed changes first; nothing is saved until you apply them.
							</p>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<label className="text-sm font-medium text-gray-700">
									From
									<input
										type="date"
										value={fromDate}
										min={monthStart}
										max={monthEnd}
										onChange={(e) => edit(setFromDate)(e.target.value)}
										className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
									/>
								</label>
								<label className="text-sm font-medium text-gray-700">
									To
									<input
										type="date"
										value={toDate}
										min={fromDate}
										max={monthEnd}
										onChange={(e) => edit(setToDate)(e.target.value)}
										className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
									/>
								</label>
							</div>

							<fieldset className="mt-4">
								<legend className="text-sm font-medium text-gray-700 mb-1">What to do</legend>
								<div className="space-y-2">
									<label className="flex items-start gap-2 text-sm">
										<input
											type="radio"
											name="mode"
											checked={mode === "fill_gaps"}
											onChange={() => edit(setMode)("fill_gaps")}
											className="mt-1"
										/>
										<span>
											<span className="font-medium">Fill gaps</span> — keep everyone who is still valid and only
											staff shifts that fall below their required staff.
										</span>
									</label>
									<label className="flex items-start gap-2 text-sm">
										<input
											type="radio"
											name="mode"
											checked={mode === "rebuild_range"}
											onChange={() => edit(setMode)("rebuild_range")}
											className="mt-1"
										/>
										<span>
											<span className="font-medium">Rebuild range</span> — generate the assignments in this
											range again from scratch.
										</span>
									</label>
								</div>
							</fieldset>

							<div className="mt-4">
								<div className="text-sm font-medium text-gray-700 mb-1">
									Nurses who cannot work in this range ({excluded.length})
								</div>
								<div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
									{nurses.map((nurse) => (
										<label key={nurse.id} className="flex items-center gap-2 text-sm">
											<input
												type="checkbox"
												checked={excluded.includes(nurse.id)}
												onChange={() => toggleNurse(nurse.id)}
											/>
											{nurse.firstName} {nurse.lastName}
										</label>
									))}
									{nurses.length === 0 && <span className="text-sm text-gray-500">No nurses loaded.</span>}
								</div>
							</div>

							<label className="block mt-4 text-sm font-medium text-gray-700">
								Reason (kept in the schedule's history)
								<textarea
									value={reason}
									maxLength={1000}
									rows={2}
									onChange={(e) => edit(setReason)(e.target.value)}
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
									placeholder="e.g. sick leave, resignation, ward closure"
								/>
							</label>

							{preview && (
								<div className="mt-5 border border-blue-200 bg-blue-50 rounded-lg p-4">
									<div className="text-sm font-medium text-blue-900">
										{preview.changes.length === 0
											? "Nothing needs to change in this range."
											: `${preview.shiftsChanged} shift(s) changed, ${preview.shiftsCreated} created · +${preview.nursesAdded} / −${preview.nursesRemoved} assignments`}
									</div>
									{preview.unfilledPositions > 0 && (
										<div className="mt-2 flex items-center gap-2 text-sm text-amber-800">
											<AlertTriangle className="h-4 w-4" />
											{preview.unfilledPositions} position(s) still cannot be filled with the current rules.
										</div>
									)}
									{preview.conflicts.length > 0 && (
										<div className="mt-1 text-sm text-amber-800">
											{preview.conflicts.length} conflict(s) would remain in the schedule.
										</div>
									)}
									{preview.changes.length > 0 && (
										<ul className="mt-3 max-h-48 overflow-y-auto space-y-1 text-sm">
											{preview.changes.map((change, i) => (
												<li key={`${change.date}-${change.type}-${i}`} className="bg-white rounded px-3 py-1.5">
													<span className="font-medium">
														{formatDate(change.date)} · {change.type}
														{change.newShift ? " (new shift)" : ""}
													</span>
													{change.added.length > 0 && (
														<span className="text-green-700"> + {change.added.map(nameOf).join(", ")}</span>
													)}
													{change.removed.length > 0 && (
														<span className="text-red-700"> − {change.removed.map(nameOf).join(", ")}</span>
													)}
												</li>
											))}
										</ul>
									)}
								</div>
							)}

							<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
								<button
									type="button"
									onClick={onClose}
									disabled={busy}
									className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={runPreview}
									disabled={busy || !fromDate || !toDate}
									className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
								>
									{busy && !preview ? "Working..." : "Preview changes"}
								</button>
								<button
									type="button"
									onClick={apply}
									disabled={busy || !preview || preview.changes.length === 0}
									className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
								>
									Apply changes
								</button>
							</div>
						</DialogPanel>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
};
