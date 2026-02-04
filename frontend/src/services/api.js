/**
 * ALL frontend API calls here.
 * Frontend kabhi backend logic nahi jaane – sirf ye file use karo.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

function headers(includeAuth = true) {
  const h = { "Content-Type": "application/json" };
  if (includeAuth && getToken()) h["Authorization"] = `Bearer ${getToken()}`;
  return h;
}

/** Parse FastAPI error response (detail can be string or array of { msg }). */
function parseErrorDetail(body) {
  if (!body || typeof body !== "object") return "Something went wrong";
  const d = body.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d.length) {
    const first = d[0];
    return first?.msg ?? first?.loc?.join?.(" ") ?? String(first);
  }
  return body.message || "Something went wrong";
}

// --- Auth ---
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: headers(false),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  const data = await res.json();
  if (data.access_token) localStorage.setItem("token", data.access_token);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function register(email, password, fullName) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: headers(false),
    body: JSON.stringify({ email, password, full_name: fullName || null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorDetail(err) || "Registration failed");
  }
  const data = await res.json();
  if (data.access_token) localStorage.setItem("token", data.access_token);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, { headers: headers() });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

// --- Files ---
export async function getFiles() {
  const res = await fetch(`${API_BASE}/api/files/`, { headers: headers() });
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

export async function getStorage() {
  const res = await fetch(`${API_BASE}/api/files/storage`, { headers: headers() });
  if (!res.ok) throw new Error("Failed to fetch storage");
  return res.json();
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorDetail(err) || "Upload failed");
  }
  return res.json();
}

export async function downloadFile(fileId) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const nameMatch = disposition && disposition.match(/filename="?([^";]+)"?/);
  const filename = nameMatch ? nameMatch[1] : "download";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function deleteFile(fileId) {
  const res = await fetch(`${API_BASE}/api/files/${fileId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

// --- History ---
export async function getHistory(limit = 50) {
  const res = await fetch(`${API_BASE}/api/auth/history?limit=${limit}`, { headers: headers() });
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

// --- Admin ---
export async function adminStats() {
  const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: headers() });
  if (!res.ok) throw new Error("Admin access required");
  return res.json();
}

export async function adminUsers() {
  const res = await fetch(`${API_BASE}/api/admin/users`, { headers: headers() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}
export async function clearHistory() {
  const res = await fetch(`${API_BASE}/api/auth/history/clear`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error("Failed to clear history");
  return res.json();
}
