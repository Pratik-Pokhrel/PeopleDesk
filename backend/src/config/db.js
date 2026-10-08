import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// This function is called once at startup so a faulty DB URL or some bug would fail the app early
export async function connectDB() {
  await prisma.$connect();
  console.log("Connected to DB");
}

export async function disconnectDB() {
  await prisma.$disconnect();
  console.log("Disconnected from DB");
}
