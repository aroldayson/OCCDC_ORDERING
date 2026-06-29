export type WeekOffset = 0 | 1;

export type WeekInfo = {
  offset: WeekOffset;
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
