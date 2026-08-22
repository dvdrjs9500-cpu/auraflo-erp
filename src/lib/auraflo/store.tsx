import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  SEED_CUSTOMERS,
  SEED_PRODUCTS,
  rupees,
  type Customer,
  type Product,
  type Txn,
  type TxnLine,
} from "./data";
import { parseCommand, type ParseResult } from "./parser";

type ExecOutcome = {
  parsed: ParseResult;
  txn: Txn | null;
  message: string;
  lowStock: Product[];
};

type Ctx = {
  products: Product[];
  customers: Customer[];
  transactions: Txn[];
  lowStock: Product[];
  todaySales: number;
  pendingUdharCount: number;
  pendingUdharTotal: number;
  invoice: Txn | null;
  openInvoice: (t: Txn | null) => void;
  execute: (transcript: string) => ExecOutcome;
  preview: (transcript: string) => ParseResult;
  settleCustomer: (id: string) => void;
  restock: (productId: string, qty: number) => void;
};

const AurafloContext = createContext<Ctx | null>(null);

let seq = 1042;
const nextInvoice = () => `AF/26-27/${++seq}`;

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.rate = 1.02;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* voice feedback is best-effort */
  }
}

export function AurafloProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(SEED_CUSTOMERS);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [invoice, setInvoice] = useState<Txn | null>(null);

  const preview = useCallback(
    (t: string) => parseCommand(t, products, customers),
    [products, customers],
  );

  const execute = useCallback(
    (transcript: string): ExecOutcome => {
      const parsed = parseCommand(transcript, products, customers);
      const now = Date.now();
      let txn: Txn | null = null;
      let message = "";
      const touched: Product[] = [];

      if (parsed.intent === "UNKNOWN") {
        message = "Sorry, I could not understand that command.";
        toast.error("Not understood", { description: parsed.notes[0] });
        speak("Sorry, I did not catch that. Please say the item name again.");
        return { parsed, txn: null, message, lowStock: [] };
      }

      if (parsed.intent === "QUICK_EXPENSE") {
        const amt = parsed.amount ?? 0;
        txn = {
          id: `t${now}`,
          invoiceNo: nextInvoice(),
          kind: "expense",
          customer: "Shop Expense",
          lines: [],
          label: parsed.label ?? "Expense",
          amount: amt,
          payment: parsed.payment,
          at: now,
          transcript,
        };
        message = `Expense of ${rupees(amt)} for ${parsed.label} recorded.`;
      } else if (parsed.intent === "ADD_UDHAR") {
        const amt = parsed.amount ?? 0;
        const name = parsed.customer ?? "Walk-in";
        setCustomers((cs) => {
          const exists = cs.find((c) => c.id === parsed.customerId || c.name === name);
          if (exists) {
            return cs.map((c) => (c.id === exists.id ? { ...c, balance: c.balance + amt } : c));
          }
          return [
            ...cs,
            {
              id: `c${now}`,
              name,
              phone: "919000000000",
              balance: amt,
              aliases: [name.toLowerCase()],
            },
          ];
        });
        txn = {
          id: `t${now}`,
          invoiceNo: nextInvoice(),
          kind: "udhar",
          customer: name,
          lines: [],
          label: "Udhar added",
          amount: amt,
          payment: "credit",
          at: now,
          transcript,
        };
        message = `${rupees(amt)} udhar added to ${name}'s khata.`;
      } else {
        const lines: TxnLine[] = parsed.items.map((i) => {
          const p = products.find((x) => x.id === i.productId)!;
          return {
            productId: p.id,
            name: p.name,
            hsn: p.hsn,
            qty: i.qty,
            unit: i.qty > 1 ? p.unitPlural : p.unit,
            unitPrice: i.unitPrice,
            gst: p.gst,
          };
        });
        const sign = parsed.intent === "ADD_STOCK" ? 1 : -1;

        setProducts((ps) =>
          ps.map((p) => {
            const line = lines.find((l) => l.productId === p.id);
            if (!line) return p;
            const updated = { ...p, stock: Math.max(0, p.stock + sign * line.qty) };
            if (sign < 0 && updated.stock <= updated.reorderLevel) touched.push(updated);
            return updated;
          }),
        );

        const amt = parsed.amount ?? lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
        const customer = parsed.customer ?? (parsed.intent === "ADD_STOCK" ? "Supplier" : "Walk-in customer");

        if (parsed.intent === "ADD_SALE" && parsed.payment === "credit") {
          setCustomers((cs) => {
            const exists = cs.find((c) => c.id === parsed.customerId || c.name === customer);
            if (exists) {
              return cs.map((c) => (c.id === exists.id ? { ...c, balance: c.balance + amt } : c));
            }
            return [
              ...cs,
              {
                id: `c${now}`,
                name: customer,
                phone: "919000000000",
                balance: amt,
                aliases: [customer.toLowerCase()],
              },
            ];
          });
        }

        txn = {
          id: `t${now}`,
          invoiceNo: nextInvoice(),
          kind: parsed.intent === "ADD_STOCK" ? "stock" : "sale",
          customer,
          lines,
          amount: amt,
          payment: parsed.payment,
          at: now,
          transcript,
        };

        const itemText = lines.map((l) => `${l.qty} ${l.unit} ${l.name}`).join(" and ");
        message =
          parsed.intent === "ADD_STOCK"
            ? `Stock updated: ${itemText} added.`
            : `Sale recorded: ${itemText} for ${rupees(amt)}, ${parsed.payment.toUpperCase()}.`;
      }

      if (txn) {
        const t = txn;
        setTransactions((prev) => [t, ...prev]);
        toast.success(message, {
          description: `Invoice ${t.invoiceNo} · heard: "${transcript}"`,
        });
        speak(message);
      }

      touched.forEach((p) => {
        toast.warning(`Low stock: ${p.shortName}`, {
          description: `${p.stock} left (reorder at ${p.reorderLevel})`,
        });
      });

      return { parsed, txn, message, lowStock: touched };
    },
    [products, customers],
  );

  const settleCustomer = useCallback((id: string) => {
    setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, balance: 0 } : c)));
    toast.success("Khata settled");
  }, []);

  const restock = useCallback((productId: string, qty: number) => {
    setProducts((ps) =>
      ps.map((p) => (p.id === productId ? { ...p, stock: p.stock + qty } : p)),
    );
    toast.success("Stock inward recorded");
  }, []);

  const value = useMemo<Ctx>(() => {
    const lowStock = products.filter((p) => p.stock <= p.reorderLevel);
    const todaySales = transactions
      .filter((t) => t.kind === "sale")
      .reduce((s, t) => s + t.amount, 0);
    const pending = customers.filter((c) => c.balance > 0);
    return {
      products,
      customers,
      transactions,
      lowStock,
      todaySales,
      pendingUdharCount: pending.length,
      pendingUdharTotal: pending.reduce((s, c) => s + c.balance, 0),
      invoice,
      openInvoice: setInvoice,
      execute,
      preview,
      settleCustomer,
      restock,
    };
  }, [products, customers, transactions, invoice, execute, preview, settleCustomer, restock]);

  return <AurafloContext.Provider value={value}>{children}</AurafloContext.Provider>;
}

export function useAuraflo() {
  const ctx = useContext(AurafloContext);
  if (!ctx) throw new Error("useAuraflo must be used inside AurafloProvider");
  return ctx;
}
