import * as XLSX from "xlsx";
import { rowKey, type Dataset, type Row } from "./data";

type RecordRow = Record<string, unknown>;
export type ImportPreview = {
  data: Dataset;
  sheets: { name: string; count: number; columns: string[]; preview: RecordRow[] }[];
  errors: string[];
  warnings: string[];
  years: string[];
  duplicates: number;
};

const schema: Record<string, string[]> = {
  Customers: ["customer_id", "customer_name", "industry", "segment", "hq_country", "priority_topics"],
  Sites: ["site_id", "customer_id", "site_name", "country", "city", "site_type", "primary_laundry_id"],
  Products: ["product_id", "product_name", "product_group", "avg_weight_kg", "synthetic_product_footprint_kgco2e", "synthetic_purchase_cost_eur"],
  Service_Activity: ["month", "customer_id", "site_id", "laundry_id", "product_id", "active_wearers", "allocated_pieces", "washed_pieces", "customer_washed_kg", "service_requests"],
  Customer_Impacts: ["month", "customer_id", "site_id", "laundry_id", "product_id", "allocated_water_l", "allocated_energy_kwh", "allocated_process_kgco2e", "allocated_delivery_kgco2e", "allocated_textile_waste_kg", "water_saving_vs_local_l", "energy_saving_vs_local_kwh", "emissions_saving_vs_local_kgco2e"],
  Repairs: ["month", "customer_id", "site_id", "product_id", "laundry_id", "repair_type", "repair_count", "estimated_replacements_postponed", "estimated_avoided_product_kgco2e"],
  Service_Cycles: ["customer_id", "site_id", "product_id", "laundry_id", "pickup_timestamp", "cycle_hours", "performance_flag"],
  Laundries: ["laundry_id", "laundry_name", "country"],
  Waste_Circularity: ["month", "laundry_id", "recycling_kg", "reuse_kg", "energy_recovery_kg", "incineration_kg", "textile_waste_total_kg"],
  Industry_Priorities: ["industry", "priority_rank", "priority_theme", "dashboard_emphasis"],
};
const required = ["Customers", "Sites", "Products", "Service_Activity", "Customer_Impacts", "Repairs"];
const numeric = new Set(["avg_weight_kg", "synthetic_product_footprint_kgco2e", "synthetic_purchase_cost_eur", "active_wearers", "allocated_pieces", "washed_pieces", "customer_washed_kg", "service_requests", "allocated_water_l", "allocated_energy_kwh", "allocated_process_kgco2e", "allocated_delivery_kgco2e", "allocated_textile_waste_kg", "water_saving_vs_local_l", "energy_saving_vs_local_kwh", "emissions_saving_vs_local_kgco2e", "repair_count", "estimated_replacements_postponed", "estimated_avoided_product_kgco2e", "cycle_hours", "recycling_kg", "reuse_kg", "energy_recovery_kg", "incineration_kg", "textile_waste_total_kg", "priority_rank"]);
const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => Number(v);

export function excelMonth(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return date ? `${date.y}-${String(date.m).padStart(2, "0")}` : null;
  }
  const match = text(value).match(/^(\d{4})-(\d{2})(?:$|[-T ])/);
  return match && Number(match[2]) >= 1 && Number(match[2]) <= 12 ? `${match[1]}-${match[2]}` : null;
}

