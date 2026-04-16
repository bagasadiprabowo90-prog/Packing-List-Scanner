"use client";

import type { ScanEntry } from "@/types";

interface ScanLogProps {
  entries: ScanEntry[];
  onDelete?: (id: string) => void;
}

export default function ScanLog({ entries, onDelete }: ScanLogProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">No scans yet in this session</p>
        <p className="text-xs mt-1 text-gray-600">Start scanning to see entries here</p>
      </div>
    );
  }

  const totalEntries = entries.length;
  const totalQty = entries.reduce((s, e) => s + e.qty, 0);
  const totalWeight = entries.reduce((s, e) => s + e.weightKg, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2 text-xs text-gray-300 border border-gray-700">
        <span>{totalEntries} entries</span>
        <span>Total Qty: <span className="font-bold text-white">{totalQty}</span></span>
        <span>Total: <span className="font-bold text-purple-300">{totalWeight.toFixed(3)} kg</span></span>
      </div>

      {/* Entry list - newest first */}
      <ul className="flex flex-col gap-2">
        {[...entries].reverse().map((entry) => (
          <li key={entry.id} className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 relative group">
            {/* Delete button */}
            {onDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                className="absolute top-2 right-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete entry"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Product name */}
            <p className="text-sm font-semibold text-white pr-6 leading-tight">{entry.product}</p>

            {/* Row: batch + time */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {entry.batch && (
                <span className="inline-flex items-center gap-1 bg-purple-900/50 text-purple-300 text-xs px-2 py-0.5 rounded-full font-mono">
                  {entry.batch}
                </span>
              )}
              <span className="text-xs text-gray-500">
                {new Date(entry.timestamp).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className="text-xs text-gray-500">Carton #{entry.cartonNumber}</span>
            </div>

            {/* Row: qty + weight */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span className="text-sm font-bold text-white">{entry.qty}</span>
                <span className="text-xs text-gray-400">pcs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                <span className="text-sm font-bold text-purple-300">{entry.weightKg.toFixed(3)}</span>
                <span className="text-xs text-gray-400">kg</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
