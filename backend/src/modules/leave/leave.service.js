// Leave module logic
import { AppError } from "../../utils/errors.js";
import { employeeService } from "../employees/employee.service.js";
import { leaveRepository } from "./leave.repository.js";
import {
  assertCanCancel,
  assertCanReview,
  assertPending,
  countLeaveDays,
  hasOverlap,
  hasSufficientBalance,
  isPastDate,
  remainingDays,
} from "./leave.rules.js";

async function ensureBalances(employeeId, year) {
  const types = await leaveRepository.findTypes();
  await leaveRepository.createMissingBalances(employeeId, year, types);
}

// Loads a request and checks that the reviewer is allowed to act on it and it is still pending
async function loadReviewable(reviewer, requestId) {
  const request = await leaveRepository.findRequestById(requestId);
  if (!request) throw AppError.notFound("Leave request not found");

  const requester = await employeeService.getById(request.employeeId);
  assertCanReview(reviewer, requester);
  assertPending(request);

  return request;
}

export const leaveService = {
  // Retrieves all available leave types from the repository
  listTypes: () => leaveRepository.findTypes(),

  // Fetches leave balances for an employee in a given year and adds the remaining days
  async getMyBalances(employeeId, year = new Date().getUTCFullYear()) {
    await ensureBalances(employeeId, year);
    const balances = await leaveRepository.findBalancesByEmployee(
      employeeId,
      year,
    );
    return balances.map((balance) => ({
      ...balance,
      remainingDays: remainingDays(balance),
    }));
  },

  // Retrieves all submitted leave requests for a specific employee
  listMyRequests: (employeeId) =>
    leaveRepository.findRequestsByEmployee(employeeId),

  // Validates the request (date range, past dates, overlap, balance) and creates it as PENDING
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
    await ensureBalances(employeeId, year);
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

  // Pending requests a reviewer can act on: their direct reports (manager) or everyone (admin)
  async listPending(reviewer) {
    const people =
      reviewer.role === "ADMIN"
        ? await employeeService.list()
        : await employeeService.listReports(reviewer.id);

    // Nobody sees their own request in the approval list, even an admin
    const reviewable = people.filter((person) => person.id !== reviewer.id);
    const byId = new Map(reviewable.map((person) => [person.id, person]));

    const requests = await leaveRepository.findPendingByEmployeeIds([
      ...byId.keys(),
    ]);

    return requests.map((request) => {
      const { id, firstName, lastName, department } = byId.get(
        request.employeeId,
      );
      return { ...request, employee: { id, firstName, lastName, department } };
    });
  },

  /* Approving does two writes that must succeed together: mark the request APPROVED and
     add its days to the balance. They run in one DB transaction, so if the balance check
     fails the status change is rolled back too.
     The balance is checked again here because several PENDING requests can exist at once
     and only the approved ones count as used
  */
  async approve(reviewer, requestId) {
    const request = await loadReviewable(reviewer, requestId);
    const year = request.startDate.getUTCFullYear();

    return leaveRepository.transaction(async (repo) => {
      const claimed = await repo.markReviewed(
        request.id,
        "APPROVED",
        reviewer.id,
      );
      if (!claimed) {
        throw AppError.conflict(
          "This request was just reviewed by someone else",
        );
      }

      const balance = await repo.findBalance(
        request.employeeId,
        request.leaveTypeId,
        year,
      );
      if (!hasSufficientBalance(balance, request.days)) {
        throw AppError.badRequest("Not enough leave balance to approve", {
          requestedDays: request.days,
          remainingDays: remainingDays(balance),
        });
      }

      const deducted = await repo.addUsedDays(balance, request.days);
      if (!deducted) {
        throw AppError.conflict(
          "The leave balance changed while approving. Please try again",
        );
      }

      return repo.findRequestById(request.id);
    });
  },

  // Admin sets the yearly total for one leave type. usedDays is never touched.
  async setBalance({ employeeId, leaveTypeId, year, totalDays }) {
    await employeeService.getById(employeeId); // 404 for an unknown employee
    if (!(await leaveRepository.findTypeById(leaveTypeId))) {
      throw AppError.notFound("Leave type not found");
    }

    await ensureBalances(employeeId, year);
    const balance = await leaveRepository.findBalance(
      employeeId,
      leaveTypeId,
      year,
    );

    if (totalDays < balance.usedDays) {
      throw AppError.badRequest(
        "totalDays cannot be lower than days already used",
        {
          usedDays: balance.usedDays,
        },
      );
    }
    return leaveRepository.updateBalanceTotal(balance.id, totalDays);
  },

  // Rejecting never touches the balance, so a single write is enough
  async reject(reviewer, requestId) {
    const request = await loadReviewable(reviewer, requestId);

    const updated = await leaveRepository.markReviewed(
      request.id,
      "REJECTED",
      reviewer.id,
    );
    if (!updated) {
      throw AppError.conflict("This request was just reviewed by someone else");
    }
    return leaveRepository.findRequestById(request.id);
  },

  // The owner can withdraw a request that is still pending. Nothing was deducted yet
  async cancel(user, requestId) {
    const request = await leaveRepository.findRequestById(requestId);
    if (!request) throw AppError.notFound("Leave request not found");

    assertCanCancel(user, request);
    assertPending(request);

    const updated = await leaveRepository.markCancelled(request.id);
    if (!updated) {
      throw AppError.conflict("This request was just reviewed by someone else");
    }
    return leaveRepository.findRequestById(request.id);
  },
};
