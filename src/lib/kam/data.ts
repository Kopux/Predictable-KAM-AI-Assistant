import pack from "@/data/pack.json";

export type Customer = {
  customer_id: string;
  customer_name: string;
  industry: string;
  segment: string;
  hq_country: string;
  priority_topics: string;
};
export type Site = {
  site_id: string;
  customer_id: string;
  site_name: string;
  country: string;
  city: string;
  site_type: string;
  primary_laundry_id: string;
};
export type Product = {
  product_id: string;
  product_name: string;
  product_group: string;
  avg_weight_kg: number;
  synthetic_product_footprint_kgco2e: number;
  synthetic_purchase_cost_eur: number;
};

/** One month × site × product line, aggregated from Service_Activity, Customer_Impacts, Repairs, Service_Cycles. */
export type Row = {
  id: number;
  month: string;
  site: string;
  product: string;
  laundry: string;
  wearers: number;
  allocated: number;
  washed: number;
  kg: number;
  requests: number;
  water: number;
  energy: number;
  co2: number;
  deliveryCo2: number;
  textileWaste: number;
  waterSaved: number;
  energySaved: number;
  co2Saved: number;
  repairs: number;
  postponed: number;
  avoidedCo2: number;
  cycles: number;
  cycleHours: number;
  onTime: number;
};

const cols = pack.cols as string[];
export const rows: Row[] = (pack.rows as (string | number)[][]).map((r, id) => {
  const o: Record<string, string | number> = { id };
  cols.forEach((c, i) => (o[c] = r[i]));
  return o as unknown as Row;
});

export const customers = pack.customers as Customer[];
export const sites = pack.sites as Site[];
export const products = pack.products as Product[];
export const laundries = pack.laundries as { laundry_id: string; laundry_name: string; country: string }[];
export const repairTypes = pack.repairTypes as [string, string, number][];
export const waste = pack.waste as {
  laundry_id: string;
  recycling_kg: number;
  reuse_kg: number;
  energy_recovery_kg: number;
  incineration_kg: number;
  textile_waste_total_kg: number;
}[];
export const industryPriorities = pack.industryPriorities as {
  industry: string;
  priority_rank: number;
  priority_theme: string;
  dashboard_emphasis: string;
}[];

export const siteById = Object.fromEntries(sites.map((s) => [s.site_id, s]));
export const productById = Object.fromEntries(products.map((p) => [p.product_id, p]));
export const laundryById = Object.fromEntries(laundries.map((l) => [l.laundry_id, l]));
export const months = Array.from(new Set(rows.map((r) => r.month))).sort();
