// public leave rules go here, all dates are treated as UTC calendar days
// 0 = sunday ..... 6 = saturday

import { AppError } from "../../utils/errors.js";

const WEEKEND_DAYS = [0, 6];

// Number of working days from start to end (both included)
export function countLeaveDays(startDate, endDate) {
  let days = 0;
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    if (!WEEKEND_DAYS.includes(cursor.getUTCDay())) days += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

// Two ranges overlap when each one starts before the other one ends
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

// A request can only be reviewed or cancelled while it is still pending
export function assertPending(request) {
  if (request.status !== "PENDING") {
    throw AppError.conflict(
      `This request is already ${request.status.toLowerCase()}`,
    );
  }
}

// Only the requester's manager or an admin can review. Nobody reviews their own request
export function assertCanReview(reviewer, requester) {
  if (reviewer.id === requester.id) {
    throw AppError.forbidden("You cannot review your own leave request");
  }

  const isAdmin = reviewer.role === "ADMIN";
  const isTheirManager = requester.managerId === reviewer.id;
  if (!isAdmin && !isTheirManager) {
    throw AppError.forbidden(
      "Only the employee's manager or an admin can review this request",
    );
  }
}

// Employees can only cancel their own requests
export function assertCanCancel(user, request) {
  if (request.employeeId !== user.id) {
    throw AppError.forbidden("You can only cancel your own leave requests");
  }
}
