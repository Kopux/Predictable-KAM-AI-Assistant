import {
  customers,
  laundryById,
  months,
  productById,
  rows as allRows,
  siteById,
  waste,
  type Row,
} from "./data";

export const WEEKS_PER_MONTH = 52 / 12;

/** Default healthy utilisation band (weekly washes ÷ allocated garments). */
export const DEFAULT_BAND = { low: 30, high: 70 };
/** Food & hygiene-critical accounts change garments more often, so the band sits higher. */
export const HYGIENE_BAND = { low: 40, high: 80 };
export const HYGIENE_INDUSTRIES = ["Food & Beverage", "Healthcare"];

export type Band = { low: number; high: number };

export function defaultBandFor(industry: string): Band {
  return HYGIENE_INDUSTRIES.includes(industry) ? HYGIENE_BAND : DEFAULT_BAND;
}

export type Totals = {
  wearers: number; // latest month
  inCirculation: number; // latest month allocated pieces
  washed: number;
  allocatedMonths: number;
  kg: number;
  requests: number;
  repairs: number;
  postponed: number;
  co2: number;
  co2Saved: number;
  waterSaved: number;
  water: number;
  energySaved: number;
  avoidedCo2: number;
  textileWaste: number;
  recycledKg: number;
  cycles: number;
  onTime: number;
  cycleHours: number;
  costAvoided: number;
  utilisation: number; // %
  washesPerWearerWeek: number;
  repairRate: number; // repairs per 100 washes
  onTimePct: number;
  monthsCount: number;
};

const recyclingShare = Object.fromEntries(
  waste.map((w) => [w.laundry_id, (w.recycling_kg + w.reuse_kg) / w.textile_waste_total_kg]),
);

export function utilisation(washed: number, allocatedMonths: number) {
  return allocatedMonths > 0 ? (washed / (allocatedMonths * WEEKS_PER_MONTH)) * 100 : 0;
}

export function totals(rs: Row[]): Totals {
  const ms = Array.from(new Set(rs.map((r) => r.month))).sort();
  const last = ms[ms.length - 1];
  const t = {
    wearers: 0,
    inCirculation: 0,
    washed: 0,
    allocatedMonths: 0,
    kg: 0,
    requests: 0,
    repairs: 0,
    postponed: 0,
    co2: 0,
    co2Saved: 0,
    waterSaved: 0,
    water: 0,
    energySaved: 0,
    avoidedCo2: 0,
    textileWaste: 0,
    recycledKg: 0,
    cycles: 0,
    onTime: 0,
    cycleHours: 0,
    costAvoided: 0,
  };
  for (const r of rs) {
    if (r.month === last) t.inCirculation += r.allocated;
    t.washed += r.washed;
    t.allocatedMonths += r.allocated;
    t.kg += r.kg;
    t.requests += r.requests;
    t.repairs += r.repairs;
    t.postponed += r.postponed;
    t.co2 += r.co2 + r.deliveryCo2;
    t.co2Saved += r.co2Saved;
    t.waterSaved += r.waterSaved;
    t.water += r.water;
    t.energySaved += r.energySaved;
    t.avoidedCo2 += r.avoidedCo2;
    t.textileWaste += r.textileWaste;
    t.recycledKg += r.textileWaste * (recyclingShare[r.laundry] ?? 0);
    t.cycles += r.cycles;
    t.onTime += r.onTime;
    t.cycleHours += r.cycleHours;
    t.costAvoided += r.postponed * (productById[r.product]?.synthetic_purchase_cost_eur ?? 0);
  }
  // Wearers are listed per garment line; take the largest line per site-month to avoid double counting.
  const wm = new Map<string, number>();
  for (const r of rs) wm.set(r.month + r.site, Math.max(wm.get(r.month + r.site) ?? 0, r.wearers));
  let wearerMonths = 0;
  for (const [k, v] of wm) {
    wearerMonths += v;
    if (k.startsWith(last ?? "")) t.wearers += v;
  }
  return {
    ...t,
    utilisation: utilisation(t.washed, t.allocatedMonths),
    washesPerWearerWeek: wearerMonths ? t.washed / (wearerMonths * WEEKS_PER_MONTH) : 0,
    repairRate: t.washed ? (t.repairs / t.washed) * 100 : 0,
    onTimePct: t.cycles ? (t.onTime / t.cycles) * 100 : 0,
    monthsCount: ms.length,
  };
}

export function customerRows(customerId: string, excluded: Set<number>) {
  return allRows.filter((r) => siteById[r.site]?.customer_id === customerId && !excluded.has(r.id));
}

export function allCustomerRows(customerId: string) {
  return allRows.filter((r) => siteById[r.site]?.customer_id === customerId);
}

export const H1 = months.slice(0, 6);
export const H2 = months.slice(6);

export function pctChange(now: number, before: number) {
  return before ? ((now - before) / before) * 100 : 0;
}

export type SiteStat = Totals & { siteId: string; name: string; type: string; city: string; country: string };

export function siteStats(rs: Row[]): SiteStat[] {
  const by = new Map<string, Row[]>();
  for (const r of rs) by.set(r.site, [...(by.get(r.site) ?? []), r]);
  return [...by.entries()].map(([siteId, list]) => {
    const s = siteById[siteId]!;
    return { ...totals(list), siteId, name: s.site_name, type: s.site_type, city: s.city, country: s.country };
  });
}

export type Group = { key: string; label: string } & Totals;
export function groupBy(rs: Row[], keyFn: (r: Row) => string, labelFn: (k: string) => string = (k) => k): Group[] {
  const by = new Map<string, Row[]>();
  for (const r of rs) {
    const k = keyFn(r);
    by.set(k, [...(by.get(k) ?? []), r]);
  }
  return [...by.entries()].map(([key, list]) => ({ key, label: labelFn(key), ...totals(list) }));
}

