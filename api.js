const base = "/api";
const TOKEN_KEY = "purrcare_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized = () => {};

export function setUnauthorizedHandler(fn) {
  onUnauthorized = typeof fn === "function" ? fn : () => {};
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handle(res, options = {}) {
  const { skipLogoutOn401 } = options;
  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || "Invalid response" };
  }

  if (!res.ok) {
    if (res.status === 401 && !skipLogoutOn401 && getToken()) {
      onUnauthorized();
    }
    throw new Error(data?.message || res.statusText || "Request failed");
  }

  return data;
}

export const api = {
  health: () => fetch(`${base}/health`).then(handle),

  signup: (body) =>
    fetch(`${base}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handle(r, { skipLogoutOn401: true })),

  login: (body) =>
    fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handle(r, { skipLogoutOn401: true })),

  forgotPassword: (body) =>
    fetch(`${base}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handle(r, { skipLogoutOn401: true })),
  
  resetPassword: (body) =>
  fetch(`${base}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => handle(r, { skipLogoutOn401: true })),

  me: () =>
    fetch(`${base}/auth/me`, {
      headers: { ...authHeaders() },
    }).then(handle),

  updateProfile: (body) =>
    fetch(`${base}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle),

  changePassword: (body) =>
    fetch(`${base}/auth/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle),

  dashboard: () =>
    fetch(`${base}/dashboard`, {
      headers: { ...authHeaders() },
    }).then(handle),

  listCats: () =>
    fetch(`${base}/cats`, {
      headers: { ...authHeaders() },
    }).then(handle),

  getCat: (id) =>
    fetch(`${base}/cats/${id}`, {
      headers: { ...authHeaders() },
    }).then(handle),

  createCat: (body) =>
    fetch(`${base}/cats`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle),

  updateCat: (id, body) =>
    fetch(`${base}/cats/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle),

  deleteCat: (id) =>
    fetch(`${base}/cats/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    }).then(handle),

  listLogs: (catId, category) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : "";
    return fetch(`${base}/cats/${catId}/logs${q}`, {
      headers: { ...authHeaders() },
    }).then(handle);
  },

  createLog: (catId, body) =>
    fetch(`${base}/cats/${catId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle),

  updateLog: (logId, body) =>
    fetch(`${base}/logs/${logId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle),

  deleteLog: (logId) =>
    fetch(`${base}/logs/${logId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    }).then(handle),

  listVetLogs: (catId) =>
    fetch(`${base}/cats/${catId}/logs?category=vet`, {
      headers: { ...authHeaders() },
    }).then(handle),

  createVetLog: (catId, body) =>
    fetch(`${base}/cats/${catId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ ...body, category: "vet" }),
    }).then(handle),

    generateMedicalRecordPdf: async (catId, body) => {
    const res = await fetch(`${base}/cats/${catId}/medical-record-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { message: text || "Could not generate PDF" };
      }

      if (res.status === 401 && getToken()) {
        onUnauthorized();
      }

      throw new Error(data?.message || res.statusText);
    }

    return await res.blob();
  },

  chat: (messages) =>
    fetch(`${base}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    }).then((r) => handle(r, { skipLogoutOn401: true })),
};