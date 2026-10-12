// The only file in the /attendance module that tallks to prisma (db)
import { prisma } from "../../config/db.js";

export const attendanceRepository = {
  // The record with no check-out yet
  findOpenByEmployee: (employeeId) =>
    prisma.attendanceRecord.findFirst({
      where: { employeeId, checkOut: null },
    }),

  create: (employeeId, checkIn) =>
    prisma.attendanceRecord.create({ data: { employeeId, checkIn } }),

  close: (id, checkOut) =>
    prisma.attendanceRecord.update({ where: { id }, data: { checkOut } }),

  findInRange: (employeeId, from, to) =>
    prisma.attendanceRecord.findMany({
      where: { employeeId, checkIn: { gte: from, lt: to } },
      orderBy: { checkIn: "asc" },
    }),
};
