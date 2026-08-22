# Kirana Flow

Build a high-fidelity, mobile-first web app prototype for "Auraflo" — a voice-native ERP designed for Indian MSME kirana shopkeepers. The app must be fully interactive, responsive, and styled with clean Tailwind CSS using a modern indigo/emerald dark/light-neutral palette.

### 1. CORE FUNCTIONALITY & VOICE ENGINE

- Integrate the Web Speech API (window.webkitSpeechRecognition / window.SpeechRecognition) connected to a prominent central microphone button at the bottom of the screen.

- Provide a clear visual state for the microphone:

  - Idle: "Tap to Speak (Try: 'Rameshji, Fortune Atta 5 bags, 1200 rupees, UPI paid')"

  - Listening: Pulsing red/emerald animation with live real-time transcript displayed on screen.

  - Processing: Brief loading spinner.

  - Success: Success toast with voice feedback summary.

- Support a fallback toggle: If Speech API is unsupported or muted, show a single text input field where the user can type or paste spoken phrases.

### 2. VOICE COMMAND PARSER (MOCK NLU)

Implement a robust frontend intent-parser function that extracts entities from spoken/typed input using keyword and regex matching:

- Action Types: ADD_SALE, ADD_STOCK, QUICK_EXPENSE.

- Sample Test Utterances to handle out-of-the-box:

  1. "Rameshji, Fortune Atta 5 bags, 1200 rupees, UPI paid"

  2. "Sold 2 bottles of Fortune Sunlite Oil for 360 cash"

  3. "Tata Salt 10 packets added to stock"

  4. "Paid shop rent 5000 cash"

### 3. APP DASHBOARD STRUCTURE

Structure the interface into 4 main sections accessible via a bottom navigation bar:

#### A. Voice Home / Today's Ledger (Default Screen)

- Top Bar: Shop Name ("Jai Shri Ganesh Kirana"), Date, Today's Sales Total (₹), and Pending Credit (Udhar) count.

- Dynamic Action Trigger: Central Mic Button.

- Live Feed / Recent Transactions List:

  - Displays newly created sales in real-time.

  - Each item shows: Customer Name/Ref, Product Name, Quantity, Total Amount, Payment Method Badge (UPI/Cash/Credit), Timestamp, and an "Action" button to view invoice.

#### B. Smart Inventory Management

- Pre-populate a realistic database state using React state / Supabase:

  - Fortune Atta 5kg | Stock: 7 bags | Price: ₹240/bag | GST: 5% | Reorder Level: 3

  - Fortune Sunlite Oil 1L | Stock: 15 bottles | Price: ₹180/bot | GST: 5% | Reorder Level: 5

  - Tata Salt 1kg | Stock: 25 packets | Price: ₹28/pkt | GST: 0% | Reorder Level: 10

  - Amul Butter 100g | Stock: 2 units | Price: ₹58/unit | GST: 12% | Reorder Level: 5 (LOW STOCK WARNING ACTIVE)

- When a voice command executes:

  - Automatically update stock counts live.

  - If stock falls at or below Reorder Level, trigger a prominent "Low Stock Warning Banner" with a one-tap "Reorder via WhatsApp" button.

#### C. Instant GST Invoice Modal

When a sale is recognized or clicked from the transaction feed, render an interactive, printable GST Invoice modal:

- Header: Shop GSTIN (e.g., 08AABCU9603R1ZM), Invoice #, Date & Time.

- Line Items Table: Item Name, HSN Code, Qty, Unit Price, Taxable Value, CGST %, SGST %, Total Value.

- Payment Status: Paid (UPI / Cash) or Pending (Udhar).

- Actions: "Share via WhatsApp" (opens whatsapp web/app link with invoice summary text) and "Print Invoice".

#### D. Udhar / Customer Khata (Credit Ledger)

- List customers with pending balances (e.g., "Suresh Sharma: ₹450 pending").

- Include a voice-triggered shortcut: "Add 150 rupees udhar to Suresh".

### 4. PITCH DEMO OVERRIDES & HELPERS

- Add a top floating banner: "Pitch Mode Active".

- Include quick preset prompt buttons above the Mic so judges can click a single button to execute a voice scenario instantly without speaking:

  - [Preset 1: 'Fortune Atta Sale']

  - [Preset 2: 'Oil Sale - Cash']

  - [Preset 3: 'Low Stock Alert Trigger']

read the notes , give a working prototype to pitch in a MSME competition 
use a good color combination , improve speech recognition the most and integrate all outcomes please

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e06fd6f5-6f45-4c09-8a92-0123c3ec124c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
