// This file handles all the business rules and respective logic for the employees, no Express or Prisma code here
import bcrypt from "bcryptjs";
import { AppError } from "../../utils/errors.js";
import { employeeRepository } from "./employee.repository.js";

export const employeeService = {
  list: () => employeeRepository.findAll(),

  // Get employee by ID, throw 404 if not found
  async getById(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw AppError.notFound(`Employee not found`);
    return employee;
  },

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
};
