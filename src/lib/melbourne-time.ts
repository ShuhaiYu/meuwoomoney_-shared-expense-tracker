const MELBOURNE_TZ = "Australia/Melbourne";

const formatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: MELBOURNE_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Extract { year, month, day } numbers in Melbourne timezone. */
export function getMelbourneParts(date: Date = new Date()) {
  const parts = formatter.formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === "year")!.value),
    month: Number(parts.find((p) => p.type === "month")!.value),
    day: Number(parts.find((p) => p.type === "day")!.value),
  };
}

/** "YYYY-MM-DD" for Melbourne's today. */
export function melbourneToday(): string {
  const { year, month, day } = getMelbourneParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "YYYY-MM" for Melbourne's current month. */
export function melbourneYearMonth(): string {
  const { year, month } = getMelbourneParts();
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** A Date object representing Melbourne's today at midnight (local). */
export function melbourneTodayDate(): Date {
  const { year, month, day } = getMelbourneParts();
  return new Date(year, month - 1, day);
}

/** Day-of-month number in Melbourne timezone. */
export function melbourneDayOfMonth(): number {
  return getMelbourneParts().day;
}

/** Last day of the current Melbourne month. */
export function melbourneLastDayOfMonth(): number {
  const { year, month } = getMelbourneParts();
  return new Date(year, month, 0).getDate();
}

/** "YYYY-MM-DD" for n days ago in Melbourne timezone. */
export function melbourneDaysAgo(n: number): string {
  const now = new Date();
  const adjusted = new Date(now.getTime() - n * 86_400_000);
  const { year, month, day } = getMelbourneParts(adjusted);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "YYYY-MM" for the previous month in Melbourne timezone. */
export function melbournePrevYearMonth(): string {
  const { year, month } = getMelbourneParts();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
}

/** Last day of a given "YYYY-MM" month. */
export function lastDayOfMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
