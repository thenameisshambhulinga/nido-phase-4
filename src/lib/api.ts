const getAPIBase = (): string => {
  // Development: use localhost backend
  if (
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return "http://localhost:5000/api";
  }

  // Environment variables
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL;

  // Production
  return "https://nido-backend-iztc.onrender.com/api";
};

const API_BASE = getAPIBase();

type RequestOptions = RequestInit & {
  body?: unknown;
};

export const apiBaseUrl = API_BASE;

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const authToken =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("nido_auth_token")
      : null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        payload?.message ||
        `Request failed: ${response.status} ${response.statusText}`,
    );
  }

  return (payload?.data ?? payload) as T;
}
