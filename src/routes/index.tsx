import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Mic, PackagePlus, Receipt, Wallet } from "lucide-react";
import { rupees, type Txn } from "@/lib/auraflo/data";
import { useAuraflo } from "@/lib/auraflo/store";
import { LowStockBanner } from "@/components/auraflo/LowStockBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Auraflo — Voice ERP for Kirana Shops" },
      {
        name: "description",
        content:
          "Speak one sentence and Auraflo logs the sale, updates stock, and generates a GST invoice for Indian MSME kirana shops.",
      },
      { property: "og:title", content: "Auraflo — Voice ERP for Kirana Shops" },
      {
        property: "og:description",
        content: "Voice-native billing, inventory, GST invoicing and udhar khata for MSMEs.",
      },
    ],
  }),
  component: Ledger,
});

const badgeStyle: Record<string, string> = {
  upi: "bg-primary-soft text-primary",
  cash: "bg-accent-soft text-accent",
  credit: "bg-warning-soft text-warning-foreground",
};

const kindIcon: Record<Txn["kind"], typeof Receipt> = {
  sale: Receipt,
  stock: PackagePlus,
  expense: Wallet,
  udhar: FileText,
};

function Ledger() {
  const { transactions, lowStock, openInvoice } = useAuraflo();

  return (
    <div className="space-y-4">
      <LowStockBanner items={lowStock} />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold">Today's ledger</h2>
          <span className="text-[11px] text-muted-foreground">
            {transactions.length} entr{transactions.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary-soft">
              <Mic className="size-5 text-primary" />
            </span>
            <p className="font-display text-sm font-bold">No entries yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap the mic and say: “Rameshji, Fortune Atta 5 bags, 1200 rupees, UPI paid”. Auraflo
              will bill it, cut stock and make the GST invoice.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {transactions.map((t) => {
              const Icon = kindIcon[t.kind];
              return (
                <li key={t.id} className="rounded-2xl border bg-card p-3 shadow-soft">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                      <Icon className="size-4 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-display text-sm font-bold">{t.customer}</p>
                        <p className="font-display text-sm font-bold">{rupees(t.amount)}</p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.lines.length
                          ? t.lines.map((l) => `${l.name} × ${l.qty} ${l.unit}`).join(", ")
                          : t.label}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className={badgeStyle[t.payment]}>{t.payment.toUpperCase()}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {t.kind}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(t.at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-7 px-2 text-[11px] text-primary"
                          onClick={() => openInvoice(t)}
                        >
                          View invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
