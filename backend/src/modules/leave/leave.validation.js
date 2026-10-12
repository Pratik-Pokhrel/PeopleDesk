import { z } from "zod";

// "2026-10-15" -> Date at midnight UTC
const dateSchema = z.iso
  .date()
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.uuid(),
  startDate: dateSchema,
  endDate: dateSchema,
  reason: z.string().trim().min(1).max(500).optional(),
});

export const balanceQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});
