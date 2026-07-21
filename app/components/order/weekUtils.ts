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
// The ordering period covers 8 Mon–Fri weeks starting June 29, 2026.
// Dates are fixed to the current school-year period (2026) and can be
// updated each year by changing PERIOD_START_MONDAY.

const PERIOD_START_MONDAY = new Date(2026, 5, 29); // June 29, 2026 (Monday)
const PERIOD_WEEK_COUNT = 8;

/** Value for week selectors that show orders/items across every week. */
export const ALL_WEEKS_VALUE = "all";

function buildFixedWeek(periodWeek: number): FixedWeekInfo {
  const monday = addDays(PERIOD_START_MONDAY, (periodWeek - 1) * 7);
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

  return {
    periodWeek,
    dateRange,
    weekLabel: `WEEK ${periodWeek} — ${weekLabelCompact}`,
  };
}

/** Returns the 8 fixed Mon–Fri weeks for the June–August ordering period. */
export function getJuneAugustWeeks(): FixedWeekInfo[] {
  return Array.from({ length: PERIOD_WEEK_COUNT }, (_, i) => buildFixedWeek(i + 1));
}

/** True when a label belongs to one of the 8 period weeks (WEEK 1–8). */
export function isOrderInPeriodWeek(weekLabel: string): boolean {
  return getPeriodWeekFromLabel(weekLabel) !== null;
}

/** True when a filter week label matches an order's resolved period week. */
export function orderMatchesWeekFilter(
  order: OrderWeekSource,
  weekLabel: string,
): boolean {
  const filterWeek = getPeriodWeekFromLabel(weekLabel);
  if (filterWeek === null) return order.weekLabel === weekLabel;
  return resolveOrderPeriodWeek(order) === filterWeek;
}

/** Extract period week number (1–8) from a week label, or null if not recognized. */
export function getPeriodWeekFromLabel(weekLabel: string): number | null {
  const match = weekLabel.match(/^WEEK\s+(\d+)/i);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return n >= 1 && n <= 8 ? n : null;
}

/** Canonical week label for a period week number. */
export function getWeekLabelForPeriodWeek(periodWeek: number): string | null {
  return getJuneAugustWeeks().find((w) => w.periodWeek === periodWeek)?.weekLabel ?? null;
}

/** Period week (1–8) that contains the given calendar date, or null if outside the period. */
export function getPeriodWeekForDate(date: Date): number | null {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  for (let w = 1; w <= PERIOD_WEEK_COUNT; w++) {
    const monday = addDays(PERIOD_START_MONDAY, (w - 1) * 7);
    const friday = addDays(monday, 4);
    if (d >= monday && d <= friday) return w;
  }
  return null;
}

type OrderWeekSource = {
  weekLabel: string;
  createdAt: string;
  deliveryDate?: string;
};

/** Resolve which period week an order belongs to using delivery date, then order date, then label. */
export function resolveOrderPeriodWeek(order: OrderWeekSource): number | null {
  if (order.deliveryDate) {
    const fromDelivery = getPeriodWeekForDate(
      new Date(`${order.deliveryDate}T12:00:00`),
    );
    if (fromDelivery !== null) return fromDelivery;
  }

  if (order.createdAt) {
    const fromCreated = getPeriodWeekForDate(new Date(order.createdAt));
    if (fromCreated !== null) return fromCreated;
  }

  return getPeriodWeekFromLabel(order.weekLabel);
}

/** Display/filter label aligned with the current week schedule (not legacy stored strings). */
export function getCanonicalWeekLabelForOrder(order: OrderWeekSource): string {
  const periodWeek = resolveOrderPeriodWeek(order);
  if (periodWeek !== null) {
    return getWeekLabelForPeriodWeek(periodWeek) ?? order.weekLabel;
  }
  return order.weekLabel;
}

/** True when an order falls within the 8-week June–August period. */
export function isOrderInPeriod(order: OrderWeekSource): boolean {
  return resolveOrderPeriodWeek(order) !== null;
}

/** True when two labels refer to the same period week (supports legacy date strings). */
export function weekLabelsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const weekA = getPeriodWeekFromLabel(a);
  const weekB = getPeriodWeekFromLabel(b);
  return weekA !== null && weekB !== null && weekA === weekB;
}

/**
 * Returns the period-week number (1–8) that contains today's date,
 * or null if today is outside the period.
 */
export function getCurrentPeriodWeek(): number | null {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let w = 1; w <= PERIOD_WEEK_COUNT; w++) {
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

  for (let w = 1; w <= PERIOD_WEEK_COUNT; w++) {
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

// ─── Delivery Date Utilities ─────────────────────────────────────────────────

/**
 * Given a weekLabel (e.g. "WEEK 4 — June 23-27, 2026"), returns the default Wednesday
 * delivery date for that week using the fixed period schedule.
 * Since the week starts on Wednesday (June 24, 2026), the delivery date
 * defaults to the Wednesday of the following week (next Wednesday).
 */
export function getFridayFromWeekLabel(weekLabel: string, createdAt?: string | Date): Date | null {
  const weeks = getJuneAugustWeeks();
  const periodWeek = getPeriodWeekFromLabel(weekLabel);
  const match =
    periodWeek !== null
      ? weeks.find((w) => w.periodWeek === periodWeek)
      : weeks.find((w) => w.weekLabel === weekLabel);
  if (match) {
    const monday = addDays(PERIOD_START_MONDAY, (match.periodWeek - 1) * 7);
    
    // Check if the order was placed on Thursday in Philippine time (UTC+8)
    const orderDate = createdAt ? new Date(createdAt) : new Date();
    const phDayStr = orderDate.toLocaleDateString("en-US", {
      timeZone: "Asia/Manila",
      weekday: "short"
    });
    const isWednesday = phDayStr === "Wed";
    const isThursday = phDayStr === "Thu";

    if (isWednesday || isThursday) {
      return addDays(monday, 2); // Friday of the same week (this Friday)
    }
    return addDays(monday, 7); // Wednesday of the following week (next Wednesday)
  }
  return null;
}

/**
 * Formats a delivery (Friday) Date into a human-readable string.
 */
export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a Date to an ISO date string (YYYY-MM-DD) for HTML date inputs.
 */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a list of delivery date options (Wednesday and Friday of the following week)
 * for a given weekLabel.
 */
export function getDeliveryDateOptions(weekLabel: string): { value: string; label: string }[] {
  const weeks = getJuneAugustWeeks();
  const periodWeek = getPeriodWeekFromLabel(weekLabel);
  const match =
    periodWeek !== null
      ? weeks.find((w) => w.periodWeek === periodWeek)
      : weeks.find((w) => w.weekLabel === weekLabel);
  if (match) {
    const monday = addDays(PERIOD_START_MONDAY, (match.periodWeek - 1) * 7);
    const wednesday = addDays(monday, 7); // next Wednesday
    const friday = addDays(monday, 9); // next Friday
    return [
      {
        value: toDateInputValue(wednesday),
        label: formatDeliveryDate(wednesday),
      },
      {
        value: toDateInputValue(friday),
        label: formatDeliveryDate(friday),
      },
    ];
  }
  return [];
}
