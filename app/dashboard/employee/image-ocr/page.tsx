"use client";

import { useRef, useState, useCallback } from "react";

type ScanState = "idle" | "scanning" | "done" | "error";
type ScanMode = "auto" | "handwriting";

export default function ImageOCRPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanMode, setScanMode] = useState<ScanMode>("auto");
  const [extractedText, setExtractedText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageMime(file.type);
    setExtractedText("");
    setErrorMsg("");
    setScanState("idle");

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
      setImageBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleScan = async () => {
    if (!imageBase64) return;
    setScanState("scanning");
    setExtractedText("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: imageBase64, mimeType: imageMime, mode: scanMode }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? `Request failed (${res.status})`);
        setScanState("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);
          if (payload === "[DONE]") break;
          try {
            const json = JSON.parse(payload);
            const delta: string = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              fullText += delta;
              setExtractedText(fullText);
            }
          } catch {
            // skip malformed SSE chunk
          }
        }
      }

      setScanState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Scan failed.");
      setScanState("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setImageSrc(null);
    setImageBase64("");
    setExtractedText("");
    setErrorMsg("");
    setScanState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5 text-sidebar-primary-foreground">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path strokeLinecap="round" d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">Image Text Scanner</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Extract printed or handwritten English &amp; Sinhala text using AI</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-5">

          {/* ── Mode Toggle ── */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mr-1">Scan Mode</span>
            <button
              onClick={() => setScanMode("auto")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                ${scanMode === "auto"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-sidebar-primary/40"
                }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 shrink-0">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h6" />
              </svg>
              Printed Text
            </button>
            <button
              onClick={() => setScanMode("handwriting")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                ${scanMode === "handwriting"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-sidebar-primary/40"
                }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Handwriting
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sidebar-primary-foreground/20">
                Sinhala
              </span>
            </button>
          </div>

          {/* Handwriting tip */}
          {scanMode === "handwriting" && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="9" />
                <line strokeLinecap="round" x1="12" y1="8" x2="12" y2="12" />
                <line strokeLinecap="round" x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Tips for best results:</span> Use good lighting, keep the writing flat and in focus, avoid shadows, and ensure Sinhala letters are clearly formed. Blurry or tilted images reduce accuracy.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left: Upload + Preview ── */}
            <div className="flex flex-col gap-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Upload Image</div>

              {!imageSrc ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all min-h-64 cursor-pointer
                    ${dragOver
                      ? "border-sidebar-primary bg-sidebar-primary/5 scale-[1.01]"
                      : "border-border bg-card hover:border-sidebar-primary/50 hover:bg-sidebar-accent/40"
                    }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-sidebar-accent flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-muted-foreground">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline strokeLinecap="round" strokeLinejoin="round" points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className="text-center px-6">
                    <p className="text-sm font-semibold text-foreground">Drop image here or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP, BMP supported</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </button>
              ) : (
                <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt="Uploaded preview"
                    className="w-full object-contain max-h-100"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                    title="Remove image"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Scan button */}
              <button
                onClick={handleScan}
                disabled={!imageSrc || scanState === "scanning"}
                className="flex items-center justify-center gap-2.5 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-sm px-5 py-3 shadow-sm transition-all
                  hover:opacity-90 active:scale-[0.98]
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {scanState === "scanning" ? (
                  <>
                    <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {scanMode === "handwriting" ? "Reading handwriting…" : "Scanning text…"}
                  </>
                ) : (
                  <>
                    {scanMode === "handwriting" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 shrink-0">
                        <polyline strokeLinecap="round" strokeLinejoin="round" points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    )}
                    {scanMode === "handwriting" ? "Read Handwriting" : "Scan Text"}
                  </>
                )}
              </button>

              <p className="text-[11px] text-muted-foreground text-center">
                {scanMode === "handwriting"
                  ? "Handwriting mode · Sinhala (සිංහල) + English · Powered by NVIDIA AI"
                  : "Printed text mode · English + Sinhala · Powered by NVIDIA AI"}
              </p>
            </div>

            {/* ── Right: Extracted Text ── */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Extracted Text</div>
                {extractedText && (
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                      ${copied
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                      }`}
                  >
                    {copied ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                          <polyline strokeLinecap="round" strokeLinejoin="round" points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-3.5 h-3.5">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path strokeLinecap="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy All
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden min-h-130">
                {scanState === "idle" && !extractedText && (
                  <div className="flex flex-col items-center justify-center h-full min-h-130 gap-3 text-center px-6">
                    <div className="w-12 h-12 rounded-xl bg-sidebar-accent flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-muted-foreground">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload an image and click{" "}
                      <span className="font-semibold text-foreground">
                        {scanMode === "handwriting" ? "Read Handwriting" : "Scan Text"}
                      </span>
                    </p>
                  </div>
                )}

                {scanState === "scanning" && (
                  <div className="flex flex-col items-center justify-center h-full min-h-64 gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-4 border-sidebar-primary/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-sidebar-primary border-t-transparent animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {scanMode === "handwriting" ? "Reading handwriting…" : "Analysing image…"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {scanMode === "handwriting"
                          ? "Recognising Sinhala & English characters"
                          : "Extracting text content"}
                      </p>
                    </div>
                  </div>
                )}

                {scanState === "error" && (
                  <div className="flex flex-col items-center justify-center h-full min-h-64 gap-3 px-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6 text-rose-500">
                        <circle cx="12" cy="12" r="9" />
                        <line strokeLinecap="round" x1="12" y1="8" x2="12" y2="12" />
                        <line strokeLinecap="round" x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Scan failed</p>
                    <p className="text-xs text-muted-foreground">{errorMsg}</p>
                    <button
                      onClick={handleScan}
                      className="text-xs font-semibold text-sidebar-primary underline underline-offset-2 hover:opacity-80"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {scanState === "done" && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-sidebar-accent/40">
                      <span className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{extractedText.length}</span> characters
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{extractedText.split("\n").filter(Boolean).length}</span> lines
                      </span>
                      <span className="flex items-center gap-1 ml-auto text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                          <polyline strokeLinecap="round" strokeLinejoin="round" points="20 6 9 17 4 12" />
                        </svg>
                        {scanMode === "handwriting" ? "Handwriting read" : "Scan complete"}
                      </span>
                    </div>
                    <textarea
                      readOnly
                      value={extractedText}
                      className="flex-1 w-full resize-none p-4 text-sm text-foreground bg-transparent focus:outline-none leading-relaxed"
                      style={{ minHeight: "480px", fontFamily: "'Noto Sans Sinhala', 'Iskoola Pota', sans-serif" }}
                    />
                  </div>
                )}
              </div>

              {scanState === "done" && extractedText && (
                <p className="text-[11px] text-muted-foreground">
                  Tip: Click inside the text area and use <kbd className="px-1 py-0.5 rounded bg-sidebar-accent text-[10px] font-mono">Ctrl+A</kbd> to select all.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
