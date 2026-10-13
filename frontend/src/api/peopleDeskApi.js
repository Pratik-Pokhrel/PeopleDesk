const API_URL = (
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`
).replace(/\/+$/, "");

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("The server returned an invalid response.");
  }

  // Keep session expiry handling centralized in AuthProvider.
  if (response.status === 401) window.dispatchEvent(new Event("auth:expired"));
  if (!response.ok) {
    const message =
      payload.error?.message || "The request could not be completed.";
    const details = payload.error?.details;
    const detailMessages =
      details && typeof details === "object"
        ? Object.entries(details)
            .flatMap(([field, messages]) =>
              Array.isArray(messages)
                ? messages.map((detail) => `${field}: ${detail}`)
                : [],
            )
            .join(" ")
        : "";
    throw new Error(detailMessages ? `${message}. ${detailMessages}` : message);
  }

  if (!Object.hasOwn(payload, "data")) {
    throw new Error("The server returned an invalid response.");
  }

  return payload.data;
}

function jsonRequest(method, token, body) {
  return {
    method,
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}` },
  };
}

function queryString(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const employeesApi = {
  list: (token) => request("/employees", token),
  create: (token, employee) =>
    request("/employees", token, jsonRequest("POST", token, employee)),
  update: (token, id, changes) =>
    request(
      `/employees/${encodeURIComponent(id)}`,
      token,
      jsonRequest("PATCH", token, changes),
    ),
  deactivate: (token, id) =>
    request(`/employees/${encodeURIComponent(id)}/deactivate`, token, {
      method: "PATCH",
    }),
};

export const attendanceApi = {
  checkIn: (token) =>
    request("/attendance/check-in", token, { method: "POST" }),
  checkOut: (token) =>
    request("/attendance/check-out", token, { method: "POST" }),
  mine: (token, month) =>
    request(`/attendance/me${queryString({ month })}`, token),
  summary: (token, params = {}) =>
    request(`/attendance/summary${queryString(params)}`, token),
};

export const leaveApi = {
  types: (token) => request("/leave/types", token),
  balances: (token, year) =>
    request(`/leave/balances/me${queryString({ year })}`, token),
  createRequest: (token, body) =>
    request("/leave/requests", token, jsonRequest("POST", token, body)),
  mine: (token) => request("/leave/requests/me", token),
  pending: (token) => request("/leave/requests/pending", token),
  approve: (token, id) =>
    request(`/leave/requests/${encodeURIComponent(id)}/approve`, token, {
      method: "POST",
    }),
  reject: (token, id) =>
    request(`/leave/requests/${encodeURIComponent(id)}/reject`, token, {
      method: "POST",
    }),
  cancel: (token, id) =>
    request(`/leave/requests/${encodeURIComponent(id)}/cancel`, token, {
      method: "PATCH",
    }),
};
