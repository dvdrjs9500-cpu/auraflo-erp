import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReceiptText } from "lucide-react";
import { rupees } from "@/lib/auraflo/data";
import { useAuraflo } from "@/lib/auraflo/store";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "GST Invoices — Auraflo" },
      {
        name: "description",
        content:
          "Every voice-logged sale becomes a GST-compliant invoice with HSN codes, CGST/SGST split, WhatsApp sharing and printing.",
      },
      { property: "og:title", content: "GST Invoices — Auraflo" },
      {
        property: "og:description",
        content: "Automatic GST-compliant invoices generated from spoken transactions.",
      },
    ],
  }),
  component: Invoices,
});

function Invoices() {
  const { transactions, openInvoice } = useAuraflo();
  const bills = transactions.filter((t) => t.kind === "sale" || t.kind === "udhar");

  const gstCollected = transactions
    .flatMap((t) => t.lines.map((l) => (l.qty * l.unitPrice * l.gst) / 100))
    .reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-3 shadow-soft">
        <p className="text-[11px] text-muted-foreground uppercase">GST collected today</p>
        <p className="font-display text-2xl font-extrabold text-primary">
          {rupees(Number(gstCollected.toFixed(2)))}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Compliance happens passively — every spoken sale files itself.
        </p>
      </div>

      {bills.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
          <ReceiptText className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">
            Invoices appear here the moment you speak a sale.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bills.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3 shadow-soft"
            >
              <div className="min-w-0">
                <p className="font-display text-sm font-bold">{t.invoiceNo}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {t.customer} · {new Date(t.at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    t.payment === "credit"
                      ? "bg-warning-soft text-warning-foreground"
                      : "bg-accent-soft text-accent"
                  }
                >
                  {rupees(t.amount)}
                </Badge>
                <Button size="sm" variant="outline" className="h-8" onClick={() => openInvoice(t)}>
                  Open
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
