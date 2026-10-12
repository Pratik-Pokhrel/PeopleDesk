// Translates HTTP requests to attendance service calls and back
import { attendanceService } from "./attendance.service.js";

export const attendanceController = {
  // Logs a new check-in timestamp for the authenticated employee and returns the record with a 201 status code
  async checkIn(req, res) {
    const record = await attendanceService.checkIn(req.user.id);
    res.status(201).json({ data: record });
  },

  // Updates the active attendance session with a check-out timestamp for the authenticated employee
  async checkOut(req, res) {
    const record = await attendanceService.checkOut(req.user.id);
    res.json({ data: record });
  },

  // Fetches all attendance records for the logged-in employee for a specific month
  async listMine(req, res) {
    const records = await attendanceService.listMine(
      req.user.id,
      req.validated.query.month,
    );
    res.json({ data: records });
  },

  // Generates a aggregated monthly attendance report for the authenticated user or a target employee based on permissions
  async summary(req, res) {
    const { employeeId = req.user.id, month } = req.validated.query;
    const summary = await attendanceService.getMonthlySummary(
      req.user,
      employeeId,
      month,
    );
    res.json({ data: summary });
  },
};
