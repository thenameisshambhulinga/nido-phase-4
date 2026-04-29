const BASE_URL = "http://localhost:5000/api";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "API Error");
  }
  return data.data;
};

export const API = {
  // CLIENTS
  getClients: async () => handleResponse(await fetch(`${BASE_URL}/clients`)),

  createClient: async (payload) =>
    handleResponse(
      await fetch(`${BASE_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    ),

  updateClient: async (id, payload) =>
    handleResponse(
      await fetch(`${BASE_URL}/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    ),

  deleteClient: async (id) =>
    handleResponse(
      await fetch(`${BASE_URL}/clients/${id}`, {
        method: "DELETE",
      }),
    ),

  // VENDORS
  getVendors: async () => handleResponse(await fetch(`${BASE_URL}/vendors`)),

  // PRODUCTS
  getProducts: async () => handleResponse(await fetch(`${BASE_URL}/products`)),

  // ORDERS
  getOrders: async () => handleResponse(await fetch(`${BASE_URL}/orders`)),
};
