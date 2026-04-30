const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://nido-backend-iztc.onrender.com/api";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API Error");
  return data.data;
};

const buildHeaders = (headers = {}) => {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("nido_auth_token")
      : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
};

export const API = {
  // CLIENTS
  getClients: () =>
    fetch(`${BASE_URL}/clients`, { headers: buildHeaders() }).then(
      handleResponse,
    ),

  // VENDORS
  getVendors: () =>
    fetch(`${BASE_URL}/vendors`, { headers: buildHeaders() }).then(
      handleResponse,
    ),

  // PRODUCTS
  getProducts: () =>
    fetch(`${BASE_URL}/products`, { headers: buildHeaders() }).then(
      handleResponse,
    ),

  // ORDERS
  getOrders: () =>
    fetch(`${BASE_URL}/orders`, { headers: buildHeaders() }).then(
      handleResponse,
    ),
};
