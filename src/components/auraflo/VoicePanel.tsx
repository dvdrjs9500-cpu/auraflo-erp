import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Mic, Keyboard, Loader2, Send, Square, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuraflo } from "@/lib/auraflo/store";
import { useSpeech } from "@/lib/auraflo/useSpeech";
import { PRESETS } from "@/lib/auraflo/parser";

const LANGS = [
  { code: "ta-IN", label: "தமிழ்" },
  { code: "en-IN", label: "EN" },
  { code: "hi-IN", label: "हिं" },
];

export function VoicePanel() {
  const { execute, openInvoice, preview } = useAuraflo();
  const [lang, setLang] = useState("ta-IN");
  const [transcript, setTranscript] = useState("");
  const [paymentState, setPaymentState] = useState<
    "idle" | "payment_selection" | "completed" | "credit" | "pending_upi"
  >("idle");
  const [billAmount, setBillAmount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [pendingCreditTranscript, setPendingCreditTranscript] = useState<string | null>(null);
  // Holds the parsed sale utterance while the cashier picks Cash or UPI on the touch screen.
  const [pendingSaleTranscript, setPendingSaleTranscript] = useState<string | null>(null);
  const [pendingUpiTranscript, setPendingUpiTranscript] = useState<string | null>(null);
  const [upiPhase, setUpiPhase] = useState<"qr" | null>(null);
  // Drives the shared "payment successful" tick screen for BOTH cash and UPI completions.
  const [successPhase, setSuccessPhase] = useState<"cash" | "upi" | null>(null);
  const [completedTxn, setCompletedTxn] = useState<ReturnType<typeof execute>["txn"]>(null);

  const finalizeUpiPayment = useCallback(() => {
    if (!pendingUpiTranscript || upiPhase !== "qr") return;
    const out = execute(pendingUpiTranscript);
    setPendingUpiTranscript(null);
    setCompletedTxn(out.txn?.kind === "sale" ? out.txn : null);
    setPaymentState("completed");
    setPaymentMessage("Payment received successfully.");
    setUpiPhase(null);
    setSuccessPhase("upi");
    if (out.txn?.kind === "sale") setBillAmount(out.txn.amount);
  }, [execute, pendingUpiTranscript, upiPhase]);

  // Single reset path for a finished transaction (cash OR upi): show the tick,
  // then open the invoice, then fully clear state — including the transcript,
  // which is what was causing the render loop before.
  useEffect(() => {
    if (!successPhase) return;

    const timeout = window.setTimeout(() => {
      if (completedTxn?.kind === "sale") openInvoice(completedTxn);
      setSuccessPhase(null);
      setUpiPhase(null);
      setPaymentState("idle");
      setPaymentMessage("");
      setPendingUpiTranscript(null);
      setPendingSaleTranscript(null);
      setCompletedTxn(null);
      setTranscript("");
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [completedTxn, openInvoice, successPhase]);

  useEffect(() => {
    if (paymentState !== "pending_upi" || !pendingUpiTranscript || upiPhase !== "qr") return;
    const timeout = window.setTimeout(finalizeUpiPayment, 5000);
    return () => window.clearTimeout(timeout);
  }, [finalizeUpiPayment, paymentState, pendingUpiTranscript, upiPhase]);

  // Credit doesn't go through the tick screen, so give it its own reset once
  // the customer name has been captured, otherwise the panel would stay
  // stuck on "credit" and ignore all further voice input.
  useEffect(() => {
    if (paymentState !== "credit" || pendingCreditTranscript) return;
    const timeout = window.setTimeout(() => {
      setPaymentState("idle");
      setPaymentMessage("");
      setTranscript("");
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [paymentState, pendingCreditTranscript]);

  useEffect(() => {
    if (paymentState !== "completed") return;
    const utterance = new SpeechSynthesisUtterance("Virpanai pathivu seiyapattadhu");
    utterance.lang = "ta-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [paymentState]);

  useEffect(() => {
    if (!paymentMessage || paymentState === "pending_upi") return;
    const timeout = window.setTimeout(() => setPaymentMessage(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [paymentMessage, paymentState]);

  const sendWhatsAppInvoice = () => {
    // Placeholder for the production WhatsApp invoice integration.
  };
  const [typed, setTyped] = useState("");
  const [typeMode, setTypeMode] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(true);

  const handle = (text: string) => {
    // Block new voice input while a transaction is mid-flight (payment
    // selection, QR pending, or just completed) — except while we're
    // actively waiting for a spoken customer name for a credit sale.
    if (paymentState !== "idle" && !pendingCreditTranscript) return;

    setTranscript(text);
    const normalized = text
      // Web Speech API results can carry zero-width spaces/joiners, BOM, and
      // other invisible Unicode formatting chars that make word-boundary
      // regexes silently fail even though the text "looks" fine on screen.
      .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[.,!?]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // The next utterance after "kadan" is the customer name. Do this before
    // anything else so a name can't be mistaken for another command.
    if (pendingCreditTranscript) {
      const spokenCustomerName = text.trim();
      if (!spokenCustomerName) return;
      setCustomerName(spokenCustomerName);
      const out = execute(`${pendingCreditTranscript} ${spokenCustomerName}`);
      setPendingCreditTranscript(null);
      setPaymentState("credit");
      setPaymentMessage(`Credit recorded for ${spokenCustomerName}.`);
      if (out.txn?.kind === "sale") {
        setBillAmount(out.txn.amount);
        openInvoice(out.txn);
      }
      return;
    }

    // Ruthless on purpose: word-boundary regexes are too easy to defeat with
    // stray Unicode from the speech recognizer. `normalized` is already
    // lowercased and stripped of invisible characters above, so a plain
    // substring match is both simpler and more reliable here.
    const isCredit = normalized.includes("kadan");
    if (isCredit) {
      setPendingCreditTranscript(text);
      setPaymentState("credit");
      setPaymentMessage("Yaaruku kadan?");
      return;
    }

    // Voice only handles parsing the sale now — payment method is always a
    // touch choice, so we never listen for "cash" / "upi" / "gpay" here.
    const parsed = preview(text);
    const amount = parsed.amount ?? 0;

    if (amount > 0) {
      setBillAmount(amount);
      setPendingSaleTranscript(text);
      setPaymentState("payment_selection");
      return;
    }

    // Not a sale and not a payment/credit command — let it fall through to
    // whatever other command handling `execute` supports.
    const out = execute(text);
    if (out.txn?.kind === "sale") openInvoice(out.txn);
  };

  const handleReadyCash = () => {
    if (!pendingSaleTranscript) return;
    const out = execute(pendingSaleTranscript);
    setPendingSaleTranscript(null);
    setCompletedTxn(out.txn?.kind === "sale" ? out.txn : null);
    if (out.txn?.kind === "sale") setBillAmount(out.txn.amount);
    setPaymentState("completed");
    setPaymentMessage("Payment completed successfully.");
    sendWhatsAppInvoice();
    setSuccessPhase("cash");
  };

  const handleUpiSelect = () => {
    if (!pendingSaleTranscript) return;
    setPendingUpiTranscript(pendingSaleTranscript);
    setPendingSaleTranscript(null);
    setUpiPhase("qr");
    setPaymentState("pending_upi");
    setPaymentMessage("Scan the QR code to complete payment.");
  };

  const completeUpiPayment = () => {
    finalizeUpiPayment();
  };

  const { supported, status, interim, error, start, stop, runManual } = useSpeech({
    lang,
    onFinal: handle,
  });

  const listening = status === "listening";
  const processing = status === "processing";

  const submitTyped = () => {
    const t = typed.trim();
    if (!t) return;
    setTyped("");
    runManual(t);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center px-3 pb-2">
      <div className="pointer-events-auto w-full max-w-md space-y-2">
        {(listening || processing || interim) && (
          <div className="rounded-2xl border bg-card/95 p-3 shadow-lift backdrop-blur">
            <div className="flex items-center gap-2">
              {listening ? (
                <div className="flex items-end gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="eq-bar h-4 w-1 rounded-full bg-destructive"
                      style={{ animationDelay: `${i * 110}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <Loader2 className="size-4 animate-spin text-primary" />
              )}
              <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {listening ? "கேட்கிறேன் · Listening…" : "புரிந்துகொள்கிறேன் · Processing…"}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-snug font-medium">
              {interim || <span className="text-muted-foreground">இப்போ பேசுங்க…</span>}
            </p>
          </div>
        )}

        {error && !listening && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        {(paymentMessage || paymentState !== "idle") &&
          !listening &&
          !processing &&
          paymentState !== "pending_upi" &&
          paymentState !== "payment_selection" &&
          !upiPhase &&
          !successPhase && (
            <div className="rounded-2xl border bg-card/95 p-3 shadow-lift backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Payment · {paymentState}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{paymentMessage}</p>
                </div>
              </div>
              {paymentState === "credit" && pendingCreditTranscript && (
                <p className="mt-2 text-xs text-muted-foreground">Yaaruku kadan?</p>
              )}
            </div>
          )}

        {paymentState === "payment_selection" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Choose payment method"
          >
            <div className="w-full max-w-sm rounded-3xl border bg-card p-6 text-center shadow-2xl">
              <p className="text-sm text-muted-foreground">Bill amount</p>
              <p className="mt-1 text-3xl font-bold">₹{billAmount.toFixed(2)}</p>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  onClick={handleReadyCash}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-5 text-lg font-bold text-primary-foreground shadow-lift transition-transform active:scale-95"
                >
                  💵 Ready Cash
                </button>
                <button
                  onClick={handleUpiSelect}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary-soft py-5 text-lg font-bold text-primary shadow-soft transition-transform active:scale-95"
                >
                  📱 UPI / GPay
                </button>
              </div>
            </div>
          </div>
        )}

        {paymentState === "pending_upi" && upiPhase === "qr" && billAmount > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Google Pay payment"
          >
            <div className="w-full max-w-sm rounded-3xl border bg-card p-5 text-center shadow-2xl">
              <p className="text-lg font-bold">Google Pay</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Scan to pay ₹{billAmount.toFixed(2)}
              </p>
              <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-4 shadow-inner">
                <QRCodeSVG
                  value={`upi://pay?pa=myupi@bank&pn=Auraflo&am=${billAmount.toFixed(2)}&cu=INR`}
                  size={250}
                  level="M"
                  includeMargin
                  aria-label={`UPI QR code for ₹${billAmount.toFixed(2)}`}
                />
              </div>
              <p className="mt-3 break-all text-[10px] text-muted-foreground">
                UPI: myupi@bank · Amount locked at ₹{billAmount.toFixed(2)}
              </p>
              <Button className="mt-4 w-full" onClick={completeUpiPayment}>
                Done
              </Button>
            </div>
          </div>
        )}

        {successPhase && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <div className="w-full max-w-sm rounded-3xl border bg-card p-8 text-center shadow-2xl">
              <CheckCircle2
                className="mx-auto size-28 text-accent animate-in zoom-in duration-700"
                strokeWidth={1.5}
              />
              <p className="mt-4 text-xl font-bold text-accent">Payment successful</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ₹{billAmount.toFixed(2)} received
              </p>
            </div>
          </div>
        )}

        {presetsOpen &&
          !listening &&
          paymentState !== "pending_upi" &&
          paymentState !== "payment_selection" && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => runManual(p.text)}
                  className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-left text-[11px] font-semibold shadow-soft transition-colors hover:border-primary hover:bg-primary-soft"
                >
                  <Zap className="mr-1 inline size-3 text-primary" />
                  {p.label}
                </button>
              ))}
            </div>
          )}

        {typeMode || !supported ? (
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-lift">
            <Input
              value={typed}
              autoFocus
              placeholder="Type: Murugan, Ponni rice 2 mootai, 2900 rupees"
              disabled={paymentState === "pending_upi" || paymentState === "payment_selection"}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  submitTyped();
                }
              }}
              className="h-10 border-0 text-sm shadow-none focus-visible:ring-0"
            />
            <Button size="icon" className="size-10 shrink-0" onClick={submitTyped}>
              <Send className="size-4" />
            </Button>
            {supported && (
              <Button
                size="icon"
                variant="ghost"
                className="size-10 shrink-0"
                onClick={() => setTypeMode(false)}
              >
                <Mic className="size-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card/95 px-3 py-2.5 shadow-lift backdrop-blur">
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors",
                      lang === l.code
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPresetsOpen((v) => !v)}
                className="text-[10px] font-semibold text-muted-foreground"
              >
                {presetsOpen ? "Hide presets" : "Show presets"}
              </button>
            </div>

            <button
              onClick={() => (listening ? stop() : start())}
              disabled={
                processing || paymentState === "pending_upi" || paymentState === "payment_selection"
              }
              aria-label={listening ? "Stop listening" : "Tap to speak"}
              className={cn(
                "relative flex size-20 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-lift transition-transform active:scale-95",
                listening ? "mic-ring-hot bg-primary" : "mic-ring bg-primary",
              )}
            >
              {listening && (
                <span className="pointer-events-none absolute inset-[-10px] flex items-center justify-center gap-1 rounded-full border-2 border-primary/60">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <span
                      key={i}
                      className="eq-bar h-5 w-1 rounded-full bg-primary"
                      style={{ animationDelay: `${i * 90}ms` }}
                    />
                  ))}
                </span>
              )}
              {processing ? (
                <Loader2 className="size-7 animate-spin" />
              ) : listening ? (
                <Square className="size-5 fill-current" />
              ) : (
                <Mic className="size-8" />
              )}
            </button>

            <div className="flex w-24 flex-col items-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px]"
                onClick={() => setTypeMode(true)}
              >
                <Keyboard className="size-3" /> Type
              </Button>
              <span className="text-right text-[9px] leading-tight text-muted-foreground">
                {listening ? "கேட்கிறேன்…" : "பேச தட்டவும்"}
              </span>
            </div>
          </div>
        )}

        {!listening && !processing && !interim && (
          <p className="px-2 text-center text-[10px] text-muted-foreground">
            சொல்லுங்க: “முருகன், பொன்னி அரிசி 2 மூட்டை, 2900 ரூபாய்” · Tamil, Tanglish & English
            supported — then tap Cash or UPI
          </p>
        )}
      </div>
    </div>
  );
}
