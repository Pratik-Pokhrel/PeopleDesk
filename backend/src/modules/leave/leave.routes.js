import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { leaveController } from "./leave.controller.js";
import {
  balanceQuerySchema,
  createLeaveRequestSchema,
} from "./leave.validation.js";

const router = Router();

router.use(authenticate); // Every leave route needs a logged in user

router.get("/types", leaveController.listTypes);

router.get(
  "/balances/me",
  validate({ query: balanceQuerySchema }),
  leaveController.myBalances,
);

router.post(
  "/requests",
  validate({ body: createLeaveRequestSchema }),
  leaveController.createRequest,
);

router.get("/requests/me", leaveController.myRequests);

export default router;
