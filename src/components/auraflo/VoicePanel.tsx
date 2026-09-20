import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Mic, Keyboard, Loader2, Send, Square, Zap } from "lucide-react";
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
  const [paymentState, setPaymentState] = useState<"Idle" | "Completed" | "Credit" | "Pending">(
    "Idle",
  );
  const [billAmount, setBillAmount] = useState(0);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [pendingCreditTranscript, setPendingCreditTranscript] = useState<string | null>(null);
  const [pendingUpiTranscript, setPendingUpiTranscript] = useState<string | null>(null);

  const finalizeUpiPayment = useCallback(() => {
    if (!pendingUpiTranscript) return;
    const out = execute(pendingUpiTranscript);
    setPendingUpiTranscript(null);
    setPaymentState("Completed");
    setPaymentMessage("Payment received successfully.");
    if (out.txn?.kind === "sale") {
      setBillAmount(out.txn.amount);
      openInvoice(out.txn);
    }
  }, [execute, openInvoice, pendingUpiTranscript]);

  useEffect(() => {
    if (paymentState !== "Pending" || !pendingUpiTranscript) return;
    const timeout = window.setTimeout(finalizeUpiPayment, 5000);
    return () => window.clearTimeout(timeout);
  }, [finalizeUpiPayment, paymentState, pendingUpiTranscript]);

  useEffect(() => {
    if (!paymentMessage || paymentState === "Pending") return;
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
    if (paymentState === "Pending") return;
    const normalized = text
      .toLowerCase()
      .replace(/[.,!?]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // The next utterance after "kadan" is the customer name. Do this before
    // checking payment keywords so a name like "Cash" cannot change the flow.
    if (pendingCreditTranscript) {
      const customerName = text.trim();
      if (!customerName) return;
      const out = execute(`${pendingCreditTranscript} ${customerName}`);
      setPendingCreditTranscript(null);
      setPaymentState("Credit");
      setPaymentMessage(`Credit recorded for ${customerName}.`);
      if (out.txn?.kind === "sale") {
        setBillAmount(out.txn.amount);
        openInvoice(out.txn);
      }
      return;
    }

    const isCash = /(?:^|\s)(?:kaasu kooduthaaru|kaasu|cash)(?:$|\s)/i.test(normalized);
    const isCredit = /(?:^|\s)kadan(?:$|\s)/i.test(normalized);
    const isUpi =
      /(?:^|\s)(?:waiting to pay|wait(?:ing)? to pay|upi|gpay|google pay|phonepe|paytm|scan|scan pannunga|scan pannu)(?:$|\s)/i.test(
        normalized,
      );

    // Parse the sale when possible, but payment commands must also work when
    // the utterance contains only "cash", "kadan", or "upi".
    const parsed = preview(text);
    const amount = parsed.amount && parsed.amount > 0 ? parsed.amount : billAmount;
    if (amount > 0) setBillAmount(amount);

    if (isCredit) {
      setPendingCreditTranscript(text);
      setPaymentState("Credit");
      setPaymentMessage("Yaaruku kadan?");
      return;
    }

    if (isCash) {
      const out = execute(text);
      setPaymentState("Completed");
      setPaymentMessage("Payment completed successfully.");
      sendWhatsAppInvoice();
      if (out.txn?.kind === "sale") openInvoice(out.txn);
    } else if (isUpi) {
      if (amount <= 0) {
        setPaymentMessage("Please say the items and bill amount before choosing UPI.");
        return;
      }
      setPendingUpiTranscript(text);
      setPaymentState("Pending");
      setPaymentMessage("Scan the QR code to complete payment.");
    } else {
      const out = execute(text);
      if (out.txn?.kind === "sale") openInvoice(out.txn);
    }
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

        {(paymentMessage || paymentState !== "Idle") && !listening && !processing && (
          <div className="rounded-2xl border bg-card/95 p-3 shadow-lift backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Payment · {paymentState}
                </p>
                <p className="mt-1 text-sm font-semibold">{paymentMessage}</p>
              </div>
              {paymentState === "Completed" && (
                <span
                  className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent animate-in zoom-in duration-500"
                  aria-label="Completed"
                >
                  <CheckCircle2 className="size-7 animate-in zoom-in duration-700" />
                </span>
              )}
            </div>
            {paymentState === "Credit" && pendingCreditTranscript && (
              <p className="mt-2 text-xs text-muted-foreground">Yaaruku kadan?</p>
            )}
            {paymentState === "Pending" && billAmount > 0 && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted p-3 animate-in slide-in-from-bottom-2 duration-300">
                <div
                  className="grid size-24 shrink-0 grid-cols-5 gap-0.5 rounded-lg bg-white p-2 shadow-sm"
                  role="img"
                  aria-label={`UPI QR code for ₹${billAmount.toFixed(2)}`}
                >
                  {Array.from({ length: 25 }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "rounded-[1px]",
                        (index * 7 + billAmount) % 5 < 2 ? "bg-black" : "bg-white",
                      )}
                    />
                  ))}
                </div>
                <div className="min-w-0 text-xs">
                  <p className="font-semibold">Scan to pay ₹{billAmount.toFixed(2)}</p>
                  <p className="mt-1 break-all text-muted-foreground">
                    upi://pay?pa=myupi@bank&pn=Auraflo&am={billAmount.toFixed(2)}&cu=INR
                  </p>
                  <Button size="sm" className="mt-2" onClick={completeUpiPayment}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {presetsOpen && !listening && paymentState !== "Pending" && (
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
              placeholder="Type: Murugan, Ponni rice 2 mootai, 2900 rupees, UPI paid"
              disabled={paymentState === "Pending"}
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
              disabled={processing || paymentState === "Pending"}
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
            சொல்லுங்க: “முருகன், பொன்னி அரிசி 2 மூட்டை, 2900 ரூபாய், UPI” · Tamil, Tanglish &
            English supported
          </p>
        )}
      </div>
    </div>
  );
}
