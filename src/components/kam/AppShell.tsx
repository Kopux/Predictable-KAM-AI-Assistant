import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Activity, BarChart3, Presentation, Users, Shirt } from "lucide-react";
import { ContextBar } from "./ContextBar";
import { cn } from "@/lib/utils";
import { useKam } from "@/lib/kam/store";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <header className="no-print sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="brand-badge grid h-10 w-10 place-items-center rounded-lg shadow-sm">
              <Shirt className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-lg font-extrabold text-foreground">Predictable</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase text-muted-foreground">KAM AI Assistant</span>
            </span>
          </Link>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label="Mode" className="flex rounded-full border bg-card p-1 text-sm">
              <Button variant="ghost"
                role="tab"
                aria-selected={!advanced}
                onClick={() => navigate({ to: "/" })}
                className={cn("rounded-full px-4 py-1.5 font-medium transition", !advanced ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Default
              </Button>
              <Button variant="ghost"
                role="tab"
                aria-selected={advanced}
                onClick={() => navigate({ to: "/advanced" })}
                className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition", advanced ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Advanced
              </Button>
            </div>
          </div>
        </div>

        {!advanced && (
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-4 pt-1" aria-label="Meeting steps">
            {STEPS.map((s, i) => {
              const active = pathname === s.to;
              const Icon = s.icon;
              return (
                <div key={s.to} className="flex items-center gap-2">
                  <Button asChild variant="ghost" className={cn("step-link group h-10 rounded-full border px-3 text-xs sm:px-4 sm:text-sm", active ? "step-current border-primary/30 bg-secondary text-primary hover:bg-secondary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground")}>
                  <Link
                    to={s.to}
                    aria-current={active ? "step" : undefined}
                  >
                    <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {s.n}
                    </span>
                    <Icon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                    {s.label}
                  </Link>
                  </Button>
                  {i < STEPS.length - 1 && <span className={cn("h-px w-4 shrink-0 sm:w-8", STEPS.findIndex((step) => step.to === pathname) > i ? "bg-primary/50" : "bg-border")} />}
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
