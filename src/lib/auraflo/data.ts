export type PaymentMethod = "upi" | "cash" | "credit";

export type Product = {
  id: string;
  name: string;
  tamilName: string;
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
  tamilName: string;
  phone: string;
  balance: number;
  aliases: string[];
};

export const SHOP = {
  name: "Sri Vinayaga Stores",
  tamilName: "ஸ்ரீ விநாயகா ஸ்டோர்ஸ்",
  gstin: "33AABCU9603R1ZM",
  address: "No. 14, Gandhipuram Main Road, Coimbatore, Tamil Nadu 641012",
  phone: "+919843012345",
  supplier: "919843000011",
  state: "Tamil Nadu (33)",
};

export const SEED_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Ponni Boiled Rice 25kg",
    tamilName: "பொன்னி புழுங்கல் அரிசி 25கிலோ",
    shortName: "Ponni Rice",
    unit: "bag",
    unitPlural: "bags",
    stock: 9,
    price: 1450,
    gst: 5,
    hsn: "1006",
    reorderLevel: 3,
    aliases: ["ponni", "rice", "arisi", "அரிசி", "பொன்னி", "puzhungal", "boiled rice", "mootai"],
  },
  {
    id: "p2",
    name: "Idhayam Sesame Oil 1L",
    tamilName: "இதயம் நல்லெண்ணெய் 1லி",
    shortName: "Idhayam Oil",
    unit: "bottle",
    unitPlural: "bottles",
    stock: 12,
    price: 320,
    gst: 5,
    hsn: "1515",
    reorderLevel: 4,
    aliases: [
      "idhayam",
      "idayam",
      "sesame",
      "nallennai",
      "nalla ennai",
      "ennai",
      "எண்ணெய்",
      "நல்லெண்ணெய்",
      "இதயம்",
      "gingelly",
    ],
  },
  {
    id: "p3",
    name: "Aachi Sambar Powder 200g",
    tamilName: "ஆச்சி சாம்பார் பொடி 200கி",
    shortName: "Aachi Sambar",
    unit: "packet",
    unitPlural: "packets",
    stock: 18,
    price: 62,
    gst: 5,
    hsn: "0910",
    reorderLevel: 6,
    aliases: ["aachi", "achi", "sambar", "sambhar", "podi", "ஆச்சி", "சாம்பார்", "பொடி", "masala"],
  },
  {
    id: "p4",
    name: "Tata Salt 1kg",
    tamilName: "டாடா உப்பு 1கிலோ",
    shortName: "Tata Salt",
    unit: "packet",
    unitPlural: "packets",
    stock: 25,
    price: 28,
    gst: 0,
    hsn: "2501",
    reorderLevel: 10,
    aliases: ["tata", "salt", "uppu", "உப்பு", "டாடா", "namak"],
  },
  {
    id: "p5",
    name: "Aavin Butter 100g",
    tamilName: "ஆவின் வெண்ணெய் 100கி",
    shortName: "Aavin Butter",
    unit: "unit",
    unitPlural: "units",
    stock: 2,
    price: 58,
    gst: 12,
    hsn: "0405",
    reorderLevel: 5,
    aliases: ["aavin", "avin", "butter", "vennai", "வெண்ணெய்", "ஆவின்", "amul"],
  },
  {
    id: "p6",
    name: "Fortune Atta 5kg",
    tamilName: "ஃபார்ச்சூன் கோதுமை மாவு 5கிலோ",
    shortName: "Fortune Atta",
    unit: "bag",
    unitPlural: "bags",
    stock: 7,
    price: 240,
    gst: 5,
    hsn: "1101",
    reorderLevel: 3,
    aliases: ["fortune", "atta", "aata", "maavu", "மாவு", "கோதுமை", "godhumai", "flour"],
  },
  {
    id: "p7",
    name: "Fortune Sunlite Oil 1L",
    tamilName: "ஃபார்ச்சூன் சன்லைட் எண்ணெய் 1லி",
    shortName: "Sunlite Oil",
    unit: "bottle",
    unitPlural: "bottles",
    stock: 15,
    price: 180,
    gst: 5,
    hsn: "1512",
    reorderLevel: 5,
    aliases: ["sunlite", "sunlight", "refined", "sunflower", "suriyakanthi", "fortune oil"],
  },
];

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    name: "Murugan Selvam",
    tamilName: "முருகன் செல்வம்",
    phone: "919843012311",
    balance: 450,
    aliases: ["murugan", "muruganna", "muruga", "செல்வம்", "முருகன்"],
  },
  {
    id: "c2",
    name: "Lakshmi Ammal",
    tamilName: "லட்சுமி அம்மாள்",
    phone: "919843012312",
    balance: 220,
    aliases: ["lakshmi", "laxmi", "ammal", "லட்சுமி"],
  },
  {
    id: "c3",
    name: "Karthik Raja",
    tamilName: "கார்த்திக் ராஜா",
    phone: "919843012313",
    balance: 0,
    aliases: ["karthik", "kartik", "raja", "கார்த்திக்"],
  },
  {
    id: "c4",
    name: "Saravanan Kumar",
    tamilName: "சரவணன் குமார்",
    phone: "919843012314",
    balance: 0,
    aliases: ["saravanan", "saravana", "kumar", "சரவணன்"],
  },
  {
    id: "c5",
    name: "Suresh Sharma",
    tamilName: "சுரேஷ் சர்மா",
    phone: "919843012315",
    balance: 0,
    aliases: ["suresh", "sureshji", "சுரேஷ்"],
  },
];

export const rupees = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
