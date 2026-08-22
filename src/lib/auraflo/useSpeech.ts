import { useCallback, useEffect, useRef, useState } from "react";

type SpeechStatus = "idle" | "listening" | "processing" | "error";

type Options = {
  lang: string;
  onFinal: (text: string) => void;
};

/* Minimal typings — Web Speech API is not in the TS DOM lib for all targets. */
type SRAlternative = { transcript: string; confidence: number };
type SRResult = { isFinal: boolean; length: number; [i: number]: SRAlternative };
type SREvent = { resultIndex: number; results: { length: number; [i: number]: SRResult } };
type SRInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getRecognitionCtor(): (new () => SRInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SRInstance) | null;
}

/** Common ASR slips for Indian kirana vocabulary. */
const CORRECTIONS: [RegExp, string][] = [
  [/\bfortunate?\b/gi, "Fortune"],
  [/\bfor tune\b/gi, "Fortune"],
  [/\bsunlight\b/gi, "Sunlite"],
  [/\bsun light\b/gi, "Sunlite"],
  [/\bsun lite\b/gi, "Sunlite"],
  [/\bata\b/gi, "atta"],
  [/\baata\b/gi, "atta"],
  [/\btata sold\b/gi, "Tata Salt"],
  [/\bthata\b/gi, "Tata"],
  [/\bamool\b/gi, "Amul"],
  [/\ba mul\b/gi, "Amul"],
  [/\bruppees?\b/gi, "rupees"],
  [/\brupay(?:a|e)?\b/gi, "rupees"],
  [/\byou pi\b/gi, "UPI"],
  [/\bu p i\b/gi, "UPI"],
  [/\bg pay\b/gi, "UPI"],
  [/\bphone pay\b/gi, "UPI"],
  [/\bood?har\b/gi, "udhar"],
  [/\bodour\b/gi, "udhar"],
  [/\bbags? of\b/gi, "bags"],
];

export function cleanTranscript(text: string) {
  let out = " " + text.trim() + " ";
  CORRECTIONS.forEach(([re, to]) => {
    out = out.replace(re, to);
  });
  return out.replace(/\s+/g, " ").trim();
}

export function useSpeech({ lang, onFinal }: Options) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SRInstance | null>(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    finalRef.current = "";
    setInterim("");
    setError(null);

    rec.onstart = () => setStatus("listening");
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        // Pick the alternative that mentions catalogue-ish vocabulary when possible.
        let best = res[0]?.transcript ?? "";
        for (let a = 1; a < res.length; a++) {
          const alt = res[a]?.transcript ?? "";
          const score = (s: string) =>
            (/fortune|atta|sunlite|tata|salt|amul|butter|udhar|upi|rupees/i.test(s) ? 2 : 0) +
            (/\d/.test(s) ? 1 : 0);
          if (score(alt) > score(best)) best = alt;
        }
        if (res.isFinal) finalRef.current += best + " ";
        else live += best;
      }
      setInterim(cleanTranscript(finalRef.current + live));
    };
    rec.onerror = (e) => {
      setStatus("error");
      setError(
        e.error === "not-allowed"
          ? "Microphone blocked. Allow mic access or use the type-instead mode."
          : e.error === "no-speech"
            ? "Didn't hear anything. Try again."
            : `Speech error: ${e.error}`,
      );
    };
    rec.onend = () => {
      const text = cleanTranscript(finalRef.current);
      if (text) {
        setStatus("processing");
        setInterim(text);
        window.setTimeout(() => {
          onFinalRef.current(text);
          setStatus("idle");
          setInterim("");
        }, 650);
      } else {
        setStatus((s) => (s === "error" ? "error" : "idle"));
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setStatus("idle");
    }
  }, [lang]);

  useEffect(() => () => recRef.current?.abort(), []);

  const runManual = useCallback((text: string) => {
    setStatus("processing");
    setInterim(text);
    window.setTimeout(() => {
      onFinalRef.current(cleanTranscript(text));
      setStatus("idle");
      setInterim("");
    }, 600);
  }, []);

  return { supported, status, interim, error, start, stop, runManual };
}
