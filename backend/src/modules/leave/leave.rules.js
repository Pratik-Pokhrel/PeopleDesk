// public leave rules go here, all dates are treated as UTC calendar days
// 0 = sunday ..... 6 = saturday

const WEEKEND_DAYS = [0, 6];

// number of working days from start to end
export function countLeaveDays(startDate, endDate) {
  let days = 0;
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    if (!WEEKEND_DAYS.includes(cursor.getUTCDay())) days += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

// two ranges overlap when each one starts before the other one ends
// "existing" is a list of { startDate, endDate }
export function hasOverlap({ startDate, endDate }, existing) {
  return existing.some(
    (other) => other.startDate <= endDate && other.endDate >= startDate,
  );
}

export function remainingDays(balance) {
  return balance ? balance.totalDays - balance.usedDays : 0;
}

export function hasSufficientBalance(balance, daysRequested) {
  return remainingDays(balance) >= daysRequested;
}

export function isPastDate(date, now = new Date()) {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return date.getTime() < today;
}
