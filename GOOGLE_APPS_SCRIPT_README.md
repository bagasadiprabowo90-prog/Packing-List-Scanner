# Packing List Scanner - Google Apps Script Setup

## Setup Instructions

### 1. Create Google Apps Script

1. Buka [Google Apps Script](https://script.google.com)
2. Klik "New Project"
3. Beri nama: "Packing List Scanner API"
4. Copy-paste kode dari file `google-apps-script.js` ke editor

### 2. Deploy sebagai Web App

1. Klik tombol "Deploy" > "New deployment"
2. Pilih type: "Web app"
3. Konfigurasi:
   - **Description**: Packing List Scanner API
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Klik "Deploy"
5. **Copy URL deployment** yang muncul (format: https://script.google.com/macros/s/XXXXXXX/exec)

### 3. Setup Google Sheets

Pastikan spreadsheet dengan ID `1PeE9FlLHsoD5auL-KNaB561wfyh9mjSUZ2lKITnIokg` memiliki:

#### Sheet "Master Product" (untuk data produk):
| Column | Field | Example |
|--------|-------|---------|
| A | SKU | LPVN05 |
| B | Product Name | [LPVN05] LIP VINYL (Caramel) |
| C | Barcode | 1234567890123 |
| D | Net Gram | 150 |
| E | Gross Gram | 200 |
| F | Kg per pcs | 0.15 |
| I | Batch | BATCH001 |

#### Sheet "Packing List" (akan dibuat otomatis):
Akan berisi data submission dari app.

### 4. Update Environment Variables

Di Vercel atau platform hosting:
```
NEXT_PUBLIC_SPREADSHEET_ID=1PeE9FlLHsoD5auL-KNaB561wfyh9mjSUZ2lKITnIokg
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### 5. Test Connection

Setelah deploy dan set environment variables:
1. Buka app di browser
2. App akan auto-load master data dari Google Sheets
3. Submit form - data akan masuk ke sheet "Packing List"

## Troubleshooting

- **Error 403**: Pastikan web app di-deploy dengan akses "Anyone"
- **No products loaded**: Check sheet "Master Product" ada data dan format benar
- **Submit failed**: Check sheet "Packing List" bisa diakses script

## Security Notes

- Web app di-deploy sebagai "Anyone" untuk akses dari browser
- Data sensitif jangan di-commit ke GitHub
- Environment variables di-set di hosting platform (Vercel/Netlify)