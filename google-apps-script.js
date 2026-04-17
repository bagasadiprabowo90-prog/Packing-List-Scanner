// Google Apps Script for Packing List Scanner
// Deploy as Web App with "Execute as: Me", "Who has access: Anyone"

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "submitEntry") {
      return submitPackingEntry(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "products") {
      return getMasterProducts();
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getMasterProducts() {
  try {
    const spreadsheetId = "1PeE9FlLHsoD5auL-KNaB561wfyh9mjSUZ2lKITnIokg";
    const sheetName = "Master Product";
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);

    if (!sheet) {
      throw new Error("Master Product sheet not found");
    }

    const data = sheet.getDataRange().getValues();

    // Skip header row, map columns:
    // A: SKU, B: Product name, C: Barcode, D: Net Gram, E: Gross Gram, F: Kg per pcs, I: Batch
    const products = data.slice(1).map(row => ({
      sku: row[0] || "",
      product: row[1] || "",
      barcode: row[2] || "",
      netGram: parseFloat(row[3]) || 0,
      grossGram: parseFloat(row[4]) || 0,
      kg: parseFloat(row[5]) || 0,
      batch: row[8] || "" // Column I
    })).filter(product => product.product && product.barcode);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, products: products }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function submitPackingEntry(data) {
  try {
    const spreadsheetId = "1PeE9FlLHsoD5auL-KNaB561wfyh9mjSUZ2lKITnIokg";
    const sheetName = "Packing List"; // Create this sheet if it doesn't exist
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);

    if (!sheet) {
      // Create sheet if it doesn't exist
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const newSheet = spreadsheet.insertSheet(sheetName);
      // Add headers
      newSheet.appendRow([
        "Timestamp", "Carton Number", "Product", "Batch", "Qty", "Weight (KG)"
      ]);
      sheet = newSheet;
    }

    // Append the data
    sheet.appendRow([
      data.timestamp,
      data.cartonNumber,
      data.product,
      data.batch,
      data.qty,
      data.weightKg
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: "Entry submitted successfully" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}