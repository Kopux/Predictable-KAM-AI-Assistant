/** Time-period presets counted back from the latest month present in the account's data. */
export const PRESETS = [
  { id: "last3", label: "Last 3M", months: 3 },
  { id: "last6", label: "Last 6M", months: 6 },
  { id: "ytd", label: "YTD", months: 0 },
  { id: "last12", label: "Last 12M", months: 12 },
] as const;

const shift = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 - n, 1));
  return d.toISOString().slice(0, 7);
};

/** Returns the inclusive month range for a period, or null for "all". */
export function periodRange(period: string, months: string[]): { from: string; to: string } | null {
  if (period === "all" || months.length === 0) return null;
  const sorted = [...months].sort();
  const last = sorted[sorted.length - 1]!;
  if (/^\d{4}$/.test(period)) return { from: `${period}-01`, to: `${period}-12` };
  if (period === "ytd") return { from: `${last.slice(0, 4)}-01`, to: last };
  const p = PRESETS.find((x) => x.id === period);
  return p ? { from: shift(last, p.months - 1), to: last } : null;
}

/** A preset is available only when the data covers its full length. */
export function presetAvailable(id: string, months: string[]) {
  if (id === "ytd") return months.length > 0;
  const p = PRESETS.find((x) => x.id === id);
  if (!p || months.length === 0) return false;
  const r = periodRange(id, months)!;
  return [...months].sort()[0]! <= r.from;
}

export function inPeriod(month: string, period: string, months: string[]) {
  const r = periodRange(period, months);
  return !r || (month >= r.from && month <= r.to);
}

export function periodLabel(period: string) {
  if (period === "all") return "All data";
  return PRESETS.find((p) => p.id === period)?.label ?? period;
}
