// The only file inside /employee that talks to the prisma (and prisma is responsible to relay the info to the database)
import { prisma } from "../../config/db.js";

// password (hashed password) is never sent to the client
const publicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  department: true,
  isActive: true,
  managerId: true,
  createdAt: true,
  updatedAt: true,
};

export const employeeRepository = {
  findAll: () =>
    prisma.employee.findMany({
      select: publicSelect,
      orderBy: { createdAt: "asc" },
    }),

  findById: (id) =>
    prisma.employee.findUnique({ where: { id }, select: publicSelect }),

  findByEmail: (email) => prisma.employee.findUnique({ where: { email } }),

  create: (data) => prisma.employee.create({ data, select: publicSelect }),

  update: (id, data) =>
    prisma.employee.update({ where: { id }, data, select: publicSelect }),

  countActiveReports: (managerId) =>
    prisma.employee.count({ where: { managerId, isActive: true } }),
};
