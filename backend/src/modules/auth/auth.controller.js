// Translates HTTP requests to auth service calls and back
import { authService } from "./auth.service.js";

export const authController = {
  async login(req, res) {
    const result = await authService.login(req.validated.body);
    res.json({ data: result });
  },

  async register(req, res) {
    const result = await authService.register(req.validated.body);
    res.status(201).json({ data: result });
  },

  // req.user is set by the authenticate middleware, so nothing to look up here
  me(req, res) {
    res.json({ data: req.user });
  },
};
