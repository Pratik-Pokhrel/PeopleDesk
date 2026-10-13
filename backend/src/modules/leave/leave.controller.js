// Translates the HTTp requests to leave service calls and back
import { leaveService } from "./leave.service.js";

export const leaveController = {
  // Fetches all the available leave types
  async listTypes(req, res) {
    const types = await leaveService.listTypes();
    res.json({ data: types });
  },

  // Leave balances of the logged in employee for a year (defaults to this year)
  async myBalances(req, res) {
    const balances = await leaveService.getMyBalances(
      req.user.id,
      req.validated.query.year,
    );
    res.json({ data: balances });
  },

  // Submits a new leave request and returns it with a 201 status code
  async createRequest(req, res) {
    const request = await leaveService.createRequest(
      req.user.id,
      req.validated.body,
    );
    res.status(201).json({ data: request });
  },

  // Lists all leave requests submitted by the logged in employee
  async myRequests(req, res) {
    const requests = await leaveService.listMyRequests(req.user.id);
    res.json({ data: requests });
  },

  // Pending requests waiting for the logged in manager or admin
  async pending(req, res) {
    const requests = await leaveService.listPending(req.user);
    res.json({ data: requests });
  },

  // Sets or overrides total leave allowance for a specific employee, leave type, and calendar year
  async setBalance(req, res) {
    const balance = await leaveService.setBalance(req.validated.body);
    res.json({ data: balance });
  },

  // Approves a pending leave request and updates the employee's used leave days balance
  async approve(req, res) {
    const request = await leaveService.approve(
      req.user,
      req.validated.params.id,
    );
    res.json({ data: request });
  },

  // Rejects a pending leave request without modifying the employee's leave balance
  async reject(req, res) {
    const request = await leaveService.reject(
      req.user,
      req.validated.params.id,
    );
    res.json({ data: request });
  },

  // Cancels an active or pending leave request and restores any previously deducted leave days
  async cancel(req, res) {
    const request = await leaveService.cancel(
      req.user,
      req.validated.params.id,
    );
    res.json({ data: request });
  },
};
