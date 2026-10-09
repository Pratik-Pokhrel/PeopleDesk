// This  file is purely used for database seeding purposes only like populating the db with EMPLOYEE, ADMIN, MANAGER and so on
import "dotenv/config.js";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEV_PASSWORD = "321@drowssap";

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10); // 10 is the cost factor

  // Returns the upsert promise, so callers can await it and get the employee back.
  // Running the seed twice is safe: an existing email is left untouched.
  const upsertEmployee = (data) =>
    prisma.employee.upsert({
      where: { email: data.email },
      update: {},
      create: { ...data, passwordHash },
    });

  await upsertEmployee({
    email: "admin@peopledesk.test",
    firstName: "root",
    lastName: "user",
    role: "ADMIN",
    department: "System-Admin",
  });

  const manager = await upsertEmployee({
    email: "manager@peopledesk.test",
    firstName: "Pratik",
    lastName: "Pokhrel",
    role: "MANAGER",
    department: "Engineering",
  });

  const team = [
    {
      email: "alice@peopledesk.test",
      firstName: "Alice",
      lastName: "Employee",
    },
    { email: "bob@peopledesk.test", firstName: "Bob", lastName: "Employee" },
    {
      email: "carol@peopledesk.test",
      firstName: "Carol",
      lastName: "Employee",
    },
  ];

  for (const member of team) {
    await upsertEmployee({
      ...member,
      role: "EMPLOYEE",
      department: "Engineering",
      managerId: manager.id,
    });
  }

  console.log(
    `Seeded 1 admin, 1 manager and ${team.length} employees. Password for all: ${DEV_PASSWORD}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
