// The only file in leave/ that talks to the prisma/db
import { prisma } from "../../config/db.js";

export const leaveRepository = {
  findTypes: () => prisma.leaveType.findMany({ orderBy: { name: "asc" } }),

  findTypeById: (id) => prisma.leaveType.findUnique({ where: { id } }),

  findBalance: (employeeId, leaveTypeId, year) =>
    prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year },
      },
    }),

  findBalanceByEmployee: (employeeId, leaveTypeId, year) =>
    prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
      orderBy: { leaveType: { name: "asc" } },
    }),

  // requests that still block the calendar
  findActiveRequestsByEmployee: (employeeId) =>
    prisma.leaveRequest.findMany({
      where: { employeeId, status: { in: ["PENDING", "APPROVED"] } },
    }),

  findRequestsByEmployee: (employeeId) =>
    prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
    }),

  createRequest: (data) =>
    prisma.leaveRequest.create({ data, include: { leaveType: true } }),
};
