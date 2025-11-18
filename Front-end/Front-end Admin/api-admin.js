const API_BASE = "http://127.0.0.1:8000";
const API_V1_PREFIX = "/api/v1";

function getAdminAccessToken() {
  return window.sessionStorage.getItem("accessToken");
}

async function adminApiRequest(path, options = {}) {
  const token = getAdminAccessToken();
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
    throw new Error(`Admin API ${response.status}: ${errorText}`);
  }

  return response.json();
}

