import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Kpi({
  icon,
  label,
  value,
  sub,
  delta,
  goodWhenUp = true,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  goodWhenUp?: boolean;
}) {
  const flat = delta === undefined || Math.abs(delta) < 1;
  const good = !flat && (delta! > 0) === goodWhenUp;
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-secondary-foreground">{icon}</span>
        {label}
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
              flat ? "bg-muted" : good ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {flat ? <Minus className="h-3 w-3" /> : delta! > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta!).toFixed(0)}%
          </span>
        )}
        <span>{sub}</span>
      </div>
    </div>
  );
}

export function Section({ title, desc, children, action }: { title: string; desc?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function BandBar({ value, low, high, max = 100 }: { value: number; low: number; high: number; max?: number }) {
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`;
  return (
    <div className="relative h-4 w-full rounded-full bg-muted">
      <div className="absolute inset-y-0 rounded-full bg-success/30" style={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }} />
      <div
        className="absolute -top-1 h-6 w-1.5 -translate-x-1/2 rounded-full bg-primary ring-2 ring-card"
        style={{ left: pct(value) }}
        aria-label={`Value ${value.toFixed(0)}%`}
      />
    </div>
  );
}
