// Leave module logic
import { AppError } from "../../utils/errors.js";
import { leaveRepository } from "./leave.repository.js";
import {
  countLeaveDays,
  hasOverlap,
  hasSufficientBalance,
  isPastDate,
  remainingDays,
} from "./leave.rules.js";

export const leaveService = {
  // Retrieves all available leave types from the repository
  listTypes: () => leaveRepository.findTypes(),

  // Fetches leave balances for an employee in a given year and calculates the remaining days for each balance
  async getMyBalances(employeeId, year = new Date().getUTCFullYear()) {
    const balances = await leaveRepository.findBalancesByEmployee(
      employeeId,
      year,
    );
    return balances.map((balance) => ({
      ...balance,
      remainingDays: remainingDays(balance),
    }));
  },

  // Retrieves all submitted leave requests for a specific employee.
  listMyRequests: (employeeId) =>
    leaveRepository.findRequestsByEmployee(employeeId),

  // Validates leave request constraints (date range, past dates, overlap, balance sufficiency) and creates a new leave application record
  async createRequest(employeeId, { leaveTypeId, startDate, endDate, reason }) {
    if (endDate < startDate) {
      throw AppError.badRequest("endDate cannot be before startDate");
    }
    // Balances are per calendar year, so a request stays inside one year
    if (startDate.getUTCFullYear() !== endDate.getUTCFullYear()) {
      throw AppError.badRequest(
        "A leave request cannot span two years. Submit one request per year",
      );
    }
    if (isPastDate(startDate)) {
      throw AppError.badRequest("Leave cannot start in the past");
    }

    const days = countLeaveDays(startDate, endDate);
    if (days === 0) {
      throw AppError.badRequest("The selected dates have no working days");
    }

    const leaveType = await leaveRepository.findTypeById(leaveTypeId);
    if (!leaveType) throw AppError.notFound("Leave type not found");

    const existing =
      await leaveRepository.findActiveRequestsByEmployee(employeeId);
    if (hasOverlap({ startDate, endDate }, existing)) {
      throw AppError.conflict(
        "These dates overlap with another pending or approved leave request",
      );
    }

    const year = startDate.getUTCFullYear();
    const balance = await leaveRepository.findBalance(
      employeeId,
      leaveTypeId,
      year,
    );
    if (!hasSufficientBalance(balance, days)) {
      throw AppError.badRequest("Not enough leave balance", {
        requestedDays: days,
        remainingDays: remainingDays(balance),
      });
    }

    return leaveRepository.createRequest({
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      days,
      reason,
    });
  },
};
