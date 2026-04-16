import type { FormData, MasterProduct } from "@/types";

const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "1PeE9FlLHsoD5auL-KNaB561wfyh9mjSUZ2lKITnIokg";
const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbyqxWECpvBUSXZ5NyMiriZIjDj775VXknThThZCxLtG4jqdk7H-Lw41ldN6V40kpY0/exec";

function getSheetUrl(sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
}

function getProxyUrl(url: string): string {
  return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}

/**
 * Submit a single form entry to Google Sheet
 * Uses Google Sheets API via CSV export (Gviz) approach
 */
export async function submitEntry(data: FormData): Promise<void> {
  const payload = {
    timestamp: new Date().toISOString(),
    cartonNumber: data.cartonNumber,
    product: data.product,
    batch: data.batch,
    qty: data.qty,
    weightKg: data.weightKg,
  };

  if (APPS_SCRIPT_URL) {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submitEntry", ...payload }),
    });
    void response;
  } else {
    console.log("Form submission (simulated):", payload);
  }
}

/**
 * Fetch master product data from Google Sheet
 * Uses Google Apps Script with CORS proxy
 */
export async function fetchMasterData(): Promise<MasterProduct[]> {
  const cacheKey = "masterDataCache";
  
  // Check localStorage first
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.data && parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          return parsed.data;
        }
      } catch {}
    }
  }

  try {
    // Try direct fetch first (works in some browsers)
    let data: MasterProduct[] = [];
    const url = `${APPS_SCRIPT_URL}?action=getMasterData`;
    
    try {
      const response = await fetch(url, { 
        method: "GET",
        mode: "no-cors" 
      });
      const text = await response.text();
      if (text && text.startsWith("[")) {
        const json = JSON.parse(text);
        data = json.map((item: Record<string, unknown>) => ({
          sku: String(item.sku ?? ""),
          product: String(item.product ?? ""),
          barcode: String(item.barcode ?? ""),
          netGram: Number(item.netGram ?? 0),
          grossGram: Number(item.grossGram ?? 0),
          kg: Number(item.kg ?? 0),
          batch: String(item.batch ?? ""),
        }));
      }
    } catch {
      // Fallback to proxy
      const proxyUrl = getProxyUrl(url);
      const response = await fetch(proxyUrl, { method: "GET" });
      const json = await response.json();
      data = json.map((item: Record<string, unknown>) => ({
        sku: String(item.sku ?? ""),
        product: String(item.product ?? ""),
        barcode: String(item.barcode ?? ""),
        netGram: Number(item.netGram ?? 0),
        grossGram: Number(item.grossGram ?? 0),
        kg: Number(item.kg ?? 0),
        batch: String(item.batch ?? ""),
      }));
    }

    // Cache the data
    if (typeof window !== "undefined" && data.length > 0) {
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    }

    return data;
  } catch (e) {
    console.error("Failed to fetch master data:", e);
    return [];
  }
}