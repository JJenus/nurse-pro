/**
 * Formats a date as yyyy-MM-dd using the *local* calendar date.
 *
 * Do not send `Date` objects to the API as-is: JSON turns them into UTC timestamps, so a local
 * midnight in Nigeria (UTC+1) becomes the previous day on the server.
 */
export const toIsoDate = (value: Date | string): string => {
	if (typeof value === "string") {
		return value.slice(0, 10);
	}
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};
