# Active Context: Packing List Scanner – Malaysia Shipment

## Current State

**App Status**: ✅ Built and deployed

A mobile-first barcode scanner PWA for inputting product packing list data (BLP Beauty Malaysia shipment) into Google Sheets via Google Apps Script.

## Recently Completed

- [x] `@zxing/browser` + `@zxing/library` installed for real-time barcode scanning
- [x] `src/types/index.ts` – MasterProduct, ScanEntry, PivotRow, FormData, SubmitStatus types
- [x] `src/components/Scanner.tsx` – Camera barcode scanner (EAN-13/EAN-8/CODE-128/CODE-39), toggle on/off, animated overlay
- [x] `src/components/ProductForm.tsx` – Searchable product dropdown + batch search/filter, auto weight calculation from master kg/pcs × qty
- [x] `src/components/ScanLog.tsx` – Session scan history with per-entry delete, summary bar
- [x] `src/components/ScanSummary.tsx` – Pivot table grouped by product+batch or product only, total qty/weight
- [x] `src/services/api.ts` – Google Apps Script doPost (submit entry) + doGet (fetch master data), includes GAS code template in comments
- [x] `src/app/page.tsx` – Main app with 4-tab bottom navigation: Scan / Log / Summary / Settings
- [x] `src/app/layout.tsx` – Updated title, viewport meta for mobile
- [x] `src/app/globals.css` – Scan line animation, safe area padding, dark scrollbar, iOS zoom fix
- [x] All lint and typecheck passing, production build successful

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main app + navigation logic | ✅ Built |
| `src/app/layout.tsx` | Root layout, mobile viewport | ✅ Built |
| `src/app/globals.css` | Animations, scrollbar, safe area | ✅ Built |
| `src/types/index.ts` | TypeScript interfaces | ✅ Built |
| `src/components/Scanner.tsx` | Camera barcode scanner | ✅ Built |
| `src/components/ProductForm.tsx` | Product + batch form | ✅ Built |
| `src/components/ScanLog.tsx` | Session history | ✅ Built |
| `src/components/ScanSummary.tsx` | Pivot table | ✅ Built |
| `src/services/api.ts` | Google Apps Script API | ✅ Built |

## Architecture

- **Framework**: Next.js 16 App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4, dark theme (gray-950 base, purple-600 accent)
- **Barcode Scanning**: `@zxing/browser` BrowserMultiFormatReader, dynamically imported (client-only)
- **Backend**: Google Apps Script Web App (doPost + doGet), configured via `NEXT_PUBLIC_APPS_SCRIPT_URL`
- **State**: React useState in page.tsx, ScanEntry[] maintained in session memory (not persisted)

## Master Data Sheet Column Mapping

| Column | Field |
|--------|-------|
| A | SKU |
| B | Product name (e.g. `[LPVN05] LIP VINYL (Caramel)`) |
| C | Barcode (EAN-13) |
| D | Net weight (gram) |
| E | Gross weight (gram) |
| F | Kg per pcs |
| I | Batch number |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APPS_SCRIPT_URL` | Google Apps Script web app deployment URL |

## Pending / Next Steps

- [ ] User needs to deploy Google Apps Script web app and set `NEXT_PUBLIC_APPS_SCRIPT_URL` in `.env.local`
- [ ] Master data will load automatically from GAS `doGet?action=getMasterData`
- [ ] Optionally add PWA manifest for "Add to Home Screen" on mobile
- [ ] Optionally persist session log to localStorage

## Session History

| Date | Changes |
|------|---------|
| 2026-04-16 | Initial template created |
| 2026-04-16 | Full scanner app built from scratch |
