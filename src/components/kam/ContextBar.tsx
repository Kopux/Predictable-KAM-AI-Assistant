import { useMemo, useState } from "react";
import { Building2, CalendarRange, CalendarDays, Check, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { customPeriod, monthName, periodLabel, periodRange } from "@/lib/kam/period";
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

  const [pickOpen, setPickOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const isCustom = year.startsWith("custom:") || years.includes(year);
  const cur = periodRange(year, info.months);

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
            <Popover open={pickOpen} onOpenChange={setPickOpen}>
              <PopoverTrigger asChild>
                <button aria-label="Customer account" className="flex w-[min(300px,80vw)] items-center gap-2 text-left font-display text-xl font-bold">
                  <span className="truncate">{customer.customer_name}</span>
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(360px,90vw)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search company, industry or ID…" />
                  <CommandList>
                    <CommandEmpty>No company found.</CommandEmpty>
                    <CommandGroup heading={`${data.customers.length} companies`}>
                      {data.customers.map((c) => (
                        <CommandItem
                          key={c.customer_id}
                          value={`${c.customer_name} ${c.industry} ${c.customer_id}`}
                          onSelect={() => { setCustomer(c.customer_id); setPickOpen(false); }}
                        >
                          <Check className={cn("h-4 w-4", c.customer_id === customer.customer_id ? "opacity-100" : "opacity-0")} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.customer_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.industry}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
            <Popover open={rangeOpen} onOpenChange={(o) => { setRangeOpen(o); if (o) { setFrom(cur?.from ?? info.months[0] ?? ""); setTo(cur?.to ?? info.months.at(-1) ?? ""); } }}>
              <PopoverTrigger asChild>
                <button role="radio" aria-checked={isCustom} disabled={info.months.length === 0} className={cn(chip(isCustom, info.months.length === 0), "flex items-center gap-1")}>
                  <CalendarDays className="h-3.5 w-3.5" />
                  {isCustom ? periodLabel(year) : "Custom"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-3" align="start">
                <p className="font-display font-semibold">Choose months</p>
                {years.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {years.map((y) => (
                      <button key={y} onClick={() => { setYear(y); setRangeOpen(false); }} className={cn("rounded-full border px-2.5 py-1 text-xs", year === y && "border-primary bg-primary text-primary-foreground")}>{y}</button>
                    ))}
                  </div>
                )}
                {(["From", "To"] as const).map((lbl) => (
                  <label key={lbl} className="flex items-center justify-between gap-2 text-sm">
                    {lbl}
                    <Select value={lbl === "From" ? from : to} onValueChange={lbl === "From" ? setFrom : setTo}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {info.months.map((m) => <SelectItem key={m} value={m}>{monthName(m)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                ))}
                <Button className="w-full" disabled={!from || !to} onClick={() => { setYear(customPeriod(from, to)); setRangeOpen(false); }}>Apply</Button>
              </PopoverContent>
            </Popover>
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
