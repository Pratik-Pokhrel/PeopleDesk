import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

const router = Router();

// register api router
router.post(
  "/register",
  validate({ body: registerSchema }),
  authController.register,
);

// login api route
router.post("/login", validate({ body: loginSchema }), authController.login);

router.get("/me", authenticate, authController.me);

export default router;
