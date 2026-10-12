// leave seed helper, keeping seed.js minimal by calling this after the employees are created

// It uses upsert everywhere, so running seed.js twice won't create duplicates

const LEAVE_TYPES = [
  { name: "Annual Leave", defaultDays: 18 },
  { name: "Sick Leave", defaultDays: 12 },
  { name: "Casual Leave", defaultDays: 6 },
];

export async function seedLeave(prisma) {
  for (const type of LEAVE_TYPES) {
    await prisma.leaveType.upsert({
      where: { name: type.name },
      update: { defaultDays: type.defaultDays },
      create: type,
    });
  }

  const types = await prisma.leaveType.findMany();
  const employees = await prisma.employee.findMany({ select: { id: true } });
  const year = new Date().getUTCFullYear();

  for (const employee of employees) {
    for (const type of types) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: employee.id,
            leaveTypeId: type.id,
            year,
          },
        },
        update: {}, // never overwrite a balance that already has usage
        create: {
          employeeId: employee.id,
          leaveTypeId: type.id,
          year,
          totalDays: type.defaultDays,
        },
      });
    }
  }

  console.log(
    `Seeded ${types.length} leave types and balances for ${employees.length} employees (${year})`,
  );
}
