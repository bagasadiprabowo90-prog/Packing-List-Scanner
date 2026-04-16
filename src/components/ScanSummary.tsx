"use client";

import { useMemo, useState } from "react";
import type { ScanEntry, PivotRow } from "@/types";

interface ScanSummaryProps {
  entries: ScanEntry[];
}

export default function ScanSummary({ entries }: ScanSummaryProps) {
  const [groupBy, setGroupBy] = useState<"product" | "product-batch">("product-batch");

  const pivotData = useMemo<PivotRow[]>(() => {
    const map = new Map<string, PivotRow>();

    for (const entry of entries) {
      const key =
        groupBy === "product-batch"
          ? `${entry.product}||${entry.batch}`
          : entry.product;

      if (map.has(key)) {
        const row = map.get(key)!;
        row.totalQty += entry.qty;
        row.totalWeightKg += entry.weightKg;
      } else {
        map.set(key, {
          product: entry.product,
          batch: groupBy === "product-batch" ? entry.batch : "",
          totalQty: entry.qty,
          totalWeightKg: entry.weightKg,
        });
      }
    }

    // Sort by product name, then batch
    return Array.from(map.values()).sort((a, b) => {
      const cmp = a.product.localeCompare(b.product);
      if (cmp !== 0) return cmp;
      return a.batch.localeCompare(b.batch);
    });
  }, [entries, groupBy]);

  const grandTotalQty = pivotData.reduce((s, r) => s + r.totalQty, 0);
  const grandTotalWeight = pivotData.reduce((s, r) => s + r.totalWeightKg, 0);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">No data to summarize</p>
        <p className="text-xs mt-1 text-gray-600">Submit entries to see the pivot table</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Group by toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Group by:</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-700 text-xs">
          <button
            onClick={() => setGroupBy("product-batch")}
            className={`px-3 py-1.5 transition-colors ${
              groupBy === "product-batch"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Product + Batch
          </button>
          <button
            onClick={() => setGroupBy("product")}
            className={`px-3 py-1.5 transition-colors ${
              groupBy === "product"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Product Only
          </button>
        </div>
      </div>

      {/* Grand total */}
      <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl px-4 py-3 flex justify-between items-center">
        <div className="text-center">
          <p className="text-xs text-gray-400">Products</p>
          <p className="text-lg font-bold text-white">{pivotData.length}</p>
        </div>
        <div className="w-px h-8 bg-gray-700" />
        <div className="text-center">
          <p className="text-xs text-gray-400">Total Qty</p>
          <p className="text-lg font-bold text-white">{grandTotalQty}</p>
        </div>
        <div className="w-px h-8 bg-gray-700" />
        <div className="text-center">
          <p className="text-xs text-gray-400">Total Weight</p>
          <p className="text-lg font-bold text-purple-300">{grandTotalWeight.toFixed(3)} kg</p>
        </div>
      </div>

      {/* Pivot table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wide">
              <th className="text-left px-3 py-2.5">Product</th>
              {groupBy === "product-batch" && (
                <th className="text-left px-3 py-2.5">Batch</th>
              )}
              <th className="text-right px-3 py-2.5">Qty</th>
              <th className="text-right px-3 py-2.5">Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {pivotData.map((row, i) => (
              <tr
                key={i}
                className={`border-t border-gray-700/50 ${
                  i % 2 === 0 ? "bg-gray-900/40" : "bg-gray-800/20"
                } hover:bg-purple-900/20 transition-colors`}
              >
                <td className="px-3 py-2.5 text-gray-200 text-xs leading-tight">
                  {row.product}
                </td>
                {groupBy === "product-batch" && (
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded">
                      {row.batch || "-"}
                    </span>
                  </td>
                )}
                <td className="px-3 py-2.5 text-right font-bold text-white">
                  {row.totalQty}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-purple-300">
                  {row.totalWeightKg.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Grand total row */}
          <tfoot>
            <tr className="border-t-2 border-purple-500/40 bg-gray-800">
              <td
                colSpan={groupBy === "product-batch" ? 2 : 1}
                className="px-3 py-2.5 text-xs font-bold text-gray-300 uppercase"
              >
                Grand Total
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-white">
                {grandTotalQty}
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-purple-300">
                {grandTotalWeight.toFixed(3)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
