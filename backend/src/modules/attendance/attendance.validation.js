import { z } from "zod";

// "2026-10"
const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must look like YYYY-MM");

export const monthQuerySchema = z.object({
  month: monthSchema.optional(),
});

// employeeId is optional, it defaults to the logged in user
export const summaryQuerySchema = z.object({
  employeeId: z.uuid().optional(),
  month: monthSchema.optional(),
});
