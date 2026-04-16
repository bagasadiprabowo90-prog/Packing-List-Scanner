"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { MasterProduct, ScanEntry, FormData, SubmitStatus } from "@/types";
import { submitEntry, fetchMasterData } from "@/services/api";
import ScanLog from "@/components/ScanLog";
import ScanSummary from "@/components/ScanSummary";

// Dynamically import Scanner (uses browser APIs)
const Scanner = dynamic(() => import("@/components/Scanner"), { ssr: false });
// Dynamically import ProductForm (uses browser APIs)
const ProductForm = dynamic(() => import("@/components/ProductForm"), { ssr: false });

type Tab = "scan" | "log" | "summary" | "settings";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("scan");
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [masterData, setMasterData] = useState<MasterProduct[]>([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterError, setMasterError] = useState("");
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [cartonNumber, setCartonNumber] = useState("1");
  const [scriptUrl, setScriptUrl] = useState("");

  // Load master data on mount
  useEffect(() => {
    loadMasterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset submit status after 3s
  useEffect(() => {
    if (submitStatus === "success" || submitStatus === "error") {
      const t = setTimeout(() => setSubmitStatus("idle"), 3000);
      return () => clearTimeout(t);
    }
  }, [submitStatus]);

  // Stop scanner when leaving scan tab
  useEffect(() => {
    if (tab !== "scan") {
      setScannerActive(false);
    }
  }, [tab]);

  const loadMasterData = useCallback(async () => {
    setMasterLoading(true);
    setMasterError("");
    try {
      const data = await fetchMasterData();
      setMasterData(data);
    } catch {
      setMasterError("Failed to load master data");
    } finally {
      setMasterLoading(false);
    }
  }, []);

  const handleScan = useCallback((barcode: string) => {
    setScannedBarcode(barcode);
  }, []);

  const handleSubmit = useCallback(async (data: FormData) => {
    setSubmitStatus("loading");
    try {
      await submitEntry(data);
      // Add to local session log
      const entry: ScanEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        cartonNumber: data.cartonNumber,
        product: data.product,
        batch: data.batch,
        qty: data.qty,
        weightKg: data.weightKg,
      };
      setEntries((prev) => [...prev, entry]);
      setSubmitStatus("success");
      setScannedBarcode(""); // clear after success
    } catch {
      setSubmitStatus("error");
    }
  }, []);

  const handleDeleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleClearSession = useCallback(() => {
    if (confirm("Clear all entries from this session?")) {
      setEntries([]);
    }
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      key: "scan",
      label: "Scan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9V6a1 1 0 011-1h3M21 9V6a1 1 0 00-1-1h-3M3 15v3a1 1 0 001 1h3M21 15v3a1 1 0 01-1 1h-3M8 12h8" />
        </svg>
      ),
    },
    {
      key: "log",
      label: "Log",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      badge: entries.length > 0 ? entries.length : undefined,
    },
    {
      key: "summary",
      label: "Summary",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      key: "settings",
      label: "Settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight text-white">Packing List Scanner</h1>
              <p className="text-xs text-gray-400">Malaysia Shipment</p>
            </div>
          </div>
          {/* Master data status */}
          <div className="flex items-center gap-2 text-xs">
            {masterLoading ? (
              <span className="text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading
              </span>
            ) : masterError ? (
              <button
                onClick={loadMasterData}
                className="text-red-400 flex items-center gap-1 hover:text-red-300"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            ) : (
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {masterData.length} products
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {/* SCAN TAB */}
        {tab === "scan" && (
          <div className="px-4 pt-4 flex flex-col gap-5">
            {/* Scanner toggle + viewer */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm text-gray-200">Barcode Scanner</h2>
                <button
                  onClick={() => setScannerActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    scannerActive ? "bg-purple-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      scannerActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <Scanner onScan={handleScan} active={scannerActive} />
            </div>

            {/* Product Form */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <h2 className="font-semibold text-sm text-gray-200 mb-4">
                Form Packing List Malaysia
              </h2>
              <ProductForm
                scannedBarcode={scannedBarcode}
                masterData={masterData}
                onSubmit={handleSubmit}
                submitStatus={submitStatus}
                cartonNumber={cartonNumber}
                onCartonChange={setCartonNumber}
              />
            </div>
          </div>
        )}

        {/* LOG TAB */}
        {tab === "log" && (
          <div className="px-4 pt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-200">Session Log</h2>
              {entries.length > 0 && (
                <button
                  onClick={handleClearSession}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear session
                </button>
              )}
            </div>
            <ScanLog entries={entries} onDelete={handleDeleteEntry} />
          </div>
        )}

        {/* SUMMARY TAB */}
        {tab === "summary" && (
          <div className="px-4 pt-4 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-200">Pivot Summary</h2>
            <ScanSummary entries={entries} />
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === "settings" && (
          <div className="px-4 pt-4 flex flex-col gap-5">
            <h2 className="font-semibold text-gray-200">Settings</h2>

            {/* Apps Script URL */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-sm text-gray-200">Google Apps Script URL</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Set <code className="bg-gray-800 px-1 rounded text-purple-300">NEXT_PUBLIC_APPS_SCRIPT_URL</code> in your <code className="bg-gray-800 px-1 rounded text-purple-300">.env.local</code> file, or paste it here for this session only.
                </p>
              </div>
              <input
                type="url"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-gray-500">
                Current env URL: {process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ? "✅ Set" : "❌ Not set"}
              </p>
            </div>

            {/* Master data info */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-col gap-3">
              <h3 className="font-semibold text-sm text-gray-200">Master Data</h3>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Products loaded: <span className="text-white font-bold">{masterData.length}</span></p>
                <p>Unique SKUs: <span className="text-white font-bold">{new Set(masterData.map((p) => p.sku)).size}</span></p>
                <p>Unique batches: <span className="text-white font-bold">{new Set(masterData.map((p) => p.batch).filter(Boolean)).size}</span></p>
              </div>
              <button
                onClick={loadMasterData}
                disabled={masterLoading}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 disabled:opacity-40"
              >
                <svg className={`w-4 h-4 ${masterLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {masterLoading ? "Refreshing..." : "Refresh master data"}
              </button>
            </div>

            {/* GAS Setup Guide */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-col gap-2">
              <h3 className="font-semibold text-sm text-gray-200">Apps Script Setup Guide</h3>
              <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
                <li>Open your Google Sheet → Extensions → Apps Script</li>
                <li>Replace the default code with the template from <code className="bg-gray-800 px-1 rounded text-purple-300">src/services/api.ts</code></li>
                <li>Deploy → New deployment → Web app</li>
                <li>Execute as: <strong className="text-gray-300">Me</strong>, Access: <strong className="text-gray-300">Anyone</strong></li>
                <li>Copy the deployment URL and set it as <code className="bg-gray-800 px-1 rounded text-purple-300">NEXT_PUBLIC_APPS_SCRIPT_URL</code></li>
              </ol>
            </div>

            {/* Column mapping */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <h3 className="font-semibold text-sm text-gray-200 mb-2">Master Product Sheet Columns</h3>
              <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-400">
                <span>A → SKU</span>
                <span>B → Product Name</span>
                <span>C → Barcode</span>
                <span>D → Net (gram)</span>
                <span>E → Gross (gram)</span>
                <span>F → Kg/pcs</span>
                <span>I → Batch Number</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-gray-950/95 backdrop-blur border-t border-gray-800 z-40">
        <div className="flex items-stretch">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors ${
                tab === t.key
                  ? "text-purple-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {/* Active indicator */}
              {tab === t.key && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-500 rounded-full" />
              )}
              <span className="relative">
                {t.icon}
                {t.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-purple-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                    {t.badge > 99 ? "99+" : t.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
        {/* Safe area padding */}
        <div className="h-safe-area-inset-bottom" />
      </nav>
    </div>
  );
}
