import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Activity, BarChart3, Presentation, Users, Shirt } from "lucide-react";
import { ContextBar } from "./ContextBar";
import { cn } from "@/lib/utils";
import { useKam } from "@/lib/kam/store";
import { FileSpreadsheet } from "lucide-react";

const STEPS = [
  { to: "/" as const, n: 1, label: "Account Pulse", icon: Activity },
  { to: "/meeting" as const, n: 2, label: "Meeting Customizer", icon: Users },
  { to: "/deck" as const, n: 3, label: "Deck & Talking Points", icon: Presentation },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const advanced = pathname.startsWith("/advanced");
  const { data, dataReady } = useKam();

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Shirt className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-lg font-extrabold tracking-tight text-primary">Lindström</span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">KAM Assistant</span>
            </span>
          </Link>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label="Mode" className="flex rounded-full border bg-card p-1 text-sm">
              <button
                role="tab"
                aria-selected={!advanced}
                onClick={() => navigate({ to: "/" })}
                className={cn("rounded-full px-4 py-1.5 font-medium transition", !advanced ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Default
              </button>
              <button
                role="tab"
                aria-selected={advanced}
                onClick={() => navigate({ to: "/advanced" })}
                className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition", advanced ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Advanced
              </button>
            </div>
          </div>
        </div>

        {!advanced && (
          <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3" aria-label="Meeting steps">
            {STEPS.map((s, i) => {
              const active = pathname === s.to;
              const Icon = s.icon;
              return (
                <div key={s.to} className="flex items-center gap-2">
                  <Link
                    to={s.to}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition whitespace-nowrap",
                      active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card hover:border-primary/40",
                    )}
                  >
                    <span className={cn("grid h-6 w-6 place-items-center rounded-full text-xs font-bold", active ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground")}>
                      {s.n}
                    </span>
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </Link>
                  {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
                </div>
              );
            })}
          </nav>
        )}
        <ContextBar />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{dataReady && data.customers.length === 0 ? <div className="py-12 text-center"><FileSpreadsheet className="mx-auto mb-4 h-10 w-10 text-primary" /><h1 className="font-display text-2xl font-bold">No company data</h1><p className="mt-2 text-muted-foreground">Import an Excel workbook to start a meeting.</p></div> : children}</main>
    </div>
  );
}
