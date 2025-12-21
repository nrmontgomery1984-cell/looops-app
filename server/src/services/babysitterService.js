// Babysitter Service - Google Sheets data layer
import { readSheet, appendToSheet, updateSheet, deleteRow } from "../integrations/googleSheets.js";

const SHEET_ID = process.env.SHEETS_BABYSITTER_ID;

/**
 * Get all caregivers from the Caregivers tab
 */
export async function getCaregivers() {
  if (!SHEET_ID) {
    console.warn("SHEETS_BABYSITTER_ID not configured, using local data");
    return null;
  }

  const rows = await readSheet(SHEET_ID, "Caregivers!A2:D");
  if (!rows) return [];

  return rows.map((row, index) => ({
    id: row[0] || `caregiver_${index}`,
    name: row[1] || "",
    hourlyRate: parseFloat(row[2]) || 15,
    active: row[3]?.toLowerCase() !== "false",
    rowIndex: index + 2, // For updates/deletes
  }));
}

/**
 * Add a new caregiver
 */
export async function addCaregiver(caregiver) {
  if (!SHEET_ID) return null;

  const values = [[
    caregiver.id,
    caregiver.name,
    caregiver.hourlyRate,
    caregiver.active ? "TRUE" : "FALSE",
  ]];

  await appendToSheet(SHEET_ID, "Caregivers!A:D", values);
  return caregiver;
}

/**
 * Update a caregiver's rate
 */
export async function updateCaregiver(caregiverId, updates) {
  if (!SHEET_ID) return null;

  // Find the caregiver row
  const caregivers = await getCaregivers();
  const caregiver = caregivers.find((c) => c.id === caregiverId);
  if (!caregiver) throw new Error("Caregiver not found");

  const values = [[
    caregiver.id,
    updates.name || caregiver.name,
    updates.hourlyRate ?? caregiver.hourlyRate,
    updates.active !== undefined ? (updates.active ? "TRUE" : "FALSE") : (caregiver.active ? "TRUE" : "FALSE"),
  ]];

  await updateSheet(SHEET_ID, `Caregivers!A${caregiver.rowIndex}:D${caregiver.rowIndex}`, values);
  return { ...caregiver, ...updates };
}

/**
 * Get all sessions from the Sessions tab
 */
export async function getSessions(options = {}) {
  if (!SHEET_ID) {
    console.warn("SHEETS_BABYSITTER_ID not configured, using local data");
    return null;
  }

  const rows = await readSheet(SHEET_ID, "Sessions!A2:G");
  if (!rows) return [];

  let sessions = rows.map((row, index) => ({
    id: row[0] || `session_${index}`,
    date: row[1] || "",
    caregiverId: row[2] || "",
    caregiverName: row[3] || "",
    hours: parseFloat(row[4]) || 0,
    rateAtTime: parseFloat(row[5]) || 15,
    amount: parseFloat(row[4]) * parseFloat(row[5]) || 0,
    notes: row[6] || "",
    rowIndex: index + 2,
  }));

  // Apply filters
  if (options.startDate) {
    sessions = sessions.filter((s) => s.date >= options.startDate);
  }
  if (options.endDate) {
    sessions = sessions.filter((s) => s.date <= options.endDate);
  }
  if (options.caregiverId) {
    sessions = sessions.filter((s) => s.caregiverId === options.caregiverId);
  }

  return sessions;
}

/**
 * Add a new session
 */
export async function addSession(session) {
  if (!SHEET_ID) return null;

  const values = [[
    session.id,
    session.date,
    session.caregiverId,
    session.caregiverName,
    session.hours,
    session.rateAtTime,
    session.notes || "",
  ]];

  await appendToSheet(SHEET_ID, "Sessions!A:G", values);
  return session;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId) {
  if (!SHEET_ID) return null;

  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error("Session not found");

  await deleteRow(SHEET_ID, "Sessions", session.rowIndex);
  return true;
}

/**
 * Calculate summary statistics
 */
export async function getSummary() {
  const sessions = await getSessions();
  if (!sessions) return null;

  const now = new Date();
  const weekStart = getWeekStart(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const formatDate = (d) => d.toISOString().split("T")[0];

  const calcPeriod = (startDate) => {
    const periodSessions = sessions.filter((s) => s.date >= formatDate(startDate));
    const byCaregiver = {};

    periodSessions.forEach((s) => {
      if (!byCaregiver[s.caregiverName]) {
        byCaregiver[s.caregiverName] = { hours: 0, amount: 0 };
      }
      byCaregiver[s.caregiverName].hours += s.hours;
      byCaregiver[s.caregiverName].amount += s.amount;
    });

    return {
      totalHours: periodSessions.reduce((sum, s) => sum + s.hours, 0),
      totalAmount: periodSessions.reduce((sum, s) => sum + s.amount, 0),
      sessionCount: periodSessions.length,
      byCaregiver,
    };
  };

  return {
    currentWeek: calcPeriod(weekStart),
    currentMonth: calcPeriod(monthStart),
    yearToDate: calcPeriod(yearStart),
  };
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
