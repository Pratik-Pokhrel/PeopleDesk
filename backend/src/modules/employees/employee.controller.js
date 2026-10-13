// This file is responsible for translating the HTTP requests to service calls and back, and Express forward the thrown errors on its own

import { employeeService } from "./employee.service.js";

export const employeeController = {
  // Retrieves a complete list of all employees and returns them in the HTTP response body
  async list(req, res) {
    const employees = await employeeService.list();
    res.json({ data: employees });
  },

  // Fetches a specific employee by ID, enforcing field-level permissions based on the requesting user's role
  async getOne(req, res) {
    const employee = await employeeService.getByIdFor(
      req.user,
      req.validated.params.id,
    );
    res.json({ data: employee });
  },

  // Creates a new employee record using validated request payload data and returns it with a 201 Created status
  async create(req, res) {
    const employee = await employeeService.create(req.validated.body);
    res.status(201).json({ data: employee });
  },

  // Updates an existing employee's details after verifying authorization rules for the target record
  async update(req, res) {
    const employee = await employeeService.update(
      req.user,
      req.validated.params.id,
      req.validated.body,
    );
    res.json({ data: employee });
  },

  // Performs a soft delete by marking the specified employee as inactive while preserving their audit trail
  async deactivate(req, res) {
    const employee = await employeeService.deactivate(
      req.user,
      req.validated.params.id,
    );
    res.json({ data: employee });
  },
};
