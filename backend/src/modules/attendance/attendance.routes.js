import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { attendanceController } from "./attendance.controller.js";
import {
  monthQuerySchema,
  summaryQuerySchema,
} from "./attendance.validation.js";

const router = Router();

router.use(authenticate); // every attendance route needs a logged in user

router.post("/check-in", attendanceController.checkIn);
router.post("/check-out", attendanceController.checkOut);

router.get(
  "/me",
  validate({ query: monthQuerySchema }),
  attendanceController.listMine,
);

// Access rules (self, own team, admin) live in the service
router.get(
  "/summary",
  validate({ query: summaryQuerySchema }),
  attendanceController.summary,
);

export default router;
