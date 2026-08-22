import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { SHOP, rupees } from "@/lib/auraflo/data";
import { useAuraflo } from "@/lib/auraflo/store";

export const Route = createFileRoute("/khata")({
  head: () => ({
    meta: [
      { title: "Udhar Khata — Auraflo" },
      {
        name: "description",
        content:
          "Digital credit ledger for kirana customers: track pending udhar balances, settle payments and send reminders on WhatsApp.",
      },
      { property: "og:title", content: "Udhar Khata — Auraflo" },
      {
        property: "og:description",
        content: "Voice-added customer credit ledger with WhatsApp payment reminders.",
      },
    ],
  }),
  component: Khata,
});

function Khata() {
  const { customers, settleCustomer, pendingUdharTotal } = useAuraflo();
  const sorted = [...customers].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-3 shadow-soft">
        <p className="text-[11px] text-muted-foreground uppercase">Total outstanding udhar</p>
        <p className="font-display text-2xl font-extrabold text-warning-foreground">
          {rupees(pendingUdharTotal)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Voice shortcut: “Add 150 rupees udhar to Suresh”
        </p>
      </div>

      <ul className="space-y-2">
        {sorted.map((c) => (
          <li key={c.id} className="rounded-2xl border bg-card p-3 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary">
                  {c.name.charAt(0)}
                </span>
                <div>
                  <p className="font-display text-sm font-bold">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">+{c.phone}</p>
                </div>
              </div>
              {c.balance > 0 ? (
                <Badge className="bg-warning-soft text-warning-foreground">
                  {rupees(c.balance)} pending
                </Badge>
              ) : (
                <Badge className="bg-accent-soft text-accent">Settled</Badge>
              )}
            </div>
            {c.balance > 0 && (
              <div className="mt-2.5 flex gap-2">
                <Button
                  size="sm"
                  className="h-8 flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${c.phone}?text=${encodeURIComponent(
                        `Namaste ${c.name}, aapka ${SHOP.name} par ₹${c.balance} udhar baaki hai. Kripya UPI se bhej dijiye. Dhanyavaad!`,
                      )}`,
                      "_blank",
                      "noopener",
                    )
                  }
                >
                  <MessageCircle className="size-3.5" /> Remind
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1"
                  onClick={() => settleCustomer(c.id)}
                >
                  <CheckCircle2 className="size-3.5" /> Mark paid
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
