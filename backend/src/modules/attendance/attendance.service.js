// All the attendance logic sits here - this module only stores an employeeId
// Whenever it needs employee info, it asks the employee module through its public service, never by querying the employees table

import { AppError } from "../../utils/errors.js";
import { employeeService } from "../employees/employee.service.js";
import { attendanceRepository } from "./attendance.repository.js";
import {
  assertCanCheckIn,
  assertCanCheckOut,
  calculateHours,
  currentMonth,
  monthRange,
  summarizeMonth,
} from "./attendance.rules.js";

// Employees see only themselves, managers see their direct reports, admins see everyone
async function assertCanView(viewer, employeeId) {
  if (viewer.id === employeeId) return;
  if (viewer.role === "EMPLOYEE") throw AppError.forbidden();

  // Also gives a clean 404 for an unknown id
  const target = await employeeService.getById(employeeId);

  if (viewer.role === "MANAGER" && target.managerId !== viewer.id) {
    throw AppError.forbidden(
      "You can only view attendance of your own team/group",
    );
  }
}

export const attendanceService = {
  // Validates that no active session exists and creates a new check-in attendance record for the employee
  async checkIn(employeeId) {
    const open = await attendanceRepository.findOpenByEmployee(employeeId);
    assertCanCheckIn(open);

    return attendanceRepository.create(employeeId, new Date());
  },

  // Verifies an open session exists, records the check-out timestamp, and calculates the total session hours
  async checkOut(employeeId) {
    const open = await attendanceRepository.findOpenByEmployee(employeeId);
    assertCanCheckOut(open);

    const closed = await attendanceRepository.close(open.id, new Date());
    return {
      ...closed,
      hours: calculateHours(closed.checkIn, closed.checkOut),
    };
  },

  // The logged in employee's own sessions for a month (defaults to this month)
  async listMine(employeeId, month = currentMonth()) {
    const { from, to } = monthRange(month);
    const records = await attendanceRepository.findInRange(
      employeeId,
      from,
      to,
    );

    return records.map((record) => ({
      ...record,
      hours: record.checkOut
        ? calculateHours(record.checkIn, record.checkOut)
        : null,
    }));
  },

  // Checks view permissions and returns an aggregated monthly attendance summary for the target employee
  async getMonthlySummary(viewer, employeeId, month = currentMonth()) {
    await assertCanView(viewer, employeeId);

    const { from, to } = monthRange(month);
    const records = await attendanceRepository.findInRange(
      employeeId,
      from,
      to,
    );

    return { employeeId, month, ...summarizeMonth(records) };
  },
};
