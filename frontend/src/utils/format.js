// Concatenates an employee's first and last names, falling back to a default label if both are missing
export function fullName(person) {
  return (
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
    "Unknown employee"
  );
}

// Generates a up to two-character uppercase initials string from a person's first and last names
export function initials(person) {
  return [person?.firstName, person?.lastName]
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Formats a date value into a localized UTC calendar date string, returning a placeholder for invalid inputs
export function formatDate(
  value,
  options = { day: "numeric", month: "short", year: "numeric" },
) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat(undefined, {
    ...options,
    timeZone: "UTC",
  }).format(date);
}

// Formats a timestamp into a localized short time string (hours and minutes), returning a fallback for invalid inputs
export function formatTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatHours(value) {
  return typeof value === "number" ? `${value.toFixed(2)} h` : "--";
}
