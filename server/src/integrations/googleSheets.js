// Google Sheets Integration using Service Account
import { google } from "googleapis";

let sheetsClient = null;

/**
 * Initialize Google Sheets client with service account
 */
export async function initSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    console.warn("Google Sheets credentials not configured");
    return null;
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

/**
 * Read data from a sheet
 */
export async function readSheet(spreadsheetId, range) {
  const sheets = await initSheetsClient();
  if (!sheets) return null;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values || [];
  } catch (error) {
    console.error("Error reading sheet:", error.message);
    throw error;
  }
}

/**
 * Write data to a sheet (append rows)
 */
export async function appendToSheet(spreadsheetId, range, values) {
  const sheets = await initSheetsClient();
  if (!sheets) return null;

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
    return response.data;
  } catch (error) {
    console.error("Error appending to sheet:", error.message);
    throw error;
  }
}

/**
 * Update specific cells in a sheet
 */
export async function updateSheet(spreadsheetId, range, values) {
  const sheets = await initSheetsClient();
  if (!sheets) return null;

  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating sheet:", error.message);
    throw error;
  }
}

/**
 * Delete a row by finding and clearing it (Sheets API doesn't have true delete)
 * We'll mark it as deleted or use batchUpdate for actual deletion
 */
export async function deleteRow(spreadsheetId, sheetName, rowIndex) {
  const sheets = await initSheetsClient();
  if (!sheets) return null;

  try {
    // Get the sheet ID first
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === sheetName
    );

    if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex - 1, // 0-indexed
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });

    return true;
  } catch (error) {
    console.error("Error deleting row:", error.message);
    throw error;
  }
}

/**
 * Alias for readSheet - used by some services
 */
export async function getSheetData(spreadsheetId, sheetName) {
  return readSheet(spreadsheetId, `${sheetName}!A:Z`);
}
