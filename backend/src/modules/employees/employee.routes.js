import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/roles.middleware.js";
import { employeeController } from "./employee.controller.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  idParamSchema,
} from "./employee.validation.js";

const router = Router(); // Express Router object

router.use(authenticate); // Every employee route needs a logged in user

router.get("/", requireRole("ADMIN", "MANAGER"), employeeController.list);

// User of any role can call this GET request
router.get(
  "/:id",
  validate({ params: idParamSchema }),
  employeeController.getOne,
);

router.post(
  "/",
  requireRole("ADMIN"),
  validate({ body: createEmployeeSchema }),
  employeeController.create,
);

router.patch(
  "/:id",
  requireRole("ADMIN"),
  validate({ params: idParamSchema, body: updateEmployeeSchema }),
  employeeController.update,
);

router.patch(
  "/:id/deactivate",
  requireRole("ADMIN"),
  validate({ params: idParamSchema }),
  employeeController.deactivate,
);

export default router;
