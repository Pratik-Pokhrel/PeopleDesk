import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { employeeController } from "./employee.controller.js";
import { createEmployeeSchema } from "./employee.validation.js";

const router = Router();

router.get("/", employeeController.list);
router.post(
  "/",
  validate({ body: createEmployeeSchema }),
  employeeController.create,
);

export default router;
