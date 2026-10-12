// Translates the HTTp requests to leave service calls and back
import { leaveService } from "./leave.service.js";

export const leaveController = {
  // Fetches all the available leave types and returns them in the HTTP response
  async listTypes(req, res) {
    const types = await leaveService.listTypes();
    res.json({ data: types });
  },

  // Retrieves the leave balances for the authenticated employee for a specified year
  async myBalances(req, res) {
    const balances = await leaveService.getMyBalances(
      req.user.id,
      req.validated.query.year,
    );
    res.json({ data: balances });
  },

  // Submits a new leave application for the authenticated employee and returns the created record with a 201 status code
  async createRequest(req, res) {
    const request = await leaveService.createRequest(
      req.user.id,
      req.validated.body,
    );
    res.status(201).json({ data: request });
  },

  // Lists all leave requests submitted by the authenticated employee
  async myRequests(req, res) {
    const requests = await leaveService.listMyRequests(req.user.id);
    res.json({ data: requests });
  },
};
