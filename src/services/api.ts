import type { FormData, MasterProduct } from "@/types";

const SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ?? "";

/**
 * Submit a single form entry to Google Apps Script → Google Sheet
 * The Apps Script web app should handle POST with JSON body.
 */
export async function submitEntry(data: FormData): Promise<void> {
  if (!SCRIPT_URL) {
    throw new Error(
      "NEXT_PUBLIC_APPS_SCRIPT_URL is not set. Add it to your .env.local file."
    );
  }

  const payload = {
    action: "submitEntry",
    timestamp: new Date().toISOString(),
    cartonNumber: data.cartonNumber,
    product: data.product,
    batch: data.batch,
    qty: data.qty,
    weightKg: data.weightKg,
  };

  // Google Apps Script doPost() with JSON body
  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors", // GAS requires no-cors
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // no-cors returns opaque response, we can't check status.
  // If fetch doesn't throw, assume success.
  void response;
}

/**
 * Fetch master product data from Google Apps Script.
 * The GAS doGet() should return JSON array of MasterProduct objects.
 *
 * Expected GAS doGet() response:
 * [
 *   { sku, product, barcode, netGram, grossGram, kg, batch }, ...
 * ]
 */
export async function fetchMasterData(): Promise<MasterProduct[]> {
  if (!SCRIPT_URL) {
    console.warn("NEXT_PUBLIC_APPS_SCRIPT_URL not set – using empty master data.");
    return [];
  }

  try {
    const url = `${SCRIPT_URL}?action=getMasterData`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    // Accept both { data: [...] } and direct array
    const arr: unknown[] = Array.isArray(json) ? json : (json?.data ?? []);

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
  } catch (e) {
    console.error("Failed to fetch master data:", e);
    return [];
  }
}

/**
 * Google Apps Script template (add to your GAS project):
 *
 * function doPost(e) {
 *   const data = JSON.parse(e.postData.contents);
 *   if (data.action === "submitEntry") {
 *     const sheet = SpreadsheetApp.getActiveSpreadsheet()
 *       .getSheetByName("Form Responses 1");
 *     sheet.appendRow([
 *       new Date(data.timestamp),
 *       data.cartonNumber,
 *       data.product,
 *       data.batch,
 *       data.qty,
 *       data.weightKg
 *     ]);
 *   }
 *   return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 *
 * function doGet(e) {
 *   if (e.parameter.action === "getMasterData") {
 *     const sheet = SpreadsheetApp.getActiveSpreadsheet()
 *       .getSheetByName("Master Product");
 *     const rows = sheet.getDataRange().getValues();
 *     const headers = rows[0]; // SKU, Product, Barcode, Net, Gross, Kg, ..., Batch
 *     const data = rows.slice(1).map(r => ({
 *       sku: r[0], product: r[1], barcode: r[2],
 *       netGram: r[3], grossGram: r[4], kg: r[5], batch: r[8]
 *     }));
 *     return ContentService.createTextOutput(JSON.stringify(data))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 */