export const productGroup = (r: Row) => productById[r.product]?.product_group ?? r.product;
export const laundryName = (id: string) => laundryById[id]?.laundry_name ?? id;

export type Outlier = {
  siteId: string;
  name: string;
  kind: "low-util" | "high-util" | "repair" | "late" | "trend";
  severity: "watch" | "act";
  headline: string;
  why: string;
};

/** Plain-language explanations for sites that stand out against the account average or the prior half-year. */
export function outliers(rs: Row[], band: Band): Outlier[] {
  const acct = totals(rs);
  const out: Outlier[] = [];
  for (const s of siteStats(rs)) {
    const siteRows = rs.filter((r) => r.site === s.siteId);
    const prodMix = groupBy(siteRows, productGroup).sort((a, b) => b.allocatedMonths - a.allocatedMonths)[0];
    const vsAvg = pctChange(s.utilisation, acct.utilisation);
    if (s.utilisation < band.low) {
      out.push({
        siteId: s.siteId,
        name: s.name,
        kind: "low-util",
        severity: s.utilisation < band.low - 8 ? "act" : "watch",
        headline: `${s.name}: only ${s.utilisation.toFixed(0)}% of garments washed each week`,
        why: `${Math.abs(vsAvg).toFixed(0)}% below the account average of ${acct.utilisation.toFixed(0)}%. Garments are sitting in lockers — mostly ${prodMix?.label ?? "garments"}. A right-sizing review could release ~${Math.round(s.inCirculation * (1 - s.utilisation / band.low))} pieces.`,
      });
    } else if (s.utilisation > band.high) {
      out.push({
        siteId: s.siteId,
        name: s.name,
        kind: "high-util",
        severity: s.utilisation > band.high + 8 ? "act" : "watch",
        headline: `${s.name}: garments washed ${s.utilisation.toFixed(0)}% per week — stock is tight`,
        why: `${vsAvg.toFixed(0)}% above the account average. Wearers may run short of clean garments; consider adding pieces to protect hygiene and availability.`,
      });
    }
    if (s.repairRate > acct.repairRate * 1.3 && s.repairs > 20) {
      out.push({
        siteId: s.siteId,
        name: s.name,
        kind: "repair",
        severity: s.repairRate > acct.repairRate * 1.6 ? "act" : "watch",
        headline: `${s.name}: repair rate ${pctChange(s.repairRate, acct.repairRate).toFixed(0)}% above average`,
        why: `${s.repairRate.toFixed(2)} repairs per 100 washes vs ${acct.repairRate.toFixed(2)} across the account. Often linked to heavier work at a ${s.type.toLowerCase()} — a garment-fit or product-choice conversation.`,
      });
    }
    if (s.cycles > 30 && s.onTimePct < acct.onTimePct - 5) {
      out.push({
        siteId: s.siteId,
        name: s.name,
        kind: "late",
        severity: "watch",
        headline: `${s.name}: ${s.onTimePct.toFixed(0)}% of laundry cycles on time`,
        why: `${(acct.onTimePct - s.onTimePct).toFixed(0)} points below the account's ${acct.onTimePct.toFixed(0)}%. Check pickup schedule with the site manager.`,
      });
    }
    const h1 = totals(siteRows.filter((r) => H1.includes(r.month)));
    const h2 = totals(siteRows.filter((r) => H2.includes(r.month)));
    const ch = pctChange(h2.utilisation, h1.utilisation);
    if (h1.allocatedMonths && h2.allocatedMonths && Math.abs(ch) > 15) {
      out.push({
        siteId: s.siteId,
        name: s.name,
        kind: "trend",
        severity: "watch",
        headline: `${s.name}: utilisation ${ch > 0 ? "up" : "down"} ${Math.abs(ch).toFixed(0)}% vs the first half-year`,
        why: `From ${h1.utilisation.toFixed(0)}% (Jan–Jun) to ${h2.utilisation.toFixed(0)}% (Jul–Dec). ${ch < 0 ? "Headcount or shift changes may have reduced demand." : "Demand is growing — make sure stock keeps up."}`,
      });
    }
  }
  const rank = { act: 0, watch: 1 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/** Rows a KAM may want to review/exclude: implausible lines that distort the picture. */
export function exceptionRows(rs: Row[], band: Band) {
  return rs
    .map((r) => {
      const u = utilisation(r.washed, r.allocated);
      const reasons: string[] = [];
      if (r.allocated === 0) reasons.push("No garments allocated");
      else if (u < band.low - 10) reasons.push(`Very low utilisation (${u.toFixed(0)}%)`);
      else if (u > band.high + 4) reasons.push(`Very high utilisation (${u.toFixed(0)}%)`);
      return { row: r, util: u, reasons };
    })
    .filter((x) => x.reasons.length);
}

export function monthlyTrend(rs: Row[]) {
  return months.map((m) => {
    const t = totals(rs.filter((r) => r.month === m));
    return {
      month: m.slice(5),
      label: new Date(m + "-01").toLocaleString("en", { month: "short" }),
      utilisation: +t.utilisation.toFixed(1),
      washed: t.washed,
      repairs: t.repairs,
      co2Saved: Math.round(t.co2Saved),
      waterSaved: Math.round(t.waterSaved / 1000),
    };
  });
}

export function findCustomer(id: string) {
  return customers.find((c) => c.customer_id === id) ?? customers[0]!;
}

export const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });
export const fmtK = (n: number) =>
  Math.abs(n) >= 1e6 ? `${fmt(n / 1e6, 1)}M` : Math.abs(n) >= 1e4 ? `${fmt(n / 1e3, 0)}k` : fmt(n);
