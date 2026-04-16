"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { MasterProduct, FormData, SubmitStatus } from "@/types";

interface ProductFormProps {
  scannedBarcode: string;
  masterData: MasterProduct[];
  onSubmit: (data: FormData) => Promise<void>;
  submitStatus: SubmitStatus;
  cartonNumber: string;
  onCartonChange: (v: string) => void;
}

export default function ProductForm({
  scannedBarcode,
  masterData,
  onSubmit,
  submitStatus,
  cartonNumber,
  onCartonChange,
}: ProductFormProps) {
  // The "resolved" barcode we've processed – drives product/batch auto-fill
  const [resolvedBarcode, setResolvedBarcode] = useState("");

  const [product, setProduct] = useState("");
  const [batch, setBatch] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [weightKgOverride, setWeightKgOverride] = useState<number | "">("");

  // Batch search state
  const [batchSearch, setBatchSearch] = useState("");
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const batchRef = useRef<HTMLDivElement>(null);

  // Product search state
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);

  // When a new barcode comes in (different from what we last resolved), process it.
  // We use a callback invoked at render time (not inside useEffect) to avoid the lint rule.
  const handleBarcodeChange = useCallback(
    (barcode: string) => {
      const found = masterData.find((p) => p.barcode === barcode);
      if (found) {
        setProduct(found.product);
        setProductSearch(found.product);
        setBatch(found.batch);
        setBatchSearch(found.batch);
        setWeightKgOverride("");
      } else {
        setProduct("");
        setProductSearch(barcode);
      }
    },
    [masterData]
  );

  // Fire handleBarcodeChange whenever scannedBarcode changes to a new value
  if (scannedBarcode && scannedBarcode !== resolvedBarcode) {
    setResolvedBarcode(scannedBarcode);
    handleBarcodeChange(scannedBarcode);
  }

  // Derived: matched product from master
  const matchedProduct = useMemo(
    () =>
      masterData.find((p) => p.product === product && p.batch === batch) ??
      masterData.find((p) => p.product === product),
    [masterData, product, batch]
  );

  // Auto-computed weight (derived, not state)
  const autoWeightKg = useMemo(() => {
    if (matchedProduct && qty !== "" && qty > 0) {
      return parseFloat((matchedProduct.kg * (qty as number)).toFixed(4));
    }
    return null;
  }, [matchedProduct, qty]);

  // Effective weight shown in input
  const displayWeight: number | "" =
    weightKgOverride !== "" ? weightKgOverride : autoWeightKg ?? "";

  // All unique products
  const allProducts = useMemo(
    () => Array.from(new Map(masterData.map((p) => [p.product, p])).values()),
    [masterData]
  );

  // Filtered products for dropdown
  const filteredProducts = useMemo(
    () =>
      allProducts.filter(
        (p) =>
          p.product.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearch.toLowerCase())
      ),
    [allProducts, productSearch]
  );

  // Batches available for selected product
  const availableBatches = useMemo(
    () =>
      masterData
        .filter((p) => p.product === product)
        .map((p) => p.batch)
        .filter(Boolean),
    [masterData, product]
  );

  // Filtered batches by search
  const filteredBatches = useMemo(
    () =>
      availableBatches.filter((b) =>
        b.toLowerCase().includes(batchSearch.toLowerCase())
      ),
    [availableBatches, batchSearch]
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (batchRef.current && !batchRef.current.contains(e.target as Node)) {
        setBatchDropdownOpen(false);
      }
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectProduct = useCallback((p: MasterProduct) => {
    setProduct(p.product);
    setProductSearch(p.product);
    setProductDropdownOpen(false);
    setBatch("");
    setBatchSearch("");
    setWeightKgOverride("");
  }, []);

  const selectBatch = useCallback((b: string) => {
    setBatch(b);
    setBatchSearch(b);
    setBatchDropdownOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!product || !cartonNumber || qty === "" || qty <= 0) return;

      const finalWeight =
        weightKgOverride !== ""
          ? (weightKgOverride as number)
          : (autoWeightKg ?? 0);

      await onSubmit({
        cartonNumber,
        product,
        batch,
        qty: qty as number,
        weightKg: finalWeight,
      });

      // Reset form fields (keep carton number)
      setResolvedBarcode("");
      setProduct("");
      setProductSearch("");
      setBatch("");
      setBatchSearch("");
      setQty("");
      setWeightKgOverride("");
    },
    [product, cartonNumber, qty, weightKgOverride, autoWeightKg, onSubmit, batch]
  );

  const isLoading = submitStatus === "loading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Carton Number */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-200">
          Carton Number <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          value={cartonNumber}
          onChange={(e) => onCartonChange(e.target.value)}
          placeholder="Enter carton number"
          required
          className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
        />
      </div>

      {/* Product (searchable dropdown) */}
      <div className="flex flex-col gap-1.5" ref={productRef}>
        <label className="text-sm font-semibold text-gray-200">
          Product <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setProductDropdownOpen(true);
              if (!e.target.value) {
                setProduct("");
                setBatch("");
                setBatchSearch("");
              }
            }}
            onFocus={() => setProductDropdownOpen(true)}
            placeholder="Search or scan barcode..."
            className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </div>
          {productDropdownOpen && filteredProducts.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-52 overflow-y-auto">
              {filteredProducts.map((p) => (
                <li
                  key={p.sku}
                  onMouseDown={() => selectProduct(p)}
                  className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-purple-700/40 transition-colors ${
                    p.product === product
                      ? "bg-purple-700/30 text-purple-200"
                      : "text-gray-200"
                  }`}
                >
                  <div className="font-medium">{p.product}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {p.sku} · {p.kg} kg/pcs
                  </div>
                </li>
              ))}
            </ul>
          )}
          {productDropdownOpen &&
            productSearch &&
            filteredProducts.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 text-sm text-gray-400">
                No product found for &ldquo;{productSearch}&rdquo;
              </div>
            )}
        </div>
        {product && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg
              className="w-3.5 h-3.5 text-green-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-green-400">
              {matchedProduct
                ? `${matchedProduct.kg} kg/pcs`
                : "Product selected (no weight data)"}
            </span>
          </div>
        )}
      </div>

      {/* Batch (searchable dropdown) */}
      <div className="flex flex-col gap-1.5" ref={batchRef}>
        <label className="text-sm font-semibold text-gray-200">Batch</label>
        <div className="relative">
          <input
            type="text"
            value={batchSearch}
            onChange={(e) => {
              setBatchSearch(e.target.value);
              setBatch(e.target.value);
              setBatchDropdownOpen(true);
            }}
            onFocus={() => {
              if (availableBatches.length > 0) setBatchDropdownOpen(true);
            }}
            placeholder={
              product
                ? availableBatches.length > 0
                  ? `Search batch (${availableBatches.length} available)`
                  : "Type batch manually"
                : "Select product first"
            }
            disabled={!product}
            className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          {availableBatches.length > 0 && (
            <button
              type="button"
              onMouseDown={() => setBatchDropdownOpen((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {batchDropdownOpen && filteredBatches.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-44 overflow-y-auto">
              {filteredBatches.map((b) => (
                <li
                  key={b}
                  onMouseDown={() => selectBatch(b)}
                  className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-purple-700/40 transition-colors font-mono ${
                    b === batch
                      ? "bg-purple-700/30 text-purple-200"
                      : "text-gray-200"
                  }`}
                >
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Qty */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-200">
          Qty <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          value={qty}
          min={1}
          onChange={(e) => {
            const v = e.target.value === "" ? "" : parseInt(e.target.value);
            setQty(v);
            setWeightKgOverride("");
          }}
          placeholder="Enter quantity"
          required
          className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
        />
      </div>

      {/* Weight (KG) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          Weight (KG) <span className="text-red-400">*</span>
          {autoWeightKg !== null && weightKgOverride === "" && (
            <span className="text-xs text-purple-400 font-normal bg-purple-900/30 px-2 py-0.5 rounded-full">
              auto-calculated
            </span>
          )}
        </label>
        <input
          type="number"
          value={displayWeight}
          step="0.0001"
          min={0}
          onChange={(e) =>
            setWeightKgOverride(
              e.target.value === "" ? "" : parseFloat(e.target.value)
            )
          }
          placeholder="Weight in KG"
          required
          className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
        />
        {matchedProduct && (
          <p className="text-xs text-gray-400">
            {matchedProduct.kg} kg/pcs × {qty || 0} pcs ={" "}
            {parseFloat((matchedProduct.kg * ((qty as number) || 0)).toFixed(4))}{" "}
            kg
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !product || !cartonNumber || !qty}
        className="w-full py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2 shadow-lg"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Submit
          </>
        )}
      </button>

      {/* Status feedback */}
      {submitStatus === "success" && (
        <div className="flex items-center gap-2 bg-green-900/40 border border-green-500/40 rounded-lg px-3 py-2.5">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-green-400 text-sm font-medium">
            Submitted to Google Sheets!
          </span>
        </div>
      )}
      {submitStatus === "error" && (
        <div className="flex items-center gap-2 bg-red-900/40 border border-red-500/40 rounded-lg px-3 py-2.5">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v4a1 1 0 002 0V9a1 1 0 00-2 0zm0-4a1 1 0 112 0 1 1 0 01-2 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-red-400 text-sm">
            Failed to submit. Check connection or Script URL.
          </span>
        </div>
      )}
    </form>
  );
}
