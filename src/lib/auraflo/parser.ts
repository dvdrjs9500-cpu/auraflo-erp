import type { PaymentMethod, Product, Customer } from "./data";

export type ParsedItem = {
  productId: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

export type ParseResult = {
  intent: "ADD_SALE" | "ADD_STOCK" | "QUICK_EXPENSE" | "ADD_UDHAR" | "UNKNOWN";
  items: ParsedItem[];
  amount: number | null;
  customer: string | null;
  customerId: string | null;
  payment: PaymentMethod;
  label?: string;
  confidence: number;
  transcript: string;
  notes: string[];
};

const NUM_WORDS: Record<string, number> = {
  one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, tin: 3, four: 4, char: 4, chaar: 4,
  five: 5, paanch: 5, panch: 5, six: 6, chhe: 6, che: 6, seven: 7, saat: 7, sat: 7,
  eight: 8, aath: 8, ath: 8, nine: 9, nau: 9, ten: 10, das: 10, dus: 10,
  eleven: 11, gyarah: 11, twelve: 12, barah: 12, fifteen: 15, pandrah: 15,
  twenty: 20, bees: 20, bis: 20, twentyfive: 25, pachees: 25,
  thirty: 30, tees: 30, fifty: 50, pachas: 50, pachaas: 50,
  hundred: 100, sau: 100, thousand: 1000, hazaar: 1000, hajar: 1000,
};

const UNIT_WORDS = [
  "bag", "bags", "bori", "boriyan", "bottle", "bottles", "botal", "packet", "packets",
  "pkt", "pack", "packs", "unit", "units", "piece", "pieces", "pcs", "kg", "kilo",
  "litre", "liter", "ltr", "box", "boxes", "dabba", "tin", "tins",
];

const EXPENSE_WORDS = [
  "rent", "kiraya", "salary", "tankhwah", "electricity", "bijli", "bill", "transport",
  "tempo", "diesel", "petrol", "chai", "expense", "kharcha", "kharch", "maintenance",
  "repair", "internet", "recharge", "loan", "emi", "wages",
];

const STOCK_WORDS = [
  "added to stock", "add to stock", "stock me", "stock mein", "restock", "stock add",
  "purchased", "purchase", "khareeda", "kharida", "received", "aaya", "aayi", "aya",
  "inward", "godown", "supplier se", "stock badhao", "into stock", "in stock",
];

const SALE_WORDS = ["sold", "sale", "becha", "bech", "diya", "de diya", "bik", "bikri", "customer"];

const UDHAR_WORDS = ["udhar", "udhaar", "credit", "khata", "baaki", "baki", "pending", "due"];

const STOPWORDS = new Set([
  "the", "a", "of", "for", "to", "and", "with", "sold", "sale", "add", "added", "stock",
  "rupees", "rupee", "rs", "paid", "pay", "cash", "upi", "credit", "udhar", "udhaar",
  "please", "ji", "bhai", "ko", "se", "me", "mein", "hai", "kar", "do", "diya", "total",
  ...UNIT_WORDS,
]);

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[₹]/g, " rupees ")
    .replace(/[^a-z0-9.,\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordsToNumber(token: string): number | null {
  if (/^\d+(\.\d+)?$/.test(token)) return parseFloat(token);
  if (NUM_WORDS[token] !== undefined) return NUM_WORDS[token];
  return null;
}

/** "5000", "5 hazaar", "1200 rupees", "twelve hundred" */
function extractAmount(tokens: string[]): number | null {
  const candidates: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const n = wordsToNumber((tokens[i] ?? "").replace(/,/g, ""));
    if (n === null) continue;
    let value = n;
    const next = tokens[i + 1];
    if (next && (NUM_WORDS[next] === 100 || NUM_WORDS[next] === 1000)) {
      value = n * NUM_WORDS[next];
      i++;
    }
    const after = tokens[i + 1];
    const before = tokens[i - 1];
    const isMoney =
      (after && /^(rupees?|rs|rupaye|rupaiya|ka|rupay)$/.test(after)) ||
      (before && /^(rupees?|rs|for|of|at|price|amount|worth)$/.test(before)) ||
      value >= 100;
    if (isMoney) candidates.push(value);
  }
  if (!candidates.length) return null;
  return Math.max(...candidates);
}

function detectPayment(text: string): PaymentMethod {
  if (/\b(upi|gpay|google pay|phonepe|phone pay|paytm|online|scan|qr)\b/.test(text)) return "upi";
  if (/\b(udhar|udhaar|credit|khata|baaki|baki|due|pending|likh do|likh lo)\b/.test(text)) return "credit";
  if (/\b(cash|nakad|nagad|cash paid)\b/.test(text)) return "cash";
  return "cash";
}

function matchProducts(tokens: string[], products: Product[]) {
  const scored = products.map((p) => {
    const bag = new Set(
      [...p.aliases, ...p.name.toLowerCase().split(/\s+/)].flatMap((a) => a.split(/\s+/)),
    );
    let score = 0;
    tokens.forEach((t) => {
      if (t.length < 3) return;
      if (bag.has(t)) score += 2;
      else if ([...bag].some((b) => b.length > 3 && (b.startsWith(t) || t.startsWith(b)))) score += 1;
    });
    return { product: p, score };
  });
  return scored.filter((s) => s.score >= 2).sort((a, b) => b.score - a.score);
}

function qtyNear(tokens: string[], product: Product): number {
  const bag = new Set(
    [...product.aliases, ...product.name.toLowerCase().split(/\s+/)].flatMap((a) => a.split(/\s+/)),
  );
  const idxs: number[] = [];
  tokens.forEach((t, i) => {
    if (bag.has(t)) idxs.push(i);
  });
  const anchor = idxs.length ? idxs[0]! : 0;
  let best: { q: number; d: number } | null = null;
  tokens.forEach((t, i) => {
    const n = wordsToNumber(t.replace(/,/g, ""));
    if (n === null || n <= 0) return;
    const next = tokens[i + 1] ?? "";
    const prev = tokens[i - 1] ?? "";
    const isUnitQty = UNIT_WORDS.includes(next) || bag.has(next) || bag.has(prev);
    const looksLikeMoney =
      /^(rupees?|rs|rupaye|rupay)$/.test(next) || /^(rupees?|rs|for)$/.test(prev) || n >= 100;
    if (looksLikeMoney && !isUnitQty) return;
    const d = Math.abs(i - anchor) - (isUnitQty ? 5 : 0);
    if (!best || d < best.d) best = { q: n, d };
  });
  return best ? (best as { q: number }).q : 1;
}

function extractCustomer(
  raw: string,
  tokens: string[],
  customers: Customer[],
): { name: string | null; id: string | null } {
  const lower = raw.toLowerCase();
  for (const c of customers) {
    if (c.aliases.some((a) => lower.includes(a))) return { name: c.name, id: c.id };
  }
  const jiMatch = tokens.find((t) => t.length > 4 && t.endsWith("ji"));
  if (jiMatch) {
    const clean = jiMatch.slice(0, -2);
    return { name: clean.charAt(0).toUpperCase() + clean.slice(1), id: null };
  }
  const to = raw.match(/\b(?:to|for|ko)\s+([A-Z][a-z]+)\b/);
  if (to && to[1]) return { name: to[1], id: null };
  return { name: null, id: null };
}

export function parseCommand(
  transcript: string,
  products: Product[],
  customers: Customer[],
): ParseResult {
  const raw = transcript.trim();
  const text = normalize(raw);
  const tokens = text.split(" ").filter(Boolean);
  const notes: string[] = [];
  const payment = detectPayment(text);
  const amount = extractAmount(tokens);
  const cust = extractCustomer(raw, tokens, customers);
  const matches = matchProducts(tokens, products);

  const isStock = STOCK_WORDS.some((w) => text.includes(w));
  const isExpense =
    EXPENSE_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(text)) && matches.length === 0;
  const isUdharTopUp =
    matches.length === 0 &&
    UDHAR_WORDS.some((w) => text.includes(w)) &&
    amount !== null &&
    !isExpense;

  if (isExpense) {
    const label =
      EXPENSE_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(text))
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" / ") || "Expense";
    return {
      intent: "QUICK_EXPENSE",
      items: [],
      amount,
      customer: null,
      customerId: null,
      payment: payment === "credit" ? "cash" : payment,
      label,
      confidence: amount ? 0.9 : 0.5,
      transcript: raw,
      notes: amount ? notes : ["Amount not detected"],
    };
  }

  if (isUdharTopUp) {
    return {
      intent: "ADD_UDHAR",
      items: [],
      amount,
      customer: cust.name,
      customerId: cust.id,
      payment: "credit",
      label: "Udhar entry",
      confidence: cust.name && amount ? 0.9 : 0.5,
      transcript: raw,
      notes: cust.name ? notes : ["Customer not recognised"],
    };
  }

  if (!matches.length) {
    return {
      intent: "UNKNOWN",
      items: [],
      amount,
      customer: cust.name,
      customerId: cust.id,
      payment,
      confidence: 0.2,
      transcript: raw,
      notes: ["Could not identify any product. Try naming the item, e.g. 'Tata Salt 5 packets'."],
    };
  }

  const top = matches.slice(0, 2).filter((m, i) => i === 0 || m.score >= matches[0]!.score);
  const items: ParsedItem[] = top.map((m) => ({
    productId: m.product.id,
    name: m.product.name,
    qty: qtyNear(tokens, m.product),
    unit: m.product.unit,
    unitPrice: m.product.price,
  }));

  const computed = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  let finalAmount = amount;
  if (amount === null) {
    finalAmount = computed;
    notes.push("Amount inferred from catalogue price");
  } else if (Math.abs(amount - computed) > computed * 0.6 && computed > 0) {
    notes.push(`Spoken amount ₹${amount} differs from catalogue ₹${computed}`);
  }

  const saleHinted = SALE_WORDS.some((w) => text.includes(w));

  return {
    intent: isStock ? "ADD_STOCK" : "ADD_SALE",
    items,
    amount: finalAmount,
    customer: cust.name,
    customerId: cust.id,
    payment,
    confidence: Math.min(0.98, 0.6 + matches[0]!.score * 0.08 + (saleHinted ? 0.1 : 0) + (amount ? 0.1 : 0)),
    transcript: raw,
    notes,
  };
}

export const PRESETS = [
  {
    id: "preset1",
    label: "Fortune Atta Sale",
    hint: "Credit sale to Rameshji",
    text: "Rameshji, Fortune Atta 5 bags, 1200 rupees, UPI paid",
  },
  {
    id: "preset2",
    label: "Oil Sale · Cash",
    hint: "2 bottles Sunlite",
    text: "Sold 2 bottles of Fortune Sunlite Oil for 360 cash",
  },
  {
    id: "preset3",
    label: "Low Stock Trigger",
    hint: "Amul Butter runs out",
    text: "Sold 1 Amul Butter for 58 cash",
  },
  {
    id: "preset4",
    label: "Stock Inward",
    hint: "Tata Salt restock",
    text: "Tata Salt 10 packets added to stock",
  },
  {
    id: "preset5",
    label: "Quick Expense",
    hint: "Shop rent",
    text: "Paid shop rent 5000 cash",
  },
  {
    id: "preset6",
    label: "Udhar Entry",
    hint: "Suresh khata",
    text: "Add 150 rupees udhar to Suresh",
  },
];
