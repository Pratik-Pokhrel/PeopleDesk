import { describe, it, expect } from "vitest";
import {
  assertCanCancel,
  assertCanReview,
  assertPending,
  countLeaveDays,
  hasOverlap,
  hasSufficientBalance,
  isPastDate,
  remainingDays,
} from "../../src/modules/leave/leave.rules.js";

const day = (iso) => new Date(`${iso}T00:00:00.000Z`);

describe("countLeaveDays", () => {
  it("counts every weekday in a Monday to Wednesday range", () => {
    expect(countLeaveDays(day("2030-03-04"), day("2030-03-06"))).toBe(3);
  });

  it("skips Saturday and Sunday", () => {
    // Fri 8th to Mon 11th: only Friday and Monday count
    expect(countLeaveDays(day("2030-03-08"), day("2030-03-11"))).toBe(2);
  });

  it("returns 0 for a weekend only range", () => {
    expect(countLeaveDays(day("2030-03-09"), day("2030-03-10"))).toBe(0);
  });
});

describe("hasOverlap", () => {
  const existing = [
    { startDate: day("2030-03-10"), endDate: day("2030-03-14") },
  ];

  it("detects a range that overlaps the middle", () => {
    const range = { startDate: day("2030-03-12"), endDate: day("2030-03-20") };
    expect(hasOverlap(range, existing)).toBe(true);
  });

  it("treats a shared boundary day as an overlap", () => {
    const range = { startDate: day("2030-03-14"), endDate: day("2030-03-15") };
    expect(hasOverlap(range, existing)).toBe(true);
  });

  it("allows a range right after the existing one", () => {
    const range = { startDate: day("2030-03-15"), endDate: day("2030-03-16") };
    expect(hasOverlap(range, existing)).toBe(false);
  });

  it("allows anything when there are no existing requests", () => {
    const range = { startDate: day("2030-03-12"), endDate: day("2030-03-13") };
    expect(hasOverlap(range, [])).toBe(false);
  });
});

describe("balance rules", () => {
  const balance = { totalDays: 10, usedDays: 7 };

  it("computes remaining days", () => {
    expect(remainingDays(balance)).toBe(3);
  });

  it("accepts a request that fits exactly", () => {
    expect(hasSufficientBalance(balance, 3)).toBe(true);
  });

  it("rejects a request that is one day too long", () => {
    expect(hasSufficientBalance(balance, 4)).toBe(false);
  });

  it("treats a missing balance as zero days", () => {
    expect(hasSufficientBalance(null, 1)).toBe(false);
  });
});

describe("isPastDate", () => {
  const now = new Date("2030-03-10T15:00:00.000Z");

  it("treats yesterday as past", () => {
    expect(isPastDate(day("2030-03-09"), now)).toBe(true);
  });

  it("treats today as allowed", () => {
    expect(isPastDate(day("2030-03-10"), now)).toBe(false);
  });
});

describe("review permissions", () => {
  const requester = { id: "e1", role: "EMPLOYEE", managerId: "m1" };

  it("lets the employee's own manager review", () => {
    expect(() =>
      assertCanReview({ id: "m1", role: "MANAGER" }, requester),
    ).not.toThrow();
  });

  it("lets an admin review", () => {
    expect(() =>
      assertCanReview({ id: "a1", role: "ADMIN" }, requester),
    ).not.toThrow();
  });

  it("blocks a manager of another team", () => {
    expect(() =>
      assertCanReview({ id: "m2", role: "MANAGER" }, requester),
    ).toThrowError(/manager or an admin/);
  });

  it("blocks self approval, even for an admin", () => {
    const admin = { id: "a1", role: "ADMIN", managerId: null };
    expect(() => assertCanReview(admin, admin)).toThrowError(/your own/);
  });
});

describe("request state rules", () => {
  it("only allows reviewing a pending request", () => {
    expect(() => assertPending({ status: "PENDING" })).not.toThrow();
    expect(() => assertPending({ status: "APPROVED" })).toThrowError(
      /approved/,
    );
  });

  it("only lets the owner cancel", () => {
    const request = { employeeId: "e1" };
    expect(() => assertCanCancel({ id: "e1" }, request)).not.toThrow();
    expect(() => assertCanCancel({ id: "e2" }, request)).toThrowError(/own/);
  });
});
