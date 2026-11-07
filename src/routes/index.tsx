import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, Droplets, Euro, Leaf, RotateCcw, Shirt, WashingMachine, Wrench, Eye, EyeOff } from "lucide-react";
import { useKam } from "@/lib/kam/store";
import {
  allCustomerRows,
  customerRows,
  defaultBandFor,
  exceptionRows,
  fmt,
  fmtK,
  H1,
  H2,
  outliers,
  pctChange,
  siteStats,
  totals,
} from "@/lib/kam/metrics";
import { productById, siteById } from "@/lib/kam/data";
import { BandBar, Kpi, Section } from "@/components/kam/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Account Pulse — KAM Meeting Assistant" },
      { name: "description", content: "Health check of a workwear rental account: garments, washing, repairs, cost and environmental impact." },
      { property: "og:title", content: "Account Pulse — KAM Meeting Assistant" },
      { property: "og:description", content: "Health check of a workwear rental account before the customer meeting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pulse,
});

function Pulse() {
  const { customer, band, setBand, excludedSet, toggleExcluded, clearExcluded } = useKam();
  const rs = useMemo(() => customerRows(customer.customer_id, excludedSet), [customer, excludedSet]);
  const all = useMemo(() => allCustomerRows(customer.customer_id), [customer]);
  const t = totals(rs);
  const h1 = totals(rs.filter((r) => H1.includes(r.month)));
  const h2 = totals(rs.filter((r) => H2.includes(r.month)));
  const sites = siteStats(rs).sort((a, b) => a.utilisation - b.utilisation);
  const outs = outliers(rs, band);
  const exceptions = exceptionRows(all, band);
  const excludedHere = all.filter((r) => excludedSet.has(r.id)).length;
  const def = defaultBandFor(customer.industry);
  const overridden = band.low !== def.low || band.high !== def.high;
  const [showAllEx, setShowAllEx] = useState(false);
  const inBand = t.utilisation >= band.low && t.utilisation <= band.high;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Step 1 · Account Pulse</p>
          <h1 className="text-4xl font-extrabold">{customer.customer_name}</h1>
          <p className="text-muted-foreground">
            {customer.industry} · {customer.segment} · {sites.length} sites · 2025 · changes shown are Jul–Dec vs Jan–Jun
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/meeting">
            Next: tailor the meeting <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {excludedHere > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/50 bg-warning/10 px-4 py-2 text-sm">
          <EyeOff className="h-4 w-4" /> {excludedHere} data lines are excluded from the numbers. The original data is untouched.
          <Button variant="outline" size="sm" onClick={clearExcluded} className="ml-auto">
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore all
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={<Shirt className="h-4 w-4" />} label="Garments in circulation" value={fmt(t.inCirculation)} sub={`${fmt(t.wearers)} wearers (Dec)`} />
        <Kpi icon={<WashingMachine className="h-4 w-4" />} label="Washing frequency" value={`${t.washesPerWearerWeek.toFixed(1)}×`} sub="per wearer / week" delta={pctChange(h2.washesPerWearerWeek, h1.washesPerWearerWeek)} />
        <Kpi icon={<Wrench className="h-4 w-4" />} label="Repair rate" value={t.repairRate.toFixed(2)} sub="per 100 washes" delta={pctChange(h2.repairRate, h1.repairRate)} goodWhenUp={false} />
        <Kpi icon={<Euro className="h-4 w-4" />} label="Cost avoided" value={`€${fmtK(t.costAvoided)}`} sub="new garments not bought (est.)" delta={pctChange(h2.costAvoided, h1.costAvoided)} />
        <Kpi icon={<Leaf className="h-4 w-4" />} label="CO₂e saved" value={`${fmt(t.co2Saved / 1000, 1)} t`} sub="vs local laundry" delta={pctChange(h2.co2Saved, h1.co2Saved)} />
        <Kpi icon={<Droplets className="h-4 w-4" />} label="Water saved" value={`${fmt(t.waterSaved / 1000)} m³`} sub="vs local laundry" delta={pctChange(h2.waterSaved, h1.waterSaved)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
        <Section
          title="Garment utilisation"
          desc="Weekly washes compared with garments allocated. Too low = idle stock, too high = wearers may run short."
        >
          <div className="flex items-end gap-3">
            <span className={`font-display text-6xl font-extrabold ${inBand ? "text-success" : "text-warning"}`}>{t.utilisation.toFixed(0)}%</span>
            <Badge variant={inBand ? "secondary" : "outline"} className="mb-3">
              {inBand ? "Healthy" : t.utilisation < band.low ? "Under-used" : "Stock tight"}
            </Badge>
          </div>
          <div className="mt-4">
            <BandBar value={t.utilisation} low={band.low} high={band.high} />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>
                Healthy band {band.low}–{band.high}%
              </span>
              <span>100%</span>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-muted p-3">
            <p className="text-sm font-medium">KAM override</p>
            <p className="text-xs text-muted-foreground">
              Default for {customer.industry}: {def.low}–{def.high}%
              {def.low > 30 ? " (higher because of hygiene needs)" : ""}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="number"
                aria-label="Band low"
                className="w-20 bg-card"
                value={band.low}
                min={0}
                max={band.high - 1}
                onChange={(e) => setBand({ low: Number(e.target.value), high: band.high })}
              />
              <span className="text-sm">to</span>
              <Input
                type="number"
                aria-label="Band high"
                className="w-20 bg-card"
                value={band.high}
                min={band.low + 1}
                max={150}
                onChange={(e) => setBand({ low: band.low, high: Number(e.target.value) })}
              />
              <span className="text-sm">%</span>
              {overridden && (
                <Button variant="ghost" size="sm" onClick={() => setBand(null)}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Section>
        </div>

        <div className="lg:col-span-3">
          <Section title="Utilisation by site" desc="Green zone = healthy band. Orange bars sit outside it.">
            <div className="h-[340px]">
              <ResponsiveContainer>
                <BarChart data={sites.map((s) => ({ name: s.name.replace(customer.customer_name.split(" ")[0] ?? "", "").trim(), u: +s.utilisation.toFixed(1) }))} margin={{ left: -10, bottom: 50 }}>
                  <ReferenceArea y1={band.low} y2={band.high} fill="var(--success)" fillOpacity={0.12} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={11} stroke="var(--muted-foreground)" />
                  <YAxis unit="%" fontSize={11} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ background: "var(--popover)", borderRadius: 12, border: "1px solid var(--border)" }} formatter={(v: number) => [`${v}%`, "Utilisation"]} />
                  <Bar dataKey="u" radius={[6, 6, 0, 0]}>
                    {sites.map((s) => (
                      <Cell key={s.siteId} fill={s.utilisation < band.low || s.utilisation > band.high ? "var(--accent)" : "var(--primary)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>
      </div>

      <Section title="What stands out" desc="Plain-language reasons why sites differ from the account average or from the first half of the year.">
        {outs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing unusual — all sites behave like the account average.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {outs.slice(0, 8).map((o, i) => (
              <div key={i} className="flex gap-3 rounded-xl border p-3">
                <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${o.severity === "act" ? "text-destructive" : "text-warning"}`} />
                <div>
                  <p className="font-semibold leading-snug">{o.headline}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{o.why}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Data exceptions"
        desc="Lines that look unusual. Untick to leave a line out of every number — nothing is deleted and no re-upload is needed."
        action={
          exceptions.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleExcluded(exceptions.map((e) => e.row.id), true)}>
                Exclude all {exceptions.length}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleExcluded(exceptions.map((e) => e.row.id), false)}>
                Include all
              </Button>
            </div>
          )
        }
      >
        {exceptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exceptions found for this account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-2">Use</th>
                  <th className="pr-2">Month</th>
                  <th className="pr-2">Site</th>
                  <th className="pr-2">Garment</th>
                  <th className="pr-2 text-right">Allocated</th>
                  <th className="pr-2 text-right">Washes</th>
                  <th>Why flagged</th>
                </tr>
              </thead>
              <tbody>
                {(showAllEx ? exceptions : exceptions.slice(0, 8)).map(({ row, reasons }) => {
                  const ex = excludedSet.has(row.id);
                  return (
                    <tr key={row.id} className={`border-t ${ex ? "opacity-50" : ""}`}>
                      <td className="py-2 pr-2">
                        <Checkbox checked={!ex} onCheckedChange={(v) => toggleExcluded([row.id], !v)} aria-label="Include line" />
                      </td>
                      <td className="pr-2">{row.month}</td>
                      <td className="pr-2">{siteById[row.site]?.site_name}</td>
                      <td className="pr-2">{productById[row.product]?.product_name}</td>
                      <td className="pr-2 text-right">{fmt(row.allocated)}</td>
                      <td className="pr-2 text-right">{fmt(row.washed)}</td>
                      <td>{reasons.join(" · ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {exceptions.length > 8 && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAllEx(!showAllEx)}>
                <Eye className="mr-1 h-3.5 w-3.5" /> {showAllEx ? "Show fewer" : `Show all ${exceptions.length}`}
              </Button>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
