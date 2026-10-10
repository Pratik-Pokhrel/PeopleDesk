// This file is responsible for translating the HTTP requests to service calls and back, and Express forward the thrown errors on its own

import { employeeService } from "./employee.service.js";

export const employeeController = {
  async list(req, res) {
    const employees = await employeeService.list();
    res.json({ data: employees });
  },

  async getOne(req, res) {
    const employee = await employeeService.getByIdFor(
      req.user,
      req.validated.params.id,
    );
    res.json({ data: employee });
  },

  async create(req, res) {
    const employee = await employeeService.create(req.validated.body);
    res.status(201).json({ data: employee });
  },

  async update(req, res) {
    const employee = await employeeService.update(
      req.user,
      req.validated.params.id,
      req.validated.body,
    );
    res.json({ data: employee });
  },

  async deactivate(req, res) {
    const employee = await employeeService.deactivate(
      req.user,
      req.validated.params.id,
    );
    res.json({ data: employee });
  },
};
