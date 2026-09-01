import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq } from "drizzle-orm";
import { recordIntegrationUsage } from "./recordIntegrationUsage";

interface SyncGoogleSheetsParams {
  spreadsheetId: string;
  sheetId?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiry?: Date | null;
  submissionData: Record<string, any>;
  submissionId: string;
  formId: string;
  userId: string;
  formName?: string;
}

interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Refresh Google OAuth access token
 */
async function refreshAccessToken(
  refreshToken: string,
  formId: string,
): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token refresh failed:", error);
    throw new Error("Failed to refresh Google access token");
  }

  const data = (await response.json()) as TokenRefreshResponse;
  const newAccessToken = data.access_token;
  const expiresIn = data.expires_in;
  const newTokenExpiry = new Date(Date.now() + expiresIn * 1000);

  // Update form with new token
  await db
    .update(forms)
    .set({
      googleSheetsAccessToken: newAccessToken,
      googleSheetsTokenExpiry: newTokenExpiry,
    })
    .where(eq(forms.id, formId));

  return newAccessToken;
}

/**
 * Get valid access token, refreshing if necessary
 */
async function getValidAccessToken(
  accessToken: string,
  refreshToken: string | null | undefined,
  tokenExpiry: Date | null | undefined,
  formId: string,
): Promise<string> {
  // Check if token is expired or about to expire (within 5 minutes)
  const now = new Date();
  const expiryThreshold = new Date(now.getTime() + 5 * 60 * 1000);

  if (tokenExpiry && new Date(tokenExpiry) < expiryThreshold) {
    if (!refreshToken) {
      throw new Error("Access token expired and no refresh token available");
    }
    console.log("Access token expired, refreshing...");
    return await refreshAccessToken(refreshToken, formId);
  }

  return accessToken;
}

/**
 * Get or create header row in spreadsheet, and add new headers if needed
 */
async function ensureHeaders(
  spreadsheetId: string,
  sheetName: string,
  headers: string[],
  accessToken: string,
): Promise<void> {
  // Get current values in first row
  const range = `${sheetName}!A1:ZZ1`;
  const getResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!getResponse.ok) {
    console.error("Failed to get headers:", await getResponse.text());
    throw new Error("Failed to check spreadsheet headers");
  }

  const getData = (await getResponse.json()) as ValueRange;
  const existingHeaders = getData.values?.[0] || [];

  // If no headers exist, create them
  if (existingHeaders.length === 0) {
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [headers],
        }),
      },
    );

    if (!updateResponse.ok) {
      console.error("Failed to set headers:", await updateResponse.text());
      throw new Error("Failed to set spreadsheet headers");
    }
    return;
  }

  // Check if there are new headers that don't exist yet
  const newHeaders = headers.filter(
    (header) => !existingHeaders.includes(header),
  );

  if (newHeaders.length > 0) {
    // Append new headers to the existing header row
    const updatedHeaders = [...existingHeaders, ...newHeaders];
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [updatedHeaders],
        }),
      },
    );

    if (!updateResponse.ok) {
      console.error("Failed to update headers:", await updateResponse.text());
      throw new Error("Failed to update spreadsheet headers");
    }

    console.log(`Added new headers to spreadsheet: ${newHeaders.join(", ")}`);
  }
}

// Only the fields this module reads off the Sheets API.
interface ValueRange {
  values?: string[][];
}

interface SpreadsheetInfo {
  sheets?: Array<{ properties?: { title?: string } }>;
}

/**
 * Append submission data to Google Sheet
 */
export async function syncGoogleSheets({
  spreadsheetId,
  accessToken,
  refreshToken,
  tokenExpiry,
  submissionData,
  submissionId,
  formId,
  userId,
}: SyncGoogleSheetsParams) {
  try {
    // Get valid access token (refresh if needed)
    const validToken = await getValidAccessToken(
      accessToken,
      refreshToken,
      tokenExpiry,
      formId,
    );

    // Get spreadsheet info to find sheet name
    const spreadsheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      },
    );

    if (!spreadsheetResponse.ok) {
      throw new Error("Failed to fetch spreadsheet info");
    }

    const spreadsheetInfo = (await spreadsheetResponse.json()) as SpreadsheetInfo;
    const sheet = spreadsheetInfo.sheets?.[0];
    const sheetName = sheet?.properties?.title || "Sheet1";

    // Prepare headers and values
    const headers = [
      "Submission ID",
      "Timestamp",
      ...Object.keys(submissionData),
    ];

    // Ensure headers exist (and add new ones if needed)
    await ensureHeaders(spreadsheetId, sheetName, headers, validToken);

    // Get current headers to ensure proper column alignment
    const headersRange = `${sheetName}!A1:ZZ1`;
    const headersResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headersRange)}`,
      {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      },
    );

    if (!headersResponse.ok) {
      throw new Error("Failed to fetch current headers");
    }

    const headersData = (await headersResponse.json()) as ValueRange;
    const currentHeaders = headersData.values?.[0] || [];

    // Create a map of submission data for easy lookup
    const dataMap: Record<string, any> = {
      "Submission ID": submissionId,
      Timestamp: new Date().toISOString(),
      ...submissionData,
    };

    // Build values array in the correct order based on current headers
    const values = currentHeaders.map((header: string) => {
      const value = dataMap[header];
      if (value === undefined || value === null) {
        return ""; // Empty cell for missing values
      }
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return String(value);
    });

    // Append the row
    const range = `${sheetName}!A:ZZ`;
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [values],
        }),
      },
    );

    if (!appendResponse.ok) {
      const error = await appendResponse.text();
      console.error("Failed to append row:", error);
      throw new Error("Failed to append row to spreadsheet");
    }

    console.log(
      `Successfully synced submission ${submissionId} to Google Sheets`,
    );

    await recordIntegrationUsage({
      userId,
      formId,
      submissionId,
      integration: "google-sheets",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Google Sheets sync error:", error);
    // Don't throw - we don't want to fail the submission if sync fails
    return { success: false, error: error.message };
  }
}
