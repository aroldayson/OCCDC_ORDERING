export type WeekOffset = 0 | 1;

export type WeekInfo = {
  offset: WeekOffset;
  dateRange: string;
  weekLabel: string;
};

/** A fixed calendar week within the June–August ordering period. */
export type FixedWeekInfo = {
  /** 1-based week number within the period (1–8). */
  periodWeek: number;
  dateRange: string;
  weekLabel: string;
};

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getWeekInfo(offset: WeekOffset): WeekInfo {
  const monday = addDays(startOfWeekMonday(new Date()), offset * 7);
  const friday = addDays(monday, 4);

  const dateRange =
    monday.getMonth() === friday.getMonth()
      ? `${formatMonthDay(monday)} – ${friday.getDate()}, ${friday.getFullYear()}`
      : `${formatMonthDay(monday)} – ${formatMonthDay(friday)}, ${friday.getFullYear()}`;

  const startLabel = formatMonthDay(monday);
  const endLabel =
    monday.getMonth() === friday.getMonth()
      ? `${friday.getDate()}`
      : formatMonthDay(friday);
  const weekLabelCompact = `${startLabel}-${endLabel}, ${friday.getFullYear()}`;
  const weekNumber = getWeekNumber(monday);

  return {
    offset,
    dateRange,
    weekLabel: `WEEK ${weekNumber} — ${weekLabelCompact}`,
  };
}

export function getWeekOptions(): WeekInfo[] {
  return [getWeekInfo(0), getWeekInfo(1)];
}

// ─── June–August Fixed Weeks ─────────────────────────────────────────────────
//
// The ordering period covers 8 Mon–Fri weeks starting June 2, 2026.
// Dates are fixed to the current school-year period (2026) and can be
// updated each year by changing PERIOD_START_MONDAY.

const PERIOD_START_MONDAY = new Date(2026, 5, 24); // June 2, 2026 (month is 0-indexed)

function buildFixedWeek(periodWeek: number): FixedWeekInfo {
  const monday = addDays(PERIOD_START_MONDAY, (periodWeek - 1) * 7);
  const friday = addDays(monday, 6);

  const dateRange =
    monday.getMonth() === friday.getMonth()
      ? `${formatMonthDay(monday)} – ${friday.getDate()}, ${friday.getFullYear()}`
      : `${formatMonthDay(monday)} – ${formatMonthDay(friday)}, ${friday.getFullYear()}`;

  const startLabel = formatMonthDay(monday);
  const endLabel =
    monday.getMonth() === friday.getMonth()
      ? `${friday.getDate()}`
      : formatMonthDay(friday);
  const weekLabelCompact = `${startLabel}-${endLabel}, ${friday.getFullYear()}`;

  return {
    periodWeek,
    dateRange,
    weekLabel: `WEEK ${periodWeek} — ${weekLabelCompact}`,
  };
}

/** Returns the 8 fixed Mon–Fri weeks for the June–August ordering period. */
export function getJuneAugustWeeks(): FixedWeekInfo[] {
  return Array.from({ length: 8 }, (_, i) => buildFixedWeek(i + 1));
}

/**
 * Returns the period-week number (1–8) that contains today's date,
 * or null if today is outside the period.
 */
export function getCurrentPeriodWeek(): number | null {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let w = 1; w <= 8; w++) {
    const monday = addDays(PERIOD_START_MONDAY, (w - 1) * 7);
    const friday = addDays(monday, 4);
    if (today >= monday && today <= friday) return w;
  }
  return null;
}

/**
 * Returns the period-week number that is current or next upcoming.
 * - If today is within a Mon–Fri week, returns that week.
 * - If today is a weekend (Sat/Sun), returns the following week.
 * - If today is before the period starts, returns 1.
 * - If today is after the period ends, returns null.
 */
export function getCurrentOrNextPeriodWeek(): number | null {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let w = 1; w <= 8; w++) {
    const monday = addDays(PERIOD_START_MONDAY, (w - 1) * 7);
    const friday = addDays(monday, 4);
    const sunday = addDays(monday, 6); // end of the same calendar week

    // Today falls anywhere within Mon–Sun of this week's range
    if (today >= monday && today <= sunday) return w;

    // Today is before this week's Monday — this week is the next upcoming
    if (today < monday) return w;
  }

  // Today is after the last week's Sunday — period is over
  return null;
}
