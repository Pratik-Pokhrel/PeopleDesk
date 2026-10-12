import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/roles.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { leaveController } from "./leave.controller.js";
import {
  balanceQuerySchema,
  createLeaveRequestSchema,
  requestIdParamSchema,
  setBalanceSchema,
} from "./leave.validation.js";

const router = Router();

router.use(authenticate); // Every leave route needs a logged in user

router.get("/types", leaveController.listTypes);

router.get(
  "/balances/me",
  validate({ query: balanceQuerySchema }),
  leaveController.myBalances,
);

router.put(
  "/balances",
  requireRole("ADMIN"),
  validate({ body: setBalanceSchema }),
  leaveController.setBalance,
);

router.post(
  "/requests",
  validate({ body: createLeaveRequestSchema }),
  leaveController.createRequest,
);

router.get("/requests/me", leaveController.myRequests);

// Review flow. Who may review a specific request (own manager or admin) is checked in the service
router.get(
  "/requests/pending",
  requireRole("ADMIN", "MANAGER"),
  leaveController.pending,
);

router.post(
  "/requests/:id/approve",
  requireRole("ADMIN", "MANAGER"),
  validate({ params: requestIdParamSchema }),
  leaveController.approve,
);

router.post(
  "/requests/:id/reject",
  requireRole("ADMIN", "MANAGER"),
  validate({ params: requestIdParamSchema }),
  leaveController.reject,
);

// The owner withdraws their own pending request
router.patch(
  "/requests/:id/cancel",
  validate({ params: requestIdParamSchema }),
  leaveController.cancel,
);

export default router;
