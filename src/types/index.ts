// Master Product data from Google Sheet "Master Product" tab
export interface MasterProduct {
  sku: string;         // Column A
  product: string;     // Column B - display name e.g. "[LPVN05] LIP VINYL (Caramel)"
  barcode: string;     // Column C - Product/Barcode
  netGram: number;     // Column D - Net (Gram)
  grossGram: number;   // Column E - Gross (Gram)
  kg: number;          // Column F - Kg per pcs
  batch: string;       // Column I - Batch number
}

// A single scan/entry in this session
export interface ScanEntry {
  id: string;
  timestamp: string;
  cartonNumber: string;
  product: string;
  batch: string;
  qty: number;
  weightKg: number;    // kg per pcs * qty
}

// Pivot row: grouped by product (and optionally batch)
export interface PivotRow {
  product: string;
  batch: string;
  totalQty: number;
  totalWeightKg: number;
}

// Form state
export interface FormData {
  cartonNumber: string;
  product: string;
  batch: string;
  qty: number;
  weightKg: number;
}

// Submission state
export type SubmitStatus = "idle" | "loading" | "success" | "error";
