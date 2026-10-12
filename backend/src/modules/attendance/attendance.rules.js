// Here lies the pure attendance rules
import { AppError } from "../../utils/errors.js";

const MS_PER_HOUR = 60 * 60 * 1000; // to convert time in decimal hours

const round2 = (n) => Math.round(n * 100) / 100; // convert floating popint to exactly 2 secimal places

// Hours between two timestamps, rounded to 2 decimals
export function calculateHours(checkIn, checkOut) {
  const ms = new Date(checkOut) - new Date(checkIn);
  if (ms < 0) {
    throw AppError.badRequest("CheckOut cannot be earlier than CheckIn");
  }
  return round2(ms / MS_PER_HOUR);
}

//a double check in guard : an open record means the employee never checked out
export function assertCanCheckIn(openRecord) {
  if (openRecord) {
    throw AppError.conflict("You are already checked in. Check out first");
  }
}

export function assertCanCheckOut(openRecord) {
  if (!openRecord) {
    throw AppError.conflict("You haven't checked in");
  }
}

// Conver the date into : "2026-10"
export function currentMonth(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

// "2026-10" -> { from 2026-10-01, to: 2026-11-01 }
// Everything is in UTC
export function monthRange(month) {
  const [year, m] = month.split("-").map(Number);
  return {
    from: new Date(Date.UTC(year, m - 1, 1)),
    to: new Date(Date.UTC(year, m, 1)),
  };
}

// Groups sessions by the day they started on and adds up closed sessions
// A session that is still open adds no hours yet, it is only counted in openSessions
export function summarizeMonth(records) {
  const byDay = new Map();
  let openSessions = 0;

  for (const record of records) {
    const date = record.checkIn.toISOString().slice(0, 10);
    const day = byDay.get(date) ?? { date, hours: 0, sessions: 0 };

    day.sessions += 1;
    if (record.checkOut) {
      day.hours += calculateHours(record.checkIn, record.checkOut);
    } else {
      openSessions += 1;
    }
    byDay.set(date, day);
  }

  const days = [...byDay.values()]
    .map((day) => ({ ...day, hours: round2(day.hours) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalHours: round2(days.reduce((sum, day) => sum + day.hours, 0)),
    daysPresent: days.length,
    openSessions,
    days,
  };
}
