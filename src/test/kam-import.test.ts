import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
import { parseWorkbook } from "@/lib/kam/importWorkbook";
import { mergeDataset, sampleDataset } from "@/lib/kam/data";
import { customerRows, monthlyTrend, totals } from "@/lib/kam/metrics";

function workbook(year = "2026", newCompany = false) {
  const w = XLSX.read(readFileSync("/tmp/reference-pack.xlsx"), { type: "buffer", cellDates: true });
  for (const name of ["Service_Activity", "Customer_Impacts", "Repairs", "Service_Cycles", "Waste_Circularity", "Customers", "Sites"]) {
    const sheet = w.Sheets[name];
    if (!sheet) continue;
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    for (const r of records) {
      if (r.month) r.month = String(r.month).replace("2025", year);
      if (r.pickup_timestamp instanceof Date) r.pickup_timestamp.setUTCFullYear(Number(year));
      if (newCompany) {
        if (r.customer_id) r.customer_id = `NEW-${r.customer_id}`;
        if (r.customer_name) r.customer_name = `Imported ${r.customer_name}`;
        if (r.site_id) r.site_id = `NEW-${r.site_id}`;
      }
    }
    w.Sheets[name] = XLSX.utils.json_to_sheet(records);
  }
  return w;
}
const buffer = (w: XLSX.WorkBook) => XLSX.write(w, { type: "array", bookType: "xlsx" });

describe("private Excel import", () => {
  it("requires the reference worksheets and validates columns", () => {
    const w = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(w, XLSX.utils.aoa_to_sheet([["month"], ["2026-01"]]), "Service_Activity");
    const result = parseWorkbook(buffer(w), sampleDataset);
    expect(result.errors).toContain("Missing worksheet: Customers.");
    expect(result.errors).toContain("Service_Activity: missing column allocated_pieces.");
  });
  it("merges a new year and repeated imports without double counting or mutating source", () => {
    const result = parseWorkbook(buffer(workbook()), sampleDataset);
    expect(result.errors).toEqual([]);
    expect(result.years).toEqual(["2026"]);
    const merged = mergeDataset(sampleDataset, result.data);
    expect(merged.rows.length).toBe(sampleDataset.rows.length * 2);
    expect(mergeDataset(merged, result.data).rows.length).toBe(merged.rows.length);
    const rows = customerRows("CUST001", new Set(), merged, "2026");
    expect(totals(rows, merged).washed).toBe(totals(customerRows("CUST001", new Set()), sampleDataset).washed);
    expect(monthlyTrend(rows, merged)[0].label).toBe("Jan 2026");
    expect(sampleDataset.rows.every((r) => r.month.startsWith("2025"))).toBe(true);
  });
  it("imports new companies into the same account metrics", () => {
    const result = parseWorkbook(buffer(workbook("2026", true)), sampleDataset);
    expect(result.errors).toEqual([]);
    const merged = mergeDataset(sampleDataset, result.data);
    expect(merged.customers.length).toBe(6);
    const rows = customerRows("NEW-CUST001", new Set(), merged, "2026");
    expect(rows.length).toBeGreaterThan(0);
    expect(totals(rows, merged).costAvoided).toBeGreaterThan(0);
    expect(totals(rows, merged).recycledKg).toBeGreaterThan(0);
  });
  it("blocks invalid numbers and broken site references", () => {
    const w = workbook();
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(w.Sheets.Service_Activity);
    records[0].allocated_pieces = -1;
    records[0].site_id = "missing";
    w.Sheets.Service_Activity = XLSX.utils.json_to_sheet(records);
    const result = parseWorkbook(buffer(w), sampleDataset);
    expect(result.errors).toContain("Service_Activity, row 2: allocated_pieces must be a valid non-negative number.");
    expect(result.errors).toContain("Service_Activity, row 2: site/customer reference does not match.");
  });
});