/** Pure local parsing: no fetch, uploads or remote services. */
export function parseWorkbook(buffer: ArrayBuffer, existing: Dataset): ImportPreview {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const errors: string[] = [];
  const warnings: string[] = [];
  const tables: Record<string, RecordRow[]> = {};
  const sheets: ImportPreview["sheets"] = [];
  for (const name of required) if (!workbook.Sheets[name]) errors.push(`Missing worksheet: ${name}.`);
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
    const columns = (matrix[0] ?? []).map(text);
    const records = XLSX.utils.sheet_to_json<RecordRow>(sheet, { defval: "" });
    tables[name] = records;
    sheets.push({ name, count: records.length, columns, preview: records.slice(0, 25) });
    const fields = schema[name];
    if (!fields) continue;
    if (new Set(columns).size !== columns.length) errors.push(`${name}: duplicate column headings.`);
    for (const field of fields) if (!columns.includes(field)) errors.push(`${name}: missing column ${field}.`);
    records.forEach((record, i) => {
      for (const field of fields) {
        const v = record[field];
        if (text(v) === "" && !["priority_topics", "segment", "hq_country", "country", "city", "dashboard_emphasis"].includes(field)) errors.push(`${name}, row ${i + 2}: ${field} is empty.`);
        else if (numeric.has(field) && (!Number.isFinite(num(v)) || (num(v) < 0 && !field.includes("saving")))) errors.push(`${name}, row ${i + 2}: ${field} must be a valid ${field.includes("saving") ? "number" : "non-negative number"}.`);
      }
      const date = name === "Service_Cycles" ? "pickup_timestamp" : "month";
      if (fields.includes(date)) {
        const month = excelMonth(record[date]);
        if (!month) errors.push(`${name}, row ${i + 2}: invalid ${date}; use an Excel date or YYYY-MM.`);
        else record["month"] = month;
      }
    });
  }
  const get = (name: string) => tables[name] ?? [];
  const unique = (name: string, field: string) => {
    const seen = new Set<string>();
    get(name).forEach((r, i) => { const id = text(r[field]); if (seen.has(id)) errors.push(`${name}, row ${i + 2}: duplicate ${field} ${id}.`); seen.add(id); });
  };
  unique("Customers", "customer_id"); unique("Sites", "site_id"); unique("Products", "product_id");
  const customers = get("Customers").map((r) => ({ customer_id: text(r["customer_id"]), customer_name: text(r["customer_name"]), industry: text(r["industry"]), segment: text(r["segment"]), hq_country: text(r["hq_country"]), priority_topics: text(r["priority_topics"]) }));
  const sites = get("Sites").map((r) => ({ site_id: text(r["site_id"]), customer_id: text(r["customer_id"]), site_name: text(r["site_name"]), country: text(r["country"]), city: text(r["city"]), site_type: text(r["site_type"]), primary_laundry_id: text(r["primary_laundry_id"]) }));
  const products = get("Products").map((r) => ({ product_id: text(r["product_id"]), product_name: text(r["product_name"]), product_group: text(r["product_group"]), avg_weight_kg: num(r["avg_weight_kg"]), synthetic_product_footprint_kgco2e: num(r["synthetic_product_footprint_kgco2e"]), synthetic_purchase_cost_eur: num(r["synthetic_purchase_cost_eur"]) }));
  const customerIds = new Set([...existing.customers, ...customers].map((r) => r["customer_id"]));
  const siteMap = new Map([...existing.sites, ...sites].map((r) => [r["site_id"], r]));
  const productIds = new Set([...existing.products, ...products].map((r) => r["product_id"]));
  sites.forEach((s) => { if (!customerIds.has(s.customer_id)) errors.push(`Sites: ${s.site_id} references unknown customer ${s.customer_id}.`); const old = existing.sites.find((v) => v.site_id === s.site_id); if (old && old.customer_id !== s.customer_id) errors.push(`Site ID ${s.site_id} already belongs to another company. Use unique IDs for new companies.`); });
  customers.forEach((c) => { const old = existing.customers.find((v) => v.customer_id === c.customer_id); if (old && old.customer_name !== c.customer_name) errors.push(`Customer ID ${c.customer_id} already belongs to ${old.customer_name}. Use a unique ID for ${c.customer_name}.`); });
  products.forEach((p) => { const old = existing.products.find((v) => v.product_id === p.product_id); if (old && JSON.stringify(old) !== JSON.stringify(p)) warnings.push(`Product ${p.product_id} already exists; existing product details and cost will be kept.`); });
  for (const name of ["Service_Activity", "Customer_Impacts", "Repairs", "Service_Cycles"]) get(name).forEach((r, i) => {
    const site = siteMap.get(text(r["site_id"]));
    if (!site || site.customer_id !== text(r["customer_id"])) errors.push(`${name}, row ${i + 2}: site/customer reference does not match.`);
    if (!productIds.has(text(r["product_id"]))) errors.push(`${name}, row ${i + 2}: unknown product ${text(r["product_id"])}.`);
  });
  const empty = (r: RecordRow): Row => ({ id: 0, month: text(r["month"]), site: text(r["site_id"]), product: text(r["product_id"]), laundry: text(r["laundry_id"]), wearers: 0, allocated: 0, washed: 0, kg: 0, requests: 0, water: 0, energy: 0, co2: 0, deliveryCo2: 0, textileWaste: 0, waterSaved: 0, energySaved: 0, co2Saved: 0, repairs: 0, postponed: 0, avoidedCo2: 0, cycles: 0, cycleHours: 0, onTime: 0 });
  const map = new Map<string, Row>();
  const activityKeys = new Set<string>();
  get("Service_Activity").forEach((r, i) => {
    const row = empty(r); const key = rowKey(row);
    if (activityKeys.has(key)) { errors.push(`Service_Activity, row ${i + 2}: duplicate month/site/product line.`); return; }
    activityKeys.add(key);
    Object.assign(row, { wearers: num(r["active_wearers"]), allocated: num(r["allocated_pieces"]), washed: num(r["washed_pieces"]), kg: num(r["customer_washed_kg"]), requests: num(r["service_requests"]) });
    if (!row.allocated || row.washed / Math.max(row.allocated, 1) / (52 / 12) > 1) warnings.push(`Service_Activity, row ${i + 2}: ${!row.allocated ? "no garments allocated" : "weekly utilisation exceeds 100%"}. Review in Account Pulse.`);
    map.set(key, row);
  });
  const impactKeys = new Set<string>();
  const apply = (name: string, fields: Record<string, keyof Row>) => get(name).forEach((r, i) => {
    const key = rowKey(empty(r)); const row = map.get(key);
    if (!row || row.laundry !== text(r["laundry_id"])) { errors.push(`${name}, row ${i + 2}: no matching service activity line.`); return; }
    if (name === "Customer_Impacts") { if (impactKeys.has(key)) errors.push(`${name}, row ${i + 2}: duplicate impact line.`); impactKeys.add(key); }
    for (const [from, to] of Object.entries(fields)) (row[to] as number) += num(r[from]);
  });
  apply("Customer_Impacts", { allocated_water_l: "water", allocated_energy_kwh: "energy", allocated_process_kgco2e: "co2", allocated_delivery_kgco2e: "deliveryCo2", allocated_textile_waste_kg: "textileWaste", water_saving_vs_local_l: "waterSaved", energy_saving_vs_local_kwh: "energySaved", emissions_saving_vs_local_kgco2e: "co2Saved" });
  apply("Repairs", { repair_count: "repairs", estimated_replacements_postponed: "postponed", estimated_avoided_product_kgco2e: "avoidedCo2" });
  for (const key of activityKeys) if (!impactKeys.has(key)) errors.push(`Customer_Impacts: missing impact data for ${key}.`);
  get("Service_Cycles").forEach((r, i) => { const row = map.get(rowKey(empty(r))); if (!row) { errors.push(`Service_Cycles, row ${i + 2}: no matching activity month/site/product.`); return; } row.cycles++; row.cycleHours += num(r["cycle_hours"]); if (text(r["performance_flag"]) === "ON_TIME") row.onTime++; });
  if (!workbook.Sheets["Service_Cycles"]) warnings.push("No Service_Cycles worksheet: on-time service and turnaround slides will be omitted.");
  const wasteMap = new Map<string, Dataset["waste"][number]>();
  get("Waste_Circularity").forEach((r) => { const id = text(r["laundry_id"]); const w = wasteMap.get(id) ?? { laundry_id: id, recycling_kg: 0, reuse_kg: 0, energy_recovery_kg: 0, incineration_kg: 0, textile_waste_total_kg: 0 }; for (const k of ["recycling_kg", "reuse_kg", "energy_recovery_kg", "incineration_kg", "textile_waste_total_kg"] as const) w[k] += num(r[k]); wasteMap.set(id, w); });
  if (!workbook.Sheets["Waste_Circularity"]) warnings.push("No Waste_Circularity worksheet: recycling claims will be omitted for imported rows.");
  const resultRows = [...map.values()].map((r, id) => {
    const w = get("Waste_Circularity").find((w) => text(w["month"]) === r["month"] && text(w["laundry_id"]) === r["laundry"]);
    return { ...r, id, recycledKg: w && num(w["textile_waste_total_kg"]) > 0 ? r["textile"]Waste * (num(w["recycling_kg"]) + num(w["reuse_kg"])) / num(w["textile_waste_total_kg"]) : undefined };
  });
  if (!resultRows.length) errors.push("Service_Activity contains no data rows.");
  const oldKeys = new Set(existing.rows.map(rowKey));
  return {
    data: { rows: resultRows, customers, sites, products, laundries: get("Laundries").map((r) => ({ laundry_id: text(r["laundry_id"]), laundry_name: text(r["laundry_name"]), country: text(r["country"]) })), repairTypes: [], waste: [...wasteMap.values()], industryPriorities: get("Industry_Priorities").map((r) => ({ industry: text(r["industry"]), priority_rank: num(r["priority_rank"]), priority_theme: text(r["priority_theme"]), dashboard_emphasis: text(r["dashboard_emphasis"]) })) },
    sheets, errors: [...new Set(errors)], warnings: [...new Set(warnings)], years: [...new Set(resultRows.map((r) => r["month"].slice(0, 4)))].sort(), duplicates: resultRows.filter((r) => oldKeys.has(rowKey(r))).length,
  };
}