//api.ts
const getAPIBase = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  }
  if (import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const protocol = window.location.protocol || "http:";
    if (host === "localhost" || host === "127.0.0.1") {
      return `${protocol}//${host}:5000`;
    }

    return window.location.origin.replace(/\/+$/, "");
  }

  return "http://localhost:5000";
};

const API_BASE = getAPIBase();

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export const apiBaseUrl = API_BASE;

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const token =
    localStorage.getItem("nido_auth_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const headers = new Headers(options.headers || {});

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestBody =
    options.body === undefined
      ? undefined
      : typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);

  const response = await fetch(
    `${
      import.meta.env.VITE_API_URL || "https://nido-backend-iztc.onrender.com"
    }${endpoint}`,
    {
      ...options,
      headers,
      credentials: "include",
      body: requestBody,
    },
  );

  if (!response.ok) {
    let errorMessage = "Request failed";

    try {
      const errorData = await response.json();
      errorMessage = errorData?.error || errorData?.message || errorMessage;
    } catch {}

    if (response.status === 401) {
      throw new Error("Authentication required");
    }

    console.error("API ERROR RESPONSE:", response.status, errorMessage);

    throw new Error(errorMessage);
  }

  return response.json();
}
