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

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const normalizedPath = path.startsWith("http")
    ? path
    : path.startsWith("/api/")
      ? path
      : path.startsWith("/")
        ? `/api${path}`
        : `/api/${path}`;
  const authToken =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("nido_auth_token")
      : null;
  const response = await fetch(`${API_BASE}${normalizedPath}`, {
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
