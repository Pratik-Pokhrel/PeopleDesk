// login and Register logic sits here in this file : checks the email and password and sign the JWT

import bcrypt from "bcryptjs";
import { AppError } from "../../utils/errors.js";
import { signToken } from "../../utils/jwt.js";
import { employeeService } from "../employees/index.js";

/* DUMMY_HASH : A security hardening step
   This is used against when the email doesn't exist, so the response time is the same
   for all types of users(emails), even if the entered email isn't there in the db,
   It avoids leaking info about the emails that are already registered in the db
*/

const DUMMY_HASH = bcrypt.hashSync("Not-a-real-password", 10);

export const authService = {
  // Login Function//
  async login({ email, password }) {
    const record = await employeeService.findCredentialsByEmail(email);

    const passwordMatches = await bcrypt.compare(
      password,
      record?.passwordHash ?? DUMMY_HASH,
    );

    // One generic mesaage for every failure, for security purpose
    if (!record || !record.isActive || !passwordMatches) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const { passwordHash, ...user } = record;
    return { token: signToken(user.id), user };
  },

  // Register Function - By default, the registered user is an EMPLOYEE//
  // Hashing, the duplicate email check and all these are handled by "employeeService.create"
  async register(data) {
    const user = await employeeService.create({ ...data, role: "EMPLOYEE" });
    return { token: signToken(user.id), user };
  },
};
