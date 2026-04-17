import type { FormData, MasterProduct } from "@/types";

const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "1PeE9FlLHsoD5auL-KNaB561wfyh9mjSUZ2lKITnIokg";
const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwCK2wz77_XnWT7_Q1SJv__HbVBw2i3nVzFj7v9V41zE_LpBXEC396BIZMpaX3sYUfb/exec";

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
 * Uses Google Sheets API via CSV export (Gviz) approach
 */
export async function fetchMasterData(): Promise<MasterProduct[]> {
  if (!SPREADSHEET_ID) {
    console.warn("NEXT_PUBLIC_SPREADSHEET_ID not set – using empty master data.");
    return [];
  }

  // Try Apps Script first (if available and working)
  if (APPS_SCRIPT_URL) {
    try {
      const url = `${APPS_SCRIPT_URL}?action=getMasterData`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const arr: unknown[] = Array.isArray(json) ? json : (json?.data ?? []);

      if (arr.length > 0) {
        return arr.map((item: unknown) => {
          const row = item as Record<string, unknown>;
          return {
            sku: String(row.sku ?? ""),
            product: String(row.product ?? ""),
            barcode: String(row.barcode ?? ""),
            netGram: Number(row.netGram ?? 0),
            grossGram: Number(row.grossGram ?? 0),
            kg: Number(row.kg ?? 0),
            batch: String(row.batch ?? ""),
          };
        });
      }
    } catch (e) {
      console.warn("Apps Script failed, falling back to direct Sheets API:", e);
    }
  }

  // Fallback: Direct Google Sheets API (public access)
  try {
    const url = getSheetUrl("Master Product");
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const match = text.match(/\{.*\}/);
    if (!match) {
      return [];
    }

    const parsed = JSON.parse(match[0]);
    const rows = parsed.table?.rows ?? [];
    const values = rows.map((r: { c: { v: unknown }[] }) =>
      r.c?.map((c) => c?.v ?? "")
    );

    if (values.length === 0) return [];

    return values.slice(1).map((row: unknown[]) => ({
      sku: String(row[0] ?? ""),
      product: String(row[1] ?? ""),
      barcode: String(row[2] ?? ""),
      netGram: Number(row[3] ?? 0),
      grossGram: Number(row[4] ?? 0),
      kg: Number(row[5] ?? 0),
      batch: String(row[8] ?? ""),
    }));
  } catch (e) {
    console.error("Failed to fetch master data from both sources:", e);
    return [];
  }
}
      } catch {}
    }
  }

  try {
    const url = `${APPS_SCRIPT_URL}?action=products`;
    const proxyUrl = getProxyUrl(url);
    
    const response = await fetch(proxyUrl, { method: "GET" });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const json = await response.json();
    
    if (!json.ok) {
      throw new Error(json.error || "Failed to fetch products");
    }
    
    const data: MasterProduct[] = json.products.map((item: Record<string, unknown>) => ({
      sku: String(item.sku ?? ""),
      product: String(item.product ?? ""),
      barcode: String(item.barcode ?? ""),
      netGram: 0,
      grossGram: 0,
      kg: 0,
      batch: "",
    }));

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