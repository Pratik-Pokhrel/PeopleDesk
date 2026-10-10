import { z } from "zod";

const roleSchema = z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]);

export const idParamSchema = z.object({ id: z.uuid() });

export const createEmployeeSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
  department: z.string().trim().min(1).optional(),
  managerId: z.uuid().optional(),
});

/* Since it's a PATCH request, every field is optional - email and password are deliberately not updatable here,
   and unknown keys are dropped by Zod. "null" clears department or manager.
   And the service rejects any empty update
  */
export const updateEmployeeSchema = a
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    role: roleSchema,
    department: z.string().trim().min(1).nullable(),
    managerId: z.uuid().nullable(),
  })
  .partial();
