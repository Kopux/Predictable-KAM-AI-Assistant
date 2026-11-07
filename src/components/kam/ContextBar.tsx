import { useMemo } from "react";
import { Building2, CalendarRange } from "lucide-react";
import { ExcelImport } from "./ExcelImport";
import { AskDataButton } from "./AskData";
import { useKam } from "@/lib/kam/store";
import { PRESETS, presetAvailable } from "@/lib/kam/period";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ContextBar() {
  const { customer, setCustomer, data, year, years, setYear } = useKam();
  const info = useMemo(() => {
    const sites = data.sites.filter((s) => s.customer_id === customer.customer_id);
    const ids = new Set(sites.map((s) => s.site_id));
    const own = data.rows.filter((r) => ids.has(r.site));
    const months = [...new Set(own.map((r) => r.month))].sort();
    const last = months.at(-1);
    const perSite = new Map<string, number>();
    own.filter((r) => r.month === last).forEach((r) => perSite.set(r.site, Math.max(perSite.get(r.site) ?? 0, r.wearers)));
    return { sites: sites.length, months, wearers: [...perSite.values()].reduce((a, b) => a + b, 0) };
  }, [customer, data]);

  const chip = (active: boolean, disabled = false) =>
    cn(
      "rounded-full px-3 py-1.5 text-sm font-medium transition whitespace-nowrap",
      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted",
      disabled && "pointer-events-none opacity-40",
    );

  return (
    <div className="border-t bg-card/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Building2 className="hidden h-6 w-6 text-primary sm:block" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer account</p>
            <Select value={customer.customer_id} onValueChange={setCustomer}>
              <SelectTrigger className="h-auto w-[min(300px,80vw)] border-0 bg-transparent p-0 font-display text-xl font-bold shadow-none focus:ring-0" aria-label="Customer account">
                <SelectValue>{customer.customer_name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {data.customers.map((c) => (
                  <SelectItem key={c.customer_id} value={c.customer_id}>{c.customer_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {customer.industry} · {info.sites} sites · {info.wearers.toLocaleString()} wearers
            </p>
          </div>
          <ExcelImport />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          <div role="radiogroup" aria-label="Period" className="flex flex-wrap rounded-full border bg-card p-1">
            {PRESETS.map((p) => {
              const ok = presetAvailable(p.id, info.months);
              return (
                <button key={p.id} role="radio" aria-checked={year === p.id} disabled={!ok} title={ok ? undefined : "Not enough data for this period"} onClick={() => setYear(p.id)} className={chip(year === p.id, !ok)}>
                  {p.label}
                </button>
              );
            })}
            {years.map((y) => (
              <button key={y} role="radio" aria-checked={year === y} onClick={() => setYear(y)} className={chip(year === y)}>{y}</button>
            ))}
            <button role="radio" aria-checked={year === "all"} onClick={() => setYear("all")} className={chip(year === "all")}>All</button>
          </div>
        </div>

        <div className="lg:ml-auto">
          <AskDataButton />
        </div>
      </div>
    </div>
  );
}
