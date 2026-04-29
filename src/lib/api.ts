const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

type RequestOptions = RequestInit & {
  body?: unknown;
};

export const apiBaseUrl = API_BASE;

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
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
