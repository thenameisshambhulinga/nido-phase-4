const BASE_URL = "/api";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API Error");
  return data.data;
};

export const API = {
  // CLIENTS
  getClients: () => fetch(`${BASE_URL}/clients`).then(handleResponse),

  // VENDORS
  getVendors: () => fetch(`${BASE_URL}/vendors`).then(handleResponse),

  // PRODUCTS
  getProducts: () => fetch(`${BASE_URL}/products`).then(handleResponse),

  // ORDERS
  getOrders: () => fetch(`${BASE_URL}/orders`).then(handleResponse),
};
