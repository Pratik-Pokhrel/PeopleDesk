import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { notFoundHandler, errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import employeeRoutes from "./modules/employees/employee.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import leaveRoutes from "./modules/leave/leave.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
if (env.NODE_ENV !== "test") app.use(morgan("dev"));

// Express 5 forwards errors from async handlers on its own, so no try/catch needed
app.get("/api/health", async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "up" });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);

// These 2 error handlers must always come at the end, after defining all routes
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
