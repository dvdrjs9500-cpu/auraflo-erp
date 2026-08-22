export type PaymentMethod = "upi" | "cash" | "credit";

export type Product = {
  id: string;
  name: string;
  shortName: string;
  unit: string;
  unitPlural: string;
  stock: number;
  price: number;
  gst: number;
  hsn: string;
  reorderLevel: number;
  aliases: string[];
};

export type TxnLine = {
  productId: string;
  name: string;
  hsn: string;
  qty: number;
  unit: string;
  unitPrice: number;
  gst: number;
};

export type Txn = {
  id: string;
  invoiceNo: string;
  kind: "sale" | "stock" | "expense" | "udhar";
  customer: string;
  lines: TxnLine[];
  label?: string;
  amount: number;
  payment: PaymentMethod;
  at: number;
  transcript: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  balance: number;
  aliases: string[];
};

export const SHOP = {
  name: "Jai Shri Ganesh Kirana",
  gstin: "08AABCU9603R1ZM",
  address: "Shop 14, Sadar Bazaar, Jaipur, Rajasthan 302001",
  phone: "+919876543210",
  supplier: "919876500011",
};

export const SEED_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Fortune Atta 5kg",
    shortName: "Fortune Atta",
    unit: "bag",
    unitPlural: "bags",
    stock: 7,
    price: 240,
    gst: 5,
    hsn: "1101",
    reorderLevel: 3,
    aliases: ["fortune", "atta", "aata", "flour", "gehu", "fortune atta"],
  },
  {
    id: "p2",
    name: "Fortune Sunlite Oil 1L",
    shortName: "Sunlite Oil",
    unit: "bottle",
    unitPlural: "bottles",
    stock: 15,
    price: 180,
    gst: 5,
    hsn: "1512",
    reorderLevel: 5,
    aliases: ["sunlite", "sunlight", "oil", "tel", "refined", "sunflower", "fortune oil"],
  },
  {
    id: "p3",
    name: "Tata Salt 1kg",
    shortName: "Tata Salt",
    unit: "packet",
    unitPlural: "packets",
    stock: 25,
    price: 28,
    gst: 0,
    hsn: "2501",
    reorderLevel: 10,
    aliases: ["tata", "salt", "namak", "tata salt"],
  },
  {
    id: "p4",
    name: "Amul Butter 100g",
    shortName: "Amul Butter",
    unit: "unit",
    unitPlural: "units",
    stock: 2,
    price: 58,
    gst: 12,
    hsn: "0405",
    reorderLevel: 5,
    aliases: ["amul", "butter", "makhan", "amul butter"],
  },
];

export const SEED_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Suresh Sharma", phone: "919876543211", balance: 450, aliases: ["suresh", "sureshji"] },
  { id: "c2", name: "Ramesh Gupta", phone: "919876543212", balance: 0, aliases: ["ramesh", "rameshji"] },
  { id: "c3", name: "Lakshmi Devi", phone: "919876543213", balance: 220, aliases: ["lakshmi", "laxmi", "lakshmiji"] },
  { id: "c4", name: "Mohan Verma", phone: "919876543214", balance: 0, aliases: ["mohan", "mohanji"] },
];

export const rupees = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
