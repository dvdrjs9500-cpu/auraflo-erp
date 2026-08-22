import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PackagePlus } from "lucide-react";
import { rupees } from "@/lib/auraflo/data";
import { useAuraflo } from "@/lib/auraflo/store";
import { LowStockBanner } from "@/components/auraflo/LowStockBanner";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Smart Inventory — Auraflo" },
      {
        name: "description",
        content:
          "Live kirana stock levels with GST rates, reorder alerts and one-tap WhatsApp reordering, updated automatically from voice commands.",
      },
      { property: "og:title", content: "Smart Inventory — Auraflo" },
      {
        property: "og:description",
        content: "Voice-updated stock levels with automatic low-stock reorder alerts.",
      },
    ],
  }),
  component: Inventory,
});

function Inventory() {
  const { products, lowStock, restock } = useAuraflo();

  return (
    <div className="space-y-4">
      <LowStockBanner items={lowStock} />
      <h2 className="font-display text-sm font-bold">Smart inventory</h2>
      <ul className="space-y-2">
        {products.map((p) => {
          const low = p.stock <= p.reorderLevel;
          const pct = Math.min(100, (p.stock / Math.max(p.reorderLevel * 3, 1)) * 100);
          return (
            <li key={p.id} className="rounded-2xl border bg-card p-3 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rupees(p.price)}/{p.unit} · GST {p.gst}% · HSN {p.hsn}
                  </p>
                </div>
                <Badge
                  className={
                    low ? "bg-destructive/15 text-destructive" : "bg-accent-soft text-accent"
                  }
                >
                  {p.stock} {p.unitPlural}
                </Badge>
              </div>
              <Progress value={pct} className="mt-3 h-1.5" />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Reorder level: {p.reorderLevel} {p.unitPlural}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => restock(p.id, 10)}
                >
                  <PackagePlus className="size-3" /> Add 10
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="px-1 text-[11px] text-muted-foreground">
        Say “Tata Salt 10 packets added to stock” to book inward stock by voice.
      </p>
    </div>
  );
}
