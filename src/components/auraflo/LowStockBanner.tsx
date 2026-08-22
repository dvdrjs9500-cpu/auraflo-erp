import { AlertTriangle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHOP, type Product } from "@/lib/auraflo/data";

export function LowStockBanner({ items }: { items: Product[] }) {
  if (!items.length) return null;
  const text = `Namaste! Order from ${SHOP.name} (GSTIN ${SHOP.gstin}):\n${items
    .map((p) => `• ${p.name} — send ${Math.max(p.reorderLevel * 3 - p.stock, 5)} ${p.unitPlural}`)
    .join("\n")}\n\nSent via Auraflo`;

  return (
    <div className="rounded-2xl border border-warning/40 bg-warning-soft p-3.5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/25">
          <AlertTriangle className="size-4 text-warning-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-warning-foreground">
            Low stock warning · {items.length} item{items.length > 1 ? "s" : ""}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-warning-foreground/85">
            {items.map((p) => (
              <li key={p.id}>
                {p.name} — <strong>{p.stock}</strong> {p.unitPlural} left (reorder at{" "}
                {p.reorderLevel})
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            className="mt-2.5 h-8 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() =>
              window.open(
                `https://wa.me/${SHOP.supplier}?text=${encodeURIComponent(text)}`,
                "_blank",
                "noopener",
              )
            }
          >
            <MessageCircle className="size-3.5" /> Reorder via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
