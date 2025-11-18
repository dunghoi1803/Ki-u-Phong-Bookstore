const API_BASE = "http://127.0.0.1:8000";
const API_V1_PREFIX = "/api/v1";

function getAccessToken() {
  return window.sessionStorage.getItem("accessToken");
}

async function apiRequest(path, options = {}) {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${API_V1_PREFIX}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API ${response.status}: ${errorText}`);
  }

  // Handle no-content or empty-body responses safely (e.g. DELETE 204)
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  return JSON.parse(text);
}
