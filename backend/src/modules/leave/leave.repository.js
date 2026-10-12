// The only file in leave/ that talks to the prisma/db
import { prisma } from "../../config/db.js";

/* Every method lives in buildRepository(db), where db is either the normal prisma client
   or a transaction client. That way the service can run several repository calls
   inside one DB transaction without ever importing prisma itself
*/
function buildRepository(db) {
  return {
    findTypes: () => db.leaveType.findMany({ orderBy: { name: "asc" } }),

    findTypeById: (id) => db.leaveType.findUnique({ where: { id } }),

    findBalance: (employeeId, leaveTypeId, year) =>
      db.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year },
        },
      }),

    findBalancesByEmployee: (employeeId, year) =>
      db.leaveBalance.findMany({
        where: { employeeId, year },
        include: { leaveType: true },
        orderBy: { leaveType: { name: "asc" } },
      }),

    // skipDuplicates makes this safe to call on every request
    createMissingBalances: (employeeId, year, types) =>
      prisma.leaveBalance.createMany({
        data: types.map((t) => ({
          employeeId,
          leaveTypeId: t.id,
          year,
          totalDays: t.defaultDays,
        })),
        skipDuplicates: true,
      }),

    updateBalanceTotal: (id, totalDays) =>
      prisma.leaveBalance.update({
        where: { id },
        data: { totalDays },
        include: { leaveType: true },
      }),

    // Requests that still block the calendar
    findActiveRequestsByEmployee: (employeeId) =>
      db.leaveRequest.findMany({
        where: { employeeId, status: { in: ["PENDING", "APPROVED"] } },
      }),

    findRequestsByEmployee: (employeeId) =>
      db.leaveRequest.findMany({
        where: { employeeId },
        include: { leaveType: true },
        orderBy: { createdAt: "desc" },
      }),

    findRequestById: (id) =>
      db.leaveRequest.findUnique({
        where: { id },
        include: { leaveType: true },
      }),

    findPendingByEmployeeIds: (employeeIds) =>
      db.leaveRequest.findMany({
        where: { employeeId: { in: employeeIds }, status: "PENDING" },
        include: { leaveType: true },
        orderBy: { startDate: "asc" },
      }),

    createRequest: (data) =>
      db.leaveRequest.create({ data, include: { leaveType: true } }),

    /* Moves a PENDING request to APPROVED or REJECTED. The status check is part of the
       UPDATE itself, so two reviewers clicking at the same time can't both win.
       Returns true only if this call changed the row
    */
    async markReviewed(id, status, reviewerId) {
      const { count } = await db.leaveRequest.updateMany({
        where: { id, status: "PENDING" },
        data: { status, reviewedById: reviewerId, reviewedAt: new Date() },
      });
      return count === 1;
    },

    async markCancelled(id) {
      const { count } = await db.leaveRequest.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      return count === 1;
    },

    /* Optimistic lock: the update only applies if usedDays is still the value we read.
       If someone else touched the balance in between, count is 0 and we return false
    */
    async addUsedDays(balance, days) {
      const { count } = await db.leaveBalance.updateMany({
        where: { id: balance.id, usedDays: balance.usedDays },
        data: { usedDays: { increment: days } },
      });
      return count === 1;
    },
  };
}

export const leaveRepository = {
  ...buildRepository(prisma),

  // work receives a repository bound to the transaction. Throwing inside rolls everything back
  transaction: (work) => prisma.$transaction((tx) => work(buildRepository(tx))),
};
