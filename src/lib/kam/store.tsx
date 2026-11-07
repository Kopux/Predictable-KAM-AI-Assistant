import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { customers } from "./data";
import { defaultBandFor, findCustomer, type Band } from "./metrics";

export type Attendee = "procurement" | "sustainability" | "operations";
export type Priority = "cost" | "co2" | "water" | "recycling" | "hygiene";

export const ATTENDEES: { id: Attendee; label: string; hint: string }[] = [
  { id: "procurement", label: "Procurement / Finance", hint: "Cost, contract value, garment stock" },
  { id: "sustainability", label: "Sustainability Lead", hint: "CO₂, water, circularity evidence" },
  { id: "operations", label: "Operations / Site Manager", hint: "Availability, service, sites" },
];
export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "cost", label: "Cost reduction" },
  { id: "co2", label: "CO₂ emissions" },
  { id: "water", label: "Water conservation" },
  { id: "recycling", label: "Textile recycling / circularity" },
  { id: "hygiene", label: "Hygiene standards" },
];

type State = {
  customerId: string;
  excluded: number[];
  bands: Record<string, Band>;
  attendees: Attendee[];
  priorities: Priority[];
  hiddenSlides: string[];
};

type Ctx = State & {
  customer: ReturnType<typeof findCustomer>;
  band: Band;
  excludedSet: Set<number>;
  setCustomer: (id: string) => void;
  toggleExcluded: (ids: number[], exclude: boolean) => void;
  clearExcluded: () => void;
  setBand: (b: Band | null) => void;
  toggleAttendee: (a: Attendee) => void;
  togglePriority: (p: Priority) => void;
  toggleSlide: (id: string) => void;
};

const KEY = "kam-assistant-v1";
const initial: State = {
  customerId: customers[0].customer_id,
  excluded: [],
  bands: {},
  attendees: ["procurement", "sustainability"],
  priorities: ["cost", "co2"],
  hiddenSlides: [],
};

const C = createContext<Ctx | null>(null);

export function KamProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) set({ ...initial, ...JSON.parse(raw) });
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(s));
  }, [s, loaded]);

  const value = useMemo<Ctx>(() => {
    const customer = findCustomer(s.customerId);
    const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    return {
      ...s,
      customer,
      band: s.bands[customer.customer_id] ?? defaultBandFor(customer.industry),
      excludedSet: new Set(s.excluded),
      setCustomer: (id) => set((p) => ({ ...p, customerId: id })),
      toggleExcluded: (ids, exclude) =>
        set((p) => {
          const next = new Set(p.excluded);
          ids.forEach((i) => (exclude ? next.add(i) : next.delete(i)));
          return { ...p, excluded: [...next] };
        }),
      clearExcluded: () => set((p) => ({ ...p, excluded: [] })),
      setBand: (b) =>
        set((p) => {
          const bands = { ...p.bands };
          if (b) bands[p.customerId] = b;
          else delete bands[p.customerId];
          return { ...p, bands };
        }),
      toggleAttendee: (a) => set((p) => ({ ...p, attendees: toggle(p.attendees, a) })),
      togglePriority: (x) => set((p) => ({ ...p, priorities: toggle(p.priorities, x) })),
      toggleSlide: (id) => set((p) => ({ ...p, hiddenSlides: toggle(p.hiddenSlides, id) })),
    };
  }, [s]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useKam() {
  const v = useContext(C);
  if (!v) throw new Error("useKam outside KamProvider");
  return v;
}
