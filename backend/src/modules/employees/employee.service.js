// This file handles all the business rules and respective logic for the employees, no Express or Prisma code here
import bcrypt from "bcryptjs";
import { AppError } from "../../utils/errors.js";
import { employeeRepository } from "./employee.repository.js";

const MANAGING_ROLES = ["MANAGER", "ADMIN"];

// <<<<<<  ------------Internal Helper functions -------------- >>>>>>> //

// Get employee by id, throw 404 error if not found
async function getById(id) {
  const employee = await employeeRepository.findById(id);
  if (!employee) throw AppError.notFound("Employee not found");
  return employee;
}

// One manager per employee and that manager must be an active MANAGER or ADMIN
async function assertCanBeManager(managerId, employeeId = null) {
  if (managerId === employeeId) {
    throw AppError.badRequest("An employee can't be their own manager");
  }

  const manager = await employeeRepository.findById(managerId);
  if (!manager || !manager.isActive || !MANAGING_ROLES.includes(manager.role)) {
    throw AppError.badRequest(
      "managerId must belong to an active MANAGER OR ADMIN",
    );
  }
}

// Stops from orphaning employees when a manger is demoted or deactivated
async function assertNoActiveReports(employeeId) {
  const count = await employeeRepository.countActiveReports(employeeId);

  if (count > 0) {
    throw AppError.conflict(
      `This employee still manages ${count} number of active employee(s). Reassign them first`,
    );
  }
}

// <<<<<  ------------ API handler -------------- >>>>>>> //
export const employeeService = {
  list: () => employeeRepository.findAll(),

  // Direct reports of a manager, used by the leave module for the approval list
  listReports: (managerId) => employeeRepository.findReports(managerId),

  getById,

  // Employees can only view other employees where as managers and admins can view all
  async getByIdFor(viewer, id) {
    if (viewer.role === "EMPLOYEE" && viewer.id !== id) {
      throw AppError.forbidden();
    }
    return getById(id);
  },

  // Used by the "auth middleware" on every request : return null instead of throwing
  async findActiveById(id) {
    const employee = await employeeRepository.findById(id);
    return employee?.isActive ? employee : null;
  },

  // used by the "auth module" for login only. Includes passwordHash, which shouldn't be  returned to the client
  findCredentialsByEmail: (email) => employeeRepository.findByEmail(email),

  // Create a new employee, throw 409 if email already exists
  async create({ password, managerId, ...data }) {
    if (await employeeRepository.findByEmail(data.email)) {
      throw AppError.conflict("An employee with this email already exists");
    }

    // One manager per employee, and that manager must be an active MANAGER or ADMIN
    if (managerId) {
      const manager = await employeeRepository.findById(managerId);
      if (!manager || !manager.isActive || manager.role === "EMPLOYEE") {
        throw AppError.badRequest(
          "Manager/managerId must belong to an active MANAGER or ADMIN",
        );
      }
    }

    // here the raw password is hashed before being sent to the repository for storage in the database
    const passwordHash = await bcrypt.hash(password, 10); // 10 is the cost factor

    return employeeRepository.create({ ...data, managerId, passwordHash });
  },

  // Update employee details, where actor is the logged in "ADMIN" (req.user)
  async update(actor, id, changes) {
    if (Object.keys(changes).length === 0) {
      throw AppError.badRequest("Provide at least one field to update");
    }
    const employee = await getById(id);

    if (changes.role && changes.role !== employee.role) {
      // Stops the admin from locking everyone out
      if (actor.id === id) {
        throw AppError.forbidden("You cannot change your own role");
      }

      if (changes.role == "EMPLOYEE") await assertNoActiveReports(id);
    }

    if (changes.managerId) await assertCanBeManager(changes.managerId, id);

    return employeeRepository.update(id, changes);
  },

  // Deactivate (soft Delete) : the row entry in the table stays so attendance and leave history keep pointing at a real employee
  async deactivate(actor, id) {
    if (actor.id === id) {
      throw AppError.badRequest("You cannot deactivate your own account");
    }
    const employee = await getById(id);
    if (!employee.isActive) {
      throw AppError.conflict("Employee is already deactivated");
    }
    await assertNoActiveReports(id);

    return employeeRepository.update(id, { isActive: false });
  },
};
