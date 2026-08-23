import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Package, NotebookPen, ReceiptText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHOP, rupees } from "@/lib/auraflo/data";
import { useAuraflo } from "@/lib/auraflo/store";

const NAV = [
  { to: "/", label: "கணக்கு", sub: "Ledger", icon: Home },
  { to: "/inventory", label: "சரக்கு", sub: "Stock", icon: Package },
  { to: "/khata", label: "கடன்", sub: "Udhar", icon: NotebookPen },
  { to: "/invoices", label: "பில்", sub: "Bills", icon: ReceiptText },
] as const;

export function TopBar() {
  const { todaySales, pendingUdharCount, pendingUdharTotal } = useAuraflo();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <header className="surface-gradient rounded-b-3xl px-4 pt-3 pb-5 text-primary-foreground shadow-lift">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase opacity-80">Auraflo · குரல் ERP</p>
          <h1 className="font-display text-lg leading-tight font-extrabold">{SHOP.tamilName}</h1>
          <p className="text-[11px] font-semibold opacity-90">{SHOP.name} · Coimbatore, TN</p>
          <p className="text-[11px] opacity-85">
            {today} · GSTIN {SHOP.gstin}
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-white/15">
          <Sparkles className="size-5" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur">
          <p className="text-[10px] uppercase opacity-85">இன்றைய விற்பனை</p>
          <p className="font-display text-xl font-bold">{rupees(todaySales)}</p>
        </div>
        <div className="rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur">
          <p className="text-[10px] uppercase opacity-85">நிலுவை கடன்</p>
          <p className="font-display text-xl font-bold">
            {pendingUdharCount}
            <span className="ml-1 text-xs font-medium opacity-85">
              · {rupees(pendingUdharTotal)}
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}

export function PitchBanner() {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-accent px-3 py-1.5 text-[11px] font-bold tracking-wide text-accent-foreground">
      <span className="size-1.5 animate-pulse rounded-full bg-current" />
      PITCH MODE ACTIVE · தமிழ் குரல் டெமோ · Tamil Nadu MSME
    </div>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {NAV.map(({ to, label, sub, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5", active && "scale-110")} />
              <span className="leading-none">{label}</span>
              <span className="text-[8px] leading-none font-medium opacity-70">{sub}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
