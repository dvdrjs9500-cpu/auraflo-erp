import { useState } from "react";
import { Mic, Keyboard, Loader2, Send, Square, Zap } from "lucide-react";
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
  const { execute, openInvoice } = useAuraflo();
  const [lang, setLang] = useState("ta-IN");
  const [typed, setTyped] = useState("");
  const [typeMode, setTypeMode] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(true);

  const handle = (text: string) => {
    const out = execute(text);
    if (out.txn && out.txn.kind === "sale") openInvoice(out.txn);
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

        {presetsOpen && !listening && (
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
              disabled={processing}
              aria-label={listening ? "Stop listening" : "Tap to speak"}
              className={cn(
                "relative flex size-20 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-lift transition-transform active:scale-95",
                listening ? "mic-ring-hot bg-primary" : "mic-ring bg-primary",
              )}
            >
              {listening && (
                <span className="pointer-events-none absolute inset-[-10px] flex items-center justify-center gap-1 rounded-full border-2 border-primary/60">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <span key={i} className="eq-bar h-5 w-1 rounded-full bg-primary" style={{ animationDelay: `${i * 90}ms` }} />
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
