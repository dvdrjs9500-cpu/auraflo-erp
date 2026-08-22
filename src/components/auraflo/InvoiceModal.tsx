import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Share2, ShieldCheck } from "lucide-react";
import { SHOP, rupees, type Txn } from "@/lib/auraflo/data";
import { useAuraflo } from "@/lib/auraflo/store";

function paymentLabel(t: Txn) {
  if (t.payment === "credit") return "PENDING (UDHAR)";
  return `PAID · ${t.payment.toUpperCase()}`;
}

export function InvoiceModal() {
  const { invoice, openInvoice } = useAuraflo();
  if (!invoice) return null;
  const t = invoice;

  const rows = t.lines.map((l) => {
    const taxable = l.qty * l.unitPrice;
    const tax = (taxable * l.gst) / 100;
    return { ...l, taxable, cgst: tax / 2, sgst: tax / 2, total: taxable + tax };
  });
  const taxableTotal = rows.reduce((s, r) => s + r.taxable, 0);
  const taxTotal = rows.reduce((s, r) => s + r.cgst + r.sgst, 0);
  const grand = rows.length ? taxableTotal + taxTotal : t.amount;

  const shareText = [
    `*${SHOP.name}* — GST Invoice`,
    `Invoice: ${t.invoiceNo}`,
    `Date: ${new Date(t.at).toLocaleString("en-IN")}`,
    `Customer: ${t.customer}`,
    "",
    ...(rows.length
      ? rows.map((r) => `${r.name} x${r.qty} ${r.unit} = ₹${r.total.toFixed(2)}`)
      : [`${t.label ?? "Entry"} = ₹${t.amount.toFixed(2)}`]),
    "",
    `Taxable: ₹${taxableTotal.toFixed(2)} | GST: ₹${taxTotal.toFixed(2)}`,
    `*Total: ₹${grand.toFixed(2)}*`,
    `Status: ${paymentLabel(t)}`,
    `GSTIN: ${SHOP.gstin}`,
    "",
    "Billed with Auraflo — voice-native ERP",
  ].join("\n");

  return (
    <Dialog open onOpenChange={(o) => !o && openInvoice(null)}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <div id="printable-invoice" className="bg-card">
          <div className="surface-gradient px-5 py-5 text-primary-foreground">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase opacity-80">Tax Invoice</p>
                <h2 className="font-display text-lg leading-tight font-bold">{SHOP.name}</h2>
                <p className="mt-1 text-xs opacity-90">{SHOP.address}</p>
                <p className="text-xs opacity-90">GSTIN: {SHOP.gstin}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold">{t.invoiceNo}</p>
                <p className="opacity-90">{new Date(t.at).toLocaleDateString("en-IN")}</p>
                <p className="opacity-90">
                  {new Date(t.at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Billed to</span>
              <span className="font-semibold">{t.customer}</span>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-[11px]">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold">Item</th>
                    <th className="px-1 py-2 text-left font-semibold">HSN</th>
                    <th className="px-1 py-2 text-right font-semibold">Qty</th>
                    <th className="px-1 py-2 text-right font-semibold">Rate</th>
                    <th className="px-1 py-2 text-right font-semibold">Taxable</th>
                    <th className="px-1 py-2 text-right font-semibold">CGST</th>
                    <th className="px-1 py-2 text-right font-semibold">SGST</th>
                    <th className="px-2 py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr className="border-t">
                      <td className="px-2 py-2" colSpan={7}>
                        {t.label ?? "Entry"}
                      </td>
                      <td className="px-2 py-2 text-right font-semibold">{rupees(t.amount)}</td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.productId} className="border-t">
                      <td className="px-2 py-2 font-medium">{r.name}</td>
                      <td className="px-1 py-2 text-muted-foreground">{r.hsn}</td>
                      <td className="px-1 py-2 text-right">{r.qty}</td>
                      <td className="px-1 py-2 text-right">{r.unitPrice}</td>
                      <td className="px-1 py-2 text-right">{r.taxable.toFixed(2)}</td>
                      <td className="px-1 py-2 text-right">
                        {(r.gst / 2).toFixed(1)}%<br />
                        <span className="text-muted-foreground">{r.cgst.toFixed(2)}</span>
                      </td>
                      <td className="px-1 py-2 text-right">
                        {(r.gst / 2).toFixed(1)}%<br />
                        <span className="text-muted-foreground">{r.sgst.toFixed(2)}</span>
                      </td>
                      <td className="px-2 py-2 text-right font-semibold">{r.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Taxable value</span>
                <span>{rupees(Number(taxableTotal.toFixed(2)))}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total GST (CGST + SGST)</span>
                <span>{rupees(Number(taxTotal.toFixed(2)))}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Grand total</span>
                <span>{rupees(Number(grand.toFixed(2)))}</span>
              </div>
              {Math.abs(grand - t.amount) > 1 && (
                <p className="text-xs text-muted-foreground">
                  Amount collected as spoken: {rupees(t.amount)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Badge
                className={
                  t.payment === "credit"
                    ? "bg-warning-soft text-warning-foreground"
                    : "bg-accent-soft text-accent"
                }
              >
                {paymentLabel(t)}
              </Badge>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Auto-generated from voice
              </span>
            </div>

            <p className="rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground italic">
              Voice input: “{t.transcript}”
            </p>
          </div>
        </div>

        <div className="no-print flex gap-2 border-t p-4">
          <Button
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(shareText)}`,
                "_blank",
                "noopener",
              )
            }
          >
            <Share2 className="size-4" /> WhatsApp
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